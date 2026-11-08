import { spawn } from "node:child_process"

export class ToolError extends Error {}

export interface RunResult {
  stdout: string
  stderr: string
  code: number
}

export interface RunOptions {
  input?: string
  timeoutMs?: number
  cwd?: string
}

/** Run a command without a shell and capture both streams. */
export function run(command: string, args: string[], options: RunOptions = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    let settled = false
    const timeoutMs = options.timeoutMs ?? 30_000
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill("SIGKILL")
      reject(new ToolError(`${command} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.on("error", (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new ToolError(`${command} could not start: ${error.message}`))
    })
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.stdin.on("error", () => {})
    child.on("close", (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ stdout, stderr, code: code ?? 0 })
    })

    if (options.input !== undefined) child.stdin.write(options.input)
    child.stdin.end()
  })
}

export async function runChecked(
  command: string,
  args: string[],
  options: RunOptions = {},
): Promise<RunResult> {
  const result = await run(command, args, options)
  if (result.code !== 0) {
    throw new ToolError(
      (result.stderr || result.stdout || `${command} exited with code ${result.code}`).trim(),
    )
  }
  return result
}

export async function requireCommand(command: string): Promise<void> {
  const result = await run("which", [command], { timeoutMs: 5_000 })
  if (result.code !== 0) throw new ToolError(`${command} is not installed or not on PATH`)
}

export function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] }
}

export function fail(value: string) {
  return { content: [{ type: "text" as const, text: value }], isError: true }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}
