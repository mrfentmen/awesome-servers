import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"

// ---- muxB tools:
const exec = promisify(execFile)
const MAX_WORKTREES = 200
const DAY = 86400

function pad(label: string, width = 22): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

async function allowedRoot(): Promise<string> {
  const configured = process.env.WORKTREE_ORBIT_ROOT ?? path.join(process.cwd(), "..")
  return realpath(path.resolve(configured)).catch(() => path.resolve(configured))
}

async function confined(input: string, allowMissing = false): Promise<string> {
  const allowed = await allowedRoot()
  const requested = path.isAbsolute(input) ? input : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => allowMissing ? path.resolve(requested) : requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Repository path must stay inside the configured local workspace")
  return target
}

async function git(cwd: string, args: string[], allowFailure = false): Promise<string> {
  try {
    const result = await exec("git", args, { cwd, timeout: 15000, maxBuffer: 2 * 1024 * 1024 })
    return result.stdout.trim()
  } catch (error) {
    if (allowFailure && typeof error === "object" && error && "stdout" in error) return String((error as { stdout?: string }).stdout ?? "").trim()
    throw new Error("Local Git topology could not be read")
  }
}

type Entry = { path: string; detached: boolean; locked: boolean; prunable: boolean }

function parsePorcelain(output: string): Entry[] {
  const entries: Entry[] = []
  let current: Entry | null = null
  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      if (current) entries.push(current)
      current = { path: line.slice(9), detached: false, locked: false, prunable: false }
    } else if (!current) continue
    else if (line === "detached") current.detached = true
    else if (line.startsWith("locked")) current.locked = true
    else if (line.startsWith("prunable")) current.prunable = true
  }
  if (current) entries.push(current)
  return entries.slice(0, MAX_WORKTREES)
}

async function resolveWorktree(directory: string): Promise<{ worktree: string; available: boolean }> {
  try {
    const worktree = await confined(directory, true)
    const info = await stat(worktree).catch(() => null)
    if (!info?.isDirectory()) return { worktree, available: false }
    return { worktree, available: true }
  } catch {
    return { worktree: "", available: false }
  }
}

function ageBucket(ageSeconds: number): string {
  if (ageSeconds < DAY) return "under-1-day"
  if (ageSeconds < 7 * DAY) return "1-to-7-days"
  if (ageSeconds < 30 * DAY) return "8-to-30-days"
  if (ageSeconds < 180 * DAY) return "31-to-180-days"
  return "over-180-days"
}

export async function worktreeDivergenceProfile(args: { cwd?: string }): Promise<string> {
  const directory = await confined(args.cwd ?? ".")
  if ((await git(directory, ["rev-parse", "--is-inside-work-tree"])) !== "true") throw new Error("Selected directory is not a Git work tree")
  const entries = parsePorcelain(await git(directory, ["worktree", "list", "--porcelain"]))
  if (!entries.length) throw new Error("No worktree entries were reported by Git")
  const primary = await resolveWorktree(entries[0].path)
  if (!primary.available) throw new Error("The primary worktree directory is unavailable")
  const primaryHead = await git(primary.worktree, ["rev-parse", "HEAD"])
  const out: string[] = []
  out.push(`Worktree divergence profile (${entries.length} worktrees measured against the primary HEAD)`)
  out.push(`${pad("#")}${"role".padEnd(9)}${"ahead".padEnd(8)}${"behind".padEnd(9)}${"state".padEnd(12)}divergence`)
  let diverged = 0
  let unavailable = 0
  let dirty = 0
  const distances: number[] = []
  for (const [index, entry] of entries.entries()) {
    const label = index + 1
    if (index === 0) {
      out.push(`${pad(String(label))}${"primary".padEnd(9)}${"-".padEnd(8)}${"-".padEnd(9)}${"clean/dirty".padEnd(12)}baseline`)
      continue
    }
    const { worktree, available } = await resolveWorktree(entry.path)
    if (!available) {
      unavailable += 1
      out.push(`${pad(String(label))}${"linked".padEnd(9)}${"-".padEnd(8)}${"-".padEnd(9)}${"unavailable".padEnd(12)}not-measured`)
      continue
    }
    const counts = await git(worktree, ["rev-list", "--left-right", "--count", `${primaryHead}...HEAD`], true)
    const match = counts.match(/^(\d+)\s+(\d+)$/m)
    const behind = match ? Number(match[1]) : 0
    const ahead = match ? Number(match[2]) : 0
    const status = await git(worktree, ["status", "--porcelain=v1"], true)
    const isDirty = status.length > 0
    if (isDirty) dirty += 1
    const bucket = ahead === 0 && behind === 0 ? "in-sync" : ahead > 0 && behind === 0 ? "ahead-only" : ahead === 0 && behind > 0 ? "behind-only" : "diverged"
    if (bucket === "diverged") diverged += 1
    distances.push(ahead + behind)
    out.push(`${pad(String(label))}${"linked".padEnd(9)}${String(ahead).padEnd(8)}${String(behind).padEnd(9)}${(isDirty ? "dirty" : "clean").padEnd(12)}${bucket}`)
  }
  const sorted = [...distances].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0
  out.push(`${pad("Summary")}${entries.length - 1} linked worktrees, ${diverged} diverged, ${dirty} dirty, ${unavailable} unavailable`)
  out.push(`${pad("Distance")}max ${distances.length ? Math.max(...distances) : 0} commits from the primary, median ${median}`)
  out.push(`${pad("Reading")}${diverged === 0 ? (distances.length ? "every linked worktree is a strict ancestor or descendant of the primary, so a rebase onto it is safe" : "no linked worktree was measurable") : `${diverged} linked worktree${diverged === 1 ? " has" : "s have"} commits on both sides, so merging or rebasing will produce a merge commit`}`)
  out.push("Paths, branch names, commit hashes, remotes, lock reasons, subjects and file contents are never emitted.")
  return out.join("\n")
}

export async function worktreeAgeProfile(args: { cwd?: string }): Promise<string> {
  const directory = await confined(args.cwd ?? ".")
  if ((await git(directory, ["rev-parse", "--is-inside-work-tree"])) !== "true") throw new Error("Selected directory is not a Git work tree")
  const entries = parsePorcelain(await git(directory, ["worktree", "list", "--porcelain"]))
  if (!entries.length) throw new Error("No worktree entries were reported by Git")
  const now = Math.floor(Date.now() / 1000)
  const buckets: Record<string, number> = { "under-1-day": 0, "1-to-7-days": 0, "8-to-30-days": 0, "31-to-180-days": 0, "over-180-days": 0 }
  const rows: string[] = []
  let stale = 0
  let unreadable = 0
  for (const [index, entry] of entries.entries()) {
    const { worktree, available } = await resolveWorktree(entry.path)
    if (!available) {
      unreadable += 1
      rows.push(`${pad(String(index + 1))}${"linked".padEnd(9)}${"not reported".padEnd(18)}directory unavailable`)
      continue
    }
    const admin = await stat(path.join(worktree, ".git")).catch(() => null)
    const info = admin ?? await stat(worktree).catch(() => null)
    if (!info) {
      unreadable += 1
      rows.push(`${pad(String(index + 1))}${(index === 0 ? "primary" : "linked").padEnd(9)}${"not reported".padEnd(18)}no readable metadata`)
      continue
    }
    const age = Math.max(0, now - Math.floor(info.mtimeMs / 1000))
    const bucket = ageBucket(age)
    buckets[bucket] += 1
    if (age >= 30 * DAY) stale += 1
    rows.push(`${pad(String(index + 1))}${(index === 0 ? "primary" : "linked").padEnd(9)}${bucket.padEnd(18)}${Math.round(age / DAY)} days old${entry.locked ? ", locked" : ""}${entry.prunable ? ", prunable" : ""}`)
  }
  const out: string[] = []
  out.push(`Worktree age profile (${entries.length} worktrees, age taken from local administrative metadata mtime)`)
  out.push(`${pad("#")}${"role".padEnd(9)}${"age bucket".padEnd(18)}detail`)
  for (const row of rows) out.push(row)
  out.push(`${pad("Buckets")}${Object.entries(buckets).map(([label, count]) => `${label}=${count}`).join("  ")}`)
  out.push(`${pad("Stale")}${stale} worktree${stale === 1 ? "" : "s"} untouched for 30 days or more, ${unreadable} unreadable`)
  out.push(`${pad("Reading")}${stale > 1 ? "several worktrees look abandoned, prune the ones you no longer need before they get in the way" : stale === 1 ? "one worktree looks abandoned and is a candidate for pruning" : "no worktree is old enough to be considered abandoned"}`)
  out.push("Paths, branch names, commit hashes, remotes, lock reasons and contents are never emitted.")
  return out.join("\n")
}
