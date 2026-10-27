import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, readdir, stat } from "node:fs/promises"
import path from "node:path"

const exec = promisify(execFile)
const MAX_OUTPUT = 12000
const ALLOWED_ROOT = path.resolve(process.env.REPO_FORENSICS_ROOT ?? path.join(process.cwd(), ".."))
export class ForensicsError extends Error {}

async function root(value: string): Promise<string> {
  const configuredRoot = await realpath(ALLOWED_ROOT).catch(() => ALLOWED_ROOT)
  const directory = await realpath(path.resolve(value || ".")).catch(() => path.resolve(value || "."))
  const relative = path.relative(configuredRoot, directory)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new ForensicsError(`Repository path must stay within ${configuredRoot}`)
  return directory
}
function clip(value: string): string { return value.length > MAX_OUTPUT ? `${value.slice(0, MAX_OUTPUT)}\n[truncated]` : value }
async function git(cwd: string, args: string[]): Promise<string> {
  try { const result = await exec("git", args, { cwd: await root(cwd), timeout: 15000, maxBuffer: 2 * 1024 * 1024 }); return result.stdout.trim() }
  catch (error) { const message = error instanceof Error ? error.message : String(error); throw new ForensicsError(`Git command failed: ${message.slice(0, 400)}`) }
}

export async function summary(cwd: string) {
  const directory = await root(cwd)
  await git(directory, ["rev-parse", "--is-inside-work-tree"])
  return {
    path: directory,
    branch: await git(directory, ["branch", "--show-current"]),
    status: await git(directory, ["status", "--short", "--branch"]),
    remotes: (await git(directory, ["remote"])).split("\n").filter(Boolean),
    lastCommit: await git(directory, ["log", "-1", "--date=iso-strict", "--format=%H%n%ad%n%an%n%s"]),
  }
}

export async function recentChanges(cwd: string, limit: number) {
  const output = await git(await root(cwd), ["log", `-${limit}`, "--date=short", "--format=%h%x09%ad%x09%an%x09%s"])
  return output.split("\n").filter(Boolean).map((line) => { const [hash, date, author, ...subject] = line.split("\t"); return { hash, date, author, subject: subject.join("\t") } })
}

export async function hotspots(cwd: string, limit: number) {
  const output = await git(await root(cwd), ["log", "--all", "--format=", "--name-only", "-n", String(Math.min(limit * 10, 500))])
  const counts = new Map<string, number>()
  for (const file of output.split("\n").map((line) => line.trim()).filter(Boolean)) counts.set(file, (counts.get(file) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([file, commits]) => ({ file, commits }))
}

export async function hygiene(cwd: string) {
  const directory = await root(cwd)
  const entries = await readdir(directory, { withFileTypes: true })
  const large: Array<{ path: string; bytes: number }> = []
  for (const entry of entries.slice(0, 500)) {
    if (entry.name === ".git" || entry.name === "node_modules") continue
    const full = path.join(directory, entry.name)
    if (!entry.isFile()) continue
    const info = await stat(full)
    if (info.size >= 5 * 1024 * 1024) large.push({ path: entry.name, bytes: info.size })
  }
  const status = await git(directory, ["status", "--porcelain"])
  return { path: directory, largeFiles: large.slice(0, 50), hasGitignore: entries.some((entry) => entry.name === ".gitignore"), dirty: status.length > 0, warning: "This is a bounded top-level hygiene scan, not a complete security audit." }
}

export function format(value: unknown): string { return clip(JSON.stringify(value, null, 2)) }
