

// ---- muxF tools:
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"

const exec = promisify(execFile)
const MAX_SCAN = 5000
const CADENCE_ROOT_ENV = "MERGE_CONFLICT_FORECASTER_ROOT"

export class CadenceError extends Error {}

async function localRoot(): Promise<string> {
  const configured = process.env[CADENCE_ROOT_ENV] ?? path.join(process.cwd(), "..")
  return realpath(path.resolve(configured)).catch(() => path.resolve(configured))
}

async function localRepository(input: string): Promise<string> {
  const allowed = await localRoot()
  const requested = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new CadenceError("Repository path must stay inside the configured local workspace")
  }
  const info = await stat(target).catch(() => null)
  if (!info?.isDirectory()) throw new CadenceError("Repository directory is unavailable")
  const inside = await git(target, ["rev-parse", "--is-inside-work-tree"]).catch(() => "false")
  if (inside !== "true") throw new CadenceError("Selected directory is not a Git work tree")
  return target
}

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const result = await exec("git", args, { cwd, timeout: 15000, maxBuffer: 2 * 1024 * 1024 })
    return result.stdout.trim()
  } catch {
    throw new CadenceError("Local Git analysis failed; verify the repository and the requested ref")
  }
}

function ymd(seconds: string): string {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) return "not reported"
  return new Date(value * 1000).toISOString().slice(0, 10)
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** Commit activity shape of the local history: cadence by month and weekday, and the gaps between commits. */
export async function commitCadence(args: { cwd?: string; months?: number }): Promise<string> {
  const repository = await localRepository(args.cwd ?? ".")
  const span = Math.max(1, Math.min(Math.floor(args.months ?? 12), 36))
  const total = Number(await git(repository, ["rev-list", "--count", "HEAD"])) || 0
  if (!total) return "The local history at HEAD has no commits, so there is no cadence to report."
  const stamps = (await git(repository, ["log", "--format=%ct", `-n${Math.min(total, MAX_SCAN)}`]))
    .split(/\s+/)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a)
  const committerAddresses = await git(repository, ["log", "--format=%ae", `-n${Math.min(total, MAX_SCAN)}`])
  const distinctCommitters = new Set(committerAddresses.split(/\r?\n/).filter((line) => line.includes("@"))).size
  const gaps: number[] = []
  for (let i = 0; i < stamps.length - 1; i += 1) {
    const gap = (stamps[i] - stamps[i + 1]) / 86400
    if (gap >= 0) gaps.push(gap)
  }
  const buckets = new Map<string, number>()
  const weekdays = new Map<string, number>()
  const cutoff = Date.now() / 1000 - span * 30.44 * 86400
  let inWindow = 0
  for (const stamp of stamps) {
    const iso = new Date(stamp * 1000)
    const month = iso.toISOString().slice(0, 7)
    if (stamp >= cutoff) {
      buckets.set(month, (buckets.get(month) ?? 0) + 1)
      inWindow += 1
    }
    const weekday = WEEKDAYS[(iso.getUTCDay() + 6) % 7]
    weekdays.set(weekday, (weekdays.get(weekday) ?? 0) + 1)
  }
  const months = [...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const quietest = [...weekdays.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3)
  const busiest = [...weekdays.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
  const gapMedian = median(gaps)
  const lines = [
    `Commit cadence of the local history at HEAD (metadata only, no messages or identities)`,
    `Commits reachable from HEAD: ${total}${stamps.length < total ? ` (scan capped at ${stamps.length})` : ""}`,
    `Oldest commit in the scan: ${ymd(String(stamps[stamps.length - 1] ?? 0))}`,
    `Newest commit in the scan: ${ymd(String(stamps[0] ?? 0))}`,
    `Distinct committer addresses seen: ${Number.isFinite(distinctCommitters) ? distinctCommitters : "not reported"}`,
    `Median gap between consecutive commits: ${gapMedian === null ? "not reported" : `${gapMedian.toFixed(2)} days`}`,
    `Longest gap between consecutive commits: ${gaps.length ? `${Math.max(...gaps).toFixed(1)} days` : "not reported"}`,
    `Commits in the last ${span} month(s): ${inWindow}`,
    months.length
      ? `By month: ${months.map(([month, n]) => `${month} ${n}`).join(", ")}`
      : `By month: no commits in the last ${span} month(s)`,
    `By weekday: ${WEEKDAYS.map((day) => `${day.slice(0, 3)} ${weekdays.get(day) ?? 0}`).join(", ")}`,
    `Quietest weekdays: ${quietest.map(([day, n]) => `${day} (${n})`).join(", ")}`,
    `Busiest weekdays: ${busiest.map(([day, n]) => `${day} (${n})`).join(", ")}`,
    "Counts are of distinct committer addresses in the scan, never the addresses themselves.",
  ]
  return lines.join("\n")
}

const OPERATION_MARKERS: Array<[string, string]> = [
  ["MERGE_HEAD", "merge in progress"],
  ["CHERRY_PICK_HEAD", "cherry-pick in progress"],
  ["REVERT_HEAD", "revert in progress"],
  ["BISECT_LOG", "bisect in progress"],
  ["rebase-merge", "rebase in progress"],
  ["rebase-apply", "rebase (apply backend) in progress"],
]

/** Where the local work tree stands: bare or not, attached or detached, and what operation is half finished. */
export async function repositoryHealth(args: { cwd?: string }): Promise<string> {
  const repository = await localRepository(args.cwd ?? ".")
  const bare = await git(repository, ["rev-parse", "--is-bare-repository"])
  const shallow = await git(repository, ["rev-parse", "--is-shallow-repository"])
  const head = await git(repository, ["symbolic-ref", "-q", "HEAD"]).catch(() => "")
  const headCommit = await git(repository, ["rev-list", "--count", "HEAD"]).catch(() => "0")
  const status = await git(repository, ["status", "--porcelain"]).catch(() => "")
  const rows = status.split(/\r?\n/).filter(Boolean)
  const byCode = new Map<string, number>()
  for (const row of rows) {
    const code = row.slice(0, 2)
    byCode.set(code, (byCode.get(code) ?? 0) + 1)
  }
  const stashed = await git(repository, ["stash", "list"]).then((out) => out.split(/\r?\n/).filter(Boolean).length).catch(() => 0)
  const inProgress: string[] = []
  for (const [marker, label] of OPERATION_MARKERS) {
    const located = await git(repository, ["rev-parse", "--git-path", marker]).catch(() => "")
    if (!located) continue
    const present = await stat(path.isAbsolute(located) ? located : path.resolve(repository, located)).then(() => true).catch(() => false)
    if (present) inProgress.push(label)
  }
  const codeList = [...byCode.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => `${JSON.stringify(code)} ${n}`)
  return [
    "Local repository state (metadata only, no paths, branch names or source content)",
    `Bare repository: ${bare === "true" ? "yes" : "no"}`,
    `Shallow clone: ${shallow === "true" ? "yes" : "no"}`,
    `HEAD: ${head ? "attached to a branch" : "detached at a commit"}`,
    `Commits reachable from HEAD: ${headCommit || "0"}`,
    `Uncommitted paths in the work tree: ${rows.length}`,
    codeList.length ? `By status code: ${codeList.join(", ")}` : "By status code: the work tree is clean",
    `Stash entries: ${stashed}`,
    inProgress.length ? `Operations in progress: ${inProgress.join("; ")}` : "Operations in progress: none",
    "Status codes follow git's own porcelain vocabulary; they describe changes, never file contents.",
  ].join("\n")
}

/** Size and shape of the local object store and ref namespace, from git's own counters. */
export async function objectStore(args: { cwd?: string }): Promise<string> {
  const repository = await localRepository(args.cwd ?? ".")
  const counted = await git(repository, ["count-objects", "-v"])
  const stats = new Map<string, string>()
  for (const line of counted.split(/\r?\n/)) {
    const [key, value] = line.split(":")
    if (key && value) stats.set(key.trim(), value.trim())
  }
  const namespaces: Array<[string, string]> = [
    ["refs/heads", "local branches"],
    ["refs/tags", "tags"],
    ["refs/remotes", "remote-tracking refs"],
    ["refs/notes", "notes refs"],
    ["refs/stash", "stash ref"],
  ]
  const refRows: string[] = []
  for (const [namespace, label] of namespaces) {
    const count = (await git(repository, ["for-each-ref", "--format=%(refname)", namespace]).catch(() => ""))
      .split(/\r?\n/)
      .filter(Boolean).length
    refRows.push(`${label} (${namespace}): ${count}`)
  }
  const allRefs = (await git(repository, ["for-each-ref", "--format=%(refname)"]).catch(() => ""))
    .split(/\r?\n/)
    .filter(Boolean).length
  const reachable = await git(repository, ["rev-list", "--all", "--count"]).catch(() => "not reported")
  const value = (key: string): string => stats.get(key) ?? "not reported"
  const loose = Number(value("count"))
  const inPack = Number(value("in-pack"))
  return [
    "Local object store and ref namespace (git's own counters)",
    `Loose objects: ${value("count")}`,
    `Loose object size: ${value("size")} KiB`,
    `Packed objects: ${value("in-pack")}`,
    `Pack files: ${value("packs")}`,
    `Pack size: ${value("size-pack")} KiB`,
    `Loose objects that a prune could remove: ${value("prune-packable")}`,
    `Unreachable garbage objects: ${value("garbage")}${value("size-garbage") !== "0" ? ` (${value("size-garbage")} KiB)` : ""}`,
    `Commits reachable from every ref: ${reachable}`,
    `Total refs: ${allRefs}`,
    ...refRows,
    Number.isFinite(loose) && Number.isFinite(inPack) && inPack > 0
      ? `Share of objects already packed: ${((inPack / (loose + inPack)) * 100).toFixed(1)}%`
      : "Share of objects already packed: not reported",
    "No ref names, file paths, commit hashes or contents are returned by this tool.",
  ].join("\n")
}
