/**
 * Live smoke test: makes a real video with ffmpeg, then drives every tool over stdio.
 */
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const dir = mkdtempSync(path.join(tmpdir(), "ffmpeg-mcp-test-"))
const source = path.join(dir, "source.mp4")
const trimmed = path.join(dir, "trimmed.mp4")
const audio = path.join(dir, "audio.mp3")
const thumb = path.join(dir, "thumb.png")
const small = path.join(dir, "small.mp4")
const converted = path.join(dir, "converted.mkv")

function sh(binary, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    child.on("error", reject)
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-500)))))
  })
}

await sh("ffmpeg", [
  "-y",
  "-f", "lavfi",
  "-i", "testsrc=size=320x240:rate=25",
  "-f", "lavfi",
  "-i", "sine=frequency=440:sample_rate=44100",
  "-t", "2",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  source,
])
if (!existsSync(source)) throw new Error("failed to create test video")

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, FFMPEG_MCP_ALLOWED_DIRS: dir },
})
let stderr = ""
child.stderr.on("data", (d) => {
  stderr += d.toString()
})

let buf = ""
const pending = new Map()
child.stdout.on("data", (d) => {
  buf += d.toString()
  let i
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim()
    buf = buf.slice(i + 1)
    if (!line) continue
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      continue
    }
    const resolve = pending.get(msg.id)
    if (resolve) {
      pending.delete(msg.id)
      resolve(msg)
    }
  }
})

function send(id, method, params) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 120000)
    pending.set(id, (m) => {
      clearTimeout(timer)
      if (m.error) reject(new Error(`${method} failed: ${JSON.stringify(m.error)}`))
      else resolve(m.result)
    })
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  })
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n")
}

function cleanup() {
  child.kill()
  rmSync(dir, { recursive: true, force: true })
}

const fail = (msg) => {
  console.error(`FAIL ${msg}`)
  console.error(stderr.trim())
  cleanup()
  process.exit(1)
}

async function call(id, name, args) {
  const result = await send(id, "tools/call", { name, arguments: args })
  const out = (result?.content ?? []).map((c) => c.text ?? "").join("\n")
  return { result, out }
}

try {
  const init = await send(1, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "1.0.0" },
  })
  if (!init?.serverInfo?.name) fail("initialize returned no serverInfo")
  notify("notifications/initialized", {})

  const { tools } = await send(2, "tools/list", {})
  const names = (tools ?? []).map((t) => t.name).sort()
  for (const wanted of ["compress", "convert", "extract_audio", "probe", "thumbnail", "trim"]) {
    if (!names.includes(wanted)) fail(`tools/list is missing ${wanted} (got: ${names.join(", ")})`)
  }
  console.log(`PASS tools=${names.length} [${names.join(", ")}]`)

  const probed = await call(3, "probe", { path: source })
  if (probed.result?.isError) fail(`probe failed: ${probed.out}`)
  const info = JSON.parse(probed.out)
  const video = info.streams.find((s) => s.type === "video")
  const audioStream = info.streams.find((s) => s.type === "audio")
  if (video?.width !== 320 || video?.height !== 240) fail(`unexpected video stream: ${probed.out}`)
  if (!audioStream) fail(`probe found no audio stream: ${probed.out}`)
  console.log(`PASS probe ${video.width}x${video.height} duration=${info.duration_seconds}s`)

  const cut = await call(4, "trim", { input: source, output: trimmed, start: "00:00:00.5", duration: "00:00:01" })
  if (cut.result?.isError) fail(`trim failed: ${cut.out}`)
  if (!existsSync(trimmed)) fail("trim did not create output")
  console.log("PASS trim stream copy")

  const extracted = await call(5, "extract_audio", { input: source, output: audio })
  if (extracted.result?.isError) fail(`extract_audio failed: ${extracted.out}`)
  const audioInfo = JSON.parse(extracted.out)
  if (!audioInfo.streams.some((s) => s.type === "audio")) fail(`no audio in extracted file: ${extracted.out}`)
  console.log("PASS extract_audio mp3")

  const shot = await call(6, "thumbnail", { input: source, output: thumb, timestamp: "00:00:01", width: 160 })
  if (shot.result?.isError) fail(`thumbnail failed: ${shot.out}`)
  if (!existsSync(thumb)) fail("thumbnail did not create output")
  console.log(`PASS thumbnail bytes=${JSON.parse(shot.out).size_bytes}`)

  const compressed = await call(7, "compress", { input: source, output: small, crf: 32, preset: "ultrafast" })
  if (compressed.result?.isError) fail(`compress failed: ${compressed.out}`)
  console.log(`PASS compress bytes=${JSON.parse(compressed.out).size_bytes}`)

  const convertedResult = await call(8, "convert", { input: source, output: converted, start: "00:00:00.5", duration: "00:00:00.5" })
  if (convertedResult.result?.isError) fail(`convert failed: ${convertedResult.out}`)
  if (!existsSync(converted)) fail("convert did not create output")
  console.log(`PASS convert format=${JSON.parse(convertedResult.out).format}`)

  const overwrite = await call(9, "trim", { input: source, output: trimmed, start: "00:00:00.5", duration: "00:00:00.5" })
  if (!overwrite.result?.isError) fail("existing output was overwritten without permission")
  console.log("PASS existing output protected")

  const outside = await call(10, "probe", { path: "/etc/hosts" })
  if (!outside.result?.isError) fail("path outside the allowed roots was not rejected")
  console.log("PASS outside path rejected")

  cleanup()
  process.exit(0)
} catch (e) {
  fail(e.message)
}
