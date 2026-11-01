import { spawn, spawnSync } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** Everything that differs between the Lobster and the Goose runner. */
export interface RunnerConfig {
  language: string
  /** Env var that overrides the binary path, e.g. LOBSTER_BIN. */
  binEnv: string
  /** Binary looked up on PATH when the env var is unset. */
  defaultBin: string
  /** Source file extension including the dot. */
  extension: string
  /** How the toolchain separates program args from compiler args. */
  argSeparator: string | null
  /** Where to get the toolchain. */
  installHint: string
}

export const GOOSE: RunnerConfig = {
  language: "Goose",
  binEnv: "GOOSE_BIN",
  defaultBin: "goose",
  extension: ".goose",
  argSeparator: "--",
  installHint:
    "build it from https://github.com/aardappel/goose (git clone, then cmake -B build -DCMAKE_BUILD_TYPE=Release -DGOOSE_BUILTIN_LIBS=all && cmake --build build --config Release), then put `goose` on PATH or set GOOSE_BIN=/full/path/to/goose",
}

const MAX_STREAM_CHARS = 20000
const DEFAULT_TIMEOUT_MS = 10000

export class ToolchainMissingError extends Error {
  constructor(readonly config: RunnerConfig, readonly bin: string) {
    super(
      `The ${config.language} toolchain was not found (tried "${bin}"). ` +
        `Install it: ${config.installHint}. ` +
        `You can also point ${config.binEnv} at the binary.`,
    )
    this.name = "ToolchainMissingError"
  }
}

export interface RunResult {
  bin: string
  exitCode: number | null
  signal: NodeJS.Signals | null
  timedOut: boolean
  durationMs: number
  stdout: string
  stderr: string
  truncated: boolean
}

export interface RunOptions {
  code: string
  args?: string[]
  timeoutMs?: number
}

function resolveBin(config: RunnerConfig): string {
  const override = process.env[config.binEnv]
  return override && override.trim() !== "" ? override.trim() : config.defaultBin
}

/** Run a program from source. Throws ToolchainMissingError when the binary is absent. */
export async function runProgram(config: RunnerConfig, options: RunOptions): Promise<RunResult> {
  const bin = resolveBin(config)
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const dir = await mkdtemp(join(tmpdir(), `${config.defaultBin}-run-`))
  const file = join(dir, `main${config.extension}`)

  try {
    await writeFile(file, options.code, "utf8")
    const argv = [file]
    if (options.args && options.args.length > 0) {
      if (config.argSeparator) argv.push(config.argSeparator)
      argv.push(...options.args)
    }
    return await spawnCollect(config, bin, argv, dir, timeoutMs)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function spawnCollect(
  config: RunnerConfig,
  bin: string,
  argv: string[],
  cwd: string,
  timeoutMs: number,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    let stdout = ""
    let stderr = ""
    let truncated = false
    let timedOut = false
    let settled = false

    const child = spawn(bin, argv, { cwd, stdio: ["ignore", "pipe", "pipe"] })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill("SIGKILL")
    }, timeoutMs)

    const collect = (chunk: Buffer, into: "out" | "err"): void => {
      const target = into === "out" ? stdout : stderr
      if (target.length >= MAX_STREAM_CHARS) {
        truncated = true
        return
      }
      const next = target + chunk.toString()
      if (next.length > MAX_STREAM_CHARS) {
        truncated = true
        if (into === "out") stdout = next.slice(0, MAX_STREAM_CHARS)
        else stderr = next.slice(0, MAX_STREAM_CHARS)
        return
      }
      if (into === "out") stdout = next
      else stderr = next
    }

    child.stdout.on("data", (c: Buffer) => collect(c, "out"))
    child.stderr.on("data", (c: Buffer) => collect(c, "err"))

    child.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      if (e.code === "ENOENT") reject(new ToolchainMissingError(config, bin))
      else reject(e)
    })

    child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      resolve({
        bin,
        exitCode: code,
        signal,
        timedOut,
        durationMs: Date.now() - started,
        stdout,
        stderr,
        truncated,
      })
    })
  })
}

export interface ToolchainStatus {
  bin: string
  found: boolean
  origin: "env" | "path"
  detail: string
}

/**
 * Probe the toolchain without compiling anything. `--help` exits fast on both
 * compilers; the point is only to tell "missing" apart from "present".
 */
export function checkToolchain(config: RunnerConfig): ToolchainStatus {
  const override = process.env[config.binEnv]
  const fromEnv = Boolean(override && override.trim() !== "")
  const bin = resolveBin(config)
  const probe = spawnSync(bin, ["--help"], { timeout: 5000, encoding: "utf8" })

  if (probe.error && (probe.error as NodeJS.ErrnoException).code === "ENOENT") {
    return {
      bin,
      found: false,
      origin: fromEnv ? "env" : "path",
      detail: `not found. ${config.installHint}`,
    }
  }
  if (probe.error) {
    return {
      bin,
      found: false,
      origin: fromEnv ? "env" : "path",
      detail: `could not be started: ${probe.error.message}`,
    }
  }
  const firstLine = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  return {
    bin,
    found: true,
    origin: fromEnv ? "env" : "path",
    detail: firstLine ? `first line of --help: ${firstLine}` : `exit code ${String(probe.status)}`,
  }
}

export function formatStatus(config: RunnerConfig, status: ToolchainStatus): string {
  if (!status.found) {
    return (
      `${config.language} toolchain: NOT FOUND\n` +
      `Looked for: ${status.bin} (from ${status.origin === "env" ? config.binEnv : "PATH"})\n` +
      `Install: ${config.installHint}`
    )
  }
  return (
    `${config.language} toolchain: found\n` +
    `Binary: ${status.bin} (from ${status.origin === "env" ? config.binEnv : "PATH"})\n` +
    `Probe: ${status.detail}`
  )
}

export function formatResult(result: RunResult): string {
  const head = result.timedOut
    ? `Timed out after ${result.durationMs} ms — the process was killed (SIGKILL).`
    : `Ran ${result.bin} (exit ${result.exitCode === null ? `signal ${String(result.signal)}` : String(result.exitCode)}, ${result.durationMs} ms)`
  const parts = [head]
  parts.push(`stdout:\n${result.stdout.trim() === "" ? "(empty)" : result.stdout.trimEnd()}`)
  parts.push(`stderr:\n${result.stderr.trim() === "" ? "(empty)" : result.stderr.trimEnd()}`)
  if (result.truncated) parts.push(`[output truncated at ${MAX_STREAM_CHARS} chars per stream]`)
  return parts.join("\n\n")
}
