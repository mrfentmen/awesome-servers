import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { existsSync, lstatSync, realpathSync, statSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"

class ToolError extends Error {}

const MAX_TIMEOUT = 600
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe"
const PRESETS = ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"] as const
const TIME_PATTERN = /^(?:\d{1,2}:){0,2}\d{1,2}(?:\.\d+)?$/
const AUDIO_CODECS: Record<string, string> = {
  ".mp3": "libmp3lame",
  ".wav": "pcm_s16le",
  ".m4a": "aac",
  ".aac": "aac",
  ".flac": "flac",
  ".ogg": "libvorbis",
  ".opus": "libopus",
}

function text(value: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] }
}

function fail(message: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: message }], isError: true }
}

function errorMessage(error: unknown): string {
  if (error instanceof ToolError || error instanceof Error) return `Error: ${error.message}`
  return `Error: ${String(error)}`
}

function allowedRoots(): string[] {
  const configured = process.env.FFMPEG_MCP_ALLOWED_DIRS
  const raw = configured ? configured.split(path.delimiter).filter(Boolean) : [homedir()]
  return raw.map((entry) => {
    const resolved = path.resolve(entry)
    try {
      return realpathSync(resolved)
    } catch {
      throw new ToolError(`allowed directory does not exist: ${resolved}`)
    }
  })
}

function insideRoots(target: string): boolean {
  return allowedRoots().some((root) => target === root || target.startsWith(root + path.sep))
}

function resolveInput(input: string, label: string): string {
  if (!input.trim()) throw new ToolError(`${label} is required`)
  const absolute = path.resolve(input)
  if (!existsSync(absolute)) throw new ToolError(`${label} does not exist: ${absolute}`)
  const real = realpathSync(absolute)
  if (!insideRoots(real)) throw new ToolError(`${label} is outside the allowed directories`)
  if (!statSync(real).isFile()) throw new ToolError(`${label} is not a file: ${real}`)
  return real
}

function resolveOutput(input: string, label: string): string {
  if (!input.trim()) throw new ToolError(`${label} is required`)
  const absolute = path.resolve(input)
  const parent = path.dirname(absolute)
  if (!existsSync(parent)) throw new ToolError(`output folder does not exist: ${parent}`)
  const realParent = realpathSync(parent)
  if (!insideRoots(realParent)) throw new ToolError(`${label} is outside the allowed directories`)
  const target = path.join(realParent, path.basename(absolute))
  if (existsSync(target)) {
    const existing = lstatSync(target)
    if (existing.isSymbolicLink()) throw new ToolError(`${label} must not be a symlink`)
    if (!existing.isFile()) throw new ToolError(`${label} exists and is not a regular file`)
  }
  return target
}

function ensureDifferent(input: string, output: string): void {
  if (input === output) throw new ToolError("output must not overwrite the input file")
}

function run(binary: string, args: string[], timeoutSeconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new ToolError(`${path.basename(binary)} timed out after ${timeoutSeconds}s`))
    }, timeoutSeconds * 1000)
    child.stdout.on("data", (data) => {
      stdout += data.toString()
    })
    child.stderr.on("data", (data) => {
      stderr += data.toString()
    })
    child.on("error", (error) => {
      clearTimeout(timer)
      reject(new ToolError(`could not run ${binary}: ${error.message}`))
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(stdout)
      else reject(new ToolError(`${path.basename(binary)} failed (exit ${code}): ${stderr.trim().split("\n").slice(-3).join(" | ")}`))
    })
  })
}

function fps(value: string | undefined): number | null {
  if (!value) return null
  const [num, den] = value.split("/").map(Number)
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null
  return Math.round((num / den) * 100) / 100
}

function checkOutputExtension(output: string, allowed: string[], label: string): void {
  const ext = path.extname(output).toLowerCase()
  if (!allowed.includes(ext)) throw new ToolError(`${label} must end in ${allowed.join(", ")}`)
}

async function probeFile(file: string): Promise<Record<string, unknown>> {
  const raw = await run(FFPROBE, ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], 60)
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new ToolError("ffprobe returned invalid JSON")
  }
  const format = (parsed.format ?? {}) as Record<string, unknown>
  const streams = ((parsed.streams ?? []) as Record<string, unknown>[]).map((stream) => ({
    index: stream.index,
    type: stream.codec_type,
    codec: stream.codec_name,
    width: stream.width ?? null,
    height: stream.height ?? null,
    fps: fps(stream.r_frame_rate as string | undefined),
    channels: stream.channels ?? null,
    sample_rate: stream.sample_rate ? Number(stream.sample_rate) : null,
    duration: stream.duration ? Number(stream.duration) : null,
  }))
  return {
    path: file,
    duration_seconds: format.duration ? Number(format.duration) : null,
    size_bytes: format.size ? Number(format.size) : statSync(file).size,
    bitrate: format.bit_rate ? Number(format.bit_rate) : null,
    format: format.format_name ?? null,
    streams,
  }
}

const inputArg = z.string().min(1).describe("Path to an existing media file inside the allowed directories")
const outputArg = z.string().min(1).describe("Path for the new file inside the allowed directories")
const timeoutArg = z.number().int().min(1).max(MAX_TIMEOUT).default(120).describe("Kill the job after this many seconds")
const overwriteArg = z.boolean().default(false).describe("Replace the output if it already exists")

export function createServer(): McpServer {
  const server = new McpServer({ name: "ffmpeg-mcp", version: "1.0.0" })

  server.tool(
    "probe",
    "Read a media file's format, duration, size, bitrate and streams (codec, resolution, fps, audio channels).",
    { path: inputArg },
    async ({ path: input }) => {
      try {
        return text(await probeFile(resolveInput(input, "input")))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "convert",
    "Convert a media file to another container/codec, optionally resizing, trimming or re-encoding.",
    {
      input: inputArg,
      output: outputArg,
      vcodec: z.string().max(40).default("").describe("Video codec, e.g. libx264, libvpx-vp9; empty = ffmpeg default"),
      acodec: z.string().max(40).default("").describe("Audio codec, e.g. aac, libopus; empty = ffmpeg default"),
      crf: z.number().int().min(0).max(63).nullable().default(null).describe("Quality 0-63 (lower is better); null = codec default"),
      preset: z.enum(PRESETS).nullable().default(null).describe("x264/x265 speed preset; null = codec default"),
      scale: z.string().max(20).regex(/^\d+:-?\d+$|^-?\d+:\d+$/).nullable().default(null).describe('Resize, e.g. "1280:-2"; null = keep size'),
      start: z.string().max(20).regex(TIME_PATTERN).or(z.literal("")).default("").describe("Seek before reading, e.g. 00:00:05"),
      duration: z.string().max(20).regex(TIME_PATTERN).or(z.literal("")).default("").describe("How much to keep, e.g. 00:00:10"),
      timeout: timeoutArg,
      overwrite: overwriteArg,
    },
    async ({ input, output, vcodec, acodec, crf, preset, scale, start, duration, timeout, overwrite }) => {
      try {
        const source = resolveInput(input, "input")
        const target = resolveOutput(output, "output")
        ensureDifferent(source, target)
        if (existsSync(target) && !overwrite) throw new ToolError(`output already exists: ${target}`)
        const args = [overwrite ? "-y" : "-n"]
        if (start) args.push("-ss", start)
        args.push("-i", source)
        if (duration) args.push("-t", duration)
        if (vcodec) args.push("-c:v", vcodec)
        if (acodec) args.push("-c:a", acodec)
        if (crf !== null) args.push("-crf", String(crf))
        if (preset) args.push("-preset", preset)
        if (scale) args.push("-vf", `scale=${scale}`)
        args.push(target)
        await run(FFMPEG, args, timeout)
        return text(await probeFile(target))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "extract_audio",
    "Pull the audio out of a video into MP3, WAV, M4A, AAC, FLAC, OGG or Opus.",
    {
      input: inputArg,
      output: outputArg,
      timeout: timeoutArg,
      overwrite: overwriteArg,
    },
    async ({ input, output, timeout, overwrite }) => {
      try {
        const source = resolveInput(input, "input")
        const target = resolveOutput(output, "output")
        ensureDifferent(source, target)
        checkOutputExtension(target, Object.keys(AUDIO_CODECS), "audio output")
        if (existsSync(target) && !overwrite) throw new ToolError(`output already exists: ${target}`)
        const codec = AUDIO_CODECS[path.extname(target).toLowerCase()]
        await run(FFMPEG, [overwrite ? "-y" : "-n", "-i", source, "-vn", "-c:a", codec, target], timeout)
        return text(await probeFile(target))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "thumbnail",
    "Save one frame from a video as a PNG or JPEG at a chosen time and width.",
    {
      input: inputArg,
      output: outputArg,
      timestamp: z.string().max(20).regex(TIME_PATTERN).default("00:00:01").describe("Frame time, e.g. 00:00:03"),
      width: z.number().int().min(16).max(4096).default(640).describe("Output width in pixels; height follows the aspect ratio"),
      timeout: timeoutArg,
      overwrite: overwriteArg,
    },
    async ({ input, output, timestamp, width, timeout, overwrite }) => {
      try {
        const source = resolveInput(input, "input")
        const target = resolveOutput(output, "output")
        ensureDifferent(source, target)
        checkOutputExtension(target, [".png", ".jpg", ".jpeg"], "image output")
        if (existsSync(target) && !overwrite) throw new ToolError(`output already exists: ${target}`)
        await run(
          FFMPEG,
          [overwrite ? "-y" : "-n", "-ss", timestamp, "-i", source, "-frames:v", "1", "-vf", `scale=${width}:-2`, target],
          timeout
        )
        return text({ path: target, width, size_bytes: statSync(target).size })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "trim",
    "Cut a section out of a media file. Stream copy is fast; re-encode gives exact cut points.",
    {
      input: inputArg,
      output: outputArg,
      start: z.string().max(20).regex(TIME_PATTERN).describe("Start time, e.g. 00:00:05"),
      duration: z.string().max(20).regex(TIME_PATTERN).describe("Length to keep, e.g. 00:00:10"),
      reencode: z.boolean().default(false).describe("Re-encode for exact cuts instead of copying streams"),
      timeout: timeoutArg,
      overwrite: overwriteArg,
    },
    async ({ input, output, start, duration, reencode, timeout, overwrite }) => {
      try {
        const source = resolveInput(input, "input")
        const target = resolveOutput(output, "output")
        ensureDifferent(source, target)
        if (existsSync(target) && !overwrite) throw new ToolError(`output already exists: ${target}`)
        const args = [overwrite ? "-y" : "-n", "-ss", start, "-i", source, "-t", duration]
        if (!reencode) args.push("-c", "copy")
        args.push(target)
        await run(FFMPEG, args, timeout)
        return text(await probeFile(target))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "compress",
    "Shrink a video with H.264 CRF compression and AAC audio.",
    {
      input: inputArg,
      output: outputArg,
      crf: z.number().int().min(0).max(51).default(28).describe("Quality 0-51; 23 is high quality, 28 is smaller, 32 is rough"),
      preset: z.enum(PRESETS).default("medium").describe("Speed/size trade-off"),
      audio_bitrate: z.string().max(10).regex(/^\d+k$/).default("128k").describe('AAC bitrate, e.g. "128k"'),
      timeout: timeoutArg,
      overwrite: overwriteArg,
    },
    async ({ input, output, crf, preset, audio_bitrate, timeout, overwrite }) => {
      try {
        const source = resolveInput(input, "input")
        const target = resolveOutput(output, "output")
        ensureDifferent(source, target)
        if (existsSync(target) && !overwrite) throw new ToolError(`output already exists: ${target}`)
        await run(
          FFMPEG,
          [overwrite ? "-y" : "-n", "-i", source, "-c:v", "libx264", "-crf", String(crf), "-preset", preset, "-c:a", "aac", "-b:a", audio_bitrate, target],
          timeout
        )
        return text(await probeFile(target))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  return server
}
