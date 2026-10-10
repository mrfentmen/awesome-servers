import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"



// ---- muxB tools:
const exec = promisify(execFile)
const MAX_LINES = 10000
const DAY = 86400

function pad(label: string, width = 22): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

async function repoRoot(input: string): Promise<string> {
  const configured = process.env.GIT_ARCHAEOLOGY_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input) ? path.resolve(input) : path.resolve(root, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Repository path must stay inside the configured local workspace")
  const info = await stat(target).catch(() => null)
  if (!info?.isDirectory()) throw new Error("Repository directory is unavailable")
  return target
}

async function git(cwd: string, args: string[], allowFailure = false): Promise<string> {
  try {
    const result = await exec("git", args, { cwd, timeout: 15000, maxBuffer: 2 * 1024 * 1024 })
    return result.stdout.trim()
  } catch (error) {
    if (allowFailure && typeof error === "object" && error && "stdout" in error) return String((error as { stdout?: string }).stdout ?? "").trim()
    throw new Error("Local Git metadata could not be read")
  }
}

function reflogTimes(cwd: string): Promise<number[]> {
  return git(cwd, ["reflog", "--all", "--format=%ct"]).then((output) =>
    output.split(/\r?\n/).slice(0, MAX_LINES).map((line) => Number(line.trim())).filter((value) => Number.isFinite(value) && value > 0),
  )
}

function entropyOf(counts: number[]): number {
  const total = counts.reduce((sum, value) => sum + value, 0)
  if (!total) return 0
  let entropy = 0
  for (const count of counts) {
    if (!count) continue
    const share = count / total
    entropy -= share * Math.log2(share)
  }
  return entropy
}

export async function reflogActivityProfile(args: { cwd?: string }): Promise<string> {
  const root = await repoRoot(args.cwd ?? ".")
  if ((await git(root, ["rev-parse", "--is-inside-work-tree"])) !== "true") throw new Error("Selected directory is not a Git work tree")
  const times = (await reflogTimes(root)).sort((a, b) => a - b)
  const out: string[] = []
  out.push(`Reflog activity profile (${times.length} reflog entries across all refs)`)
  if (!times.length) {
    out.push(`${pad("Result")}no reflog entries observed, activity is not computable`)
    out.push("Ref names, hashes, subjects, paths, remotes and contents are never emitted.")
    return out.join("\n")
  }
  const dayOf = (seconds: number) => Math.floor(seconds / DAY)
  const days = [...new Set(times.map(dayOf))].sort((a, b) => a - b)
  let longestStreak = 1
  let current = 1
  for (let i = 1; i < days.length; i += 1) {
    if (days[i] - days[i - 1] === 1) { current += 1; longestStreak = Math.max(longestStreak, current) } else current = 1
  }
  const gaps: number[] = []
  for (let i = 1; i < times.length; i += 1) gaps.push(times[i] - times[i - 1])
  gaps.sort((a, b) => a - b)
  const percentile = (fraction: number) => (gaps.length ? gaps[Math.min(gaps.length - 1, Math.max(0, Math.ceil(fraction * gaps.length) - 1))] : 0)
  const humanGap = (seconds: number) => (seconds < 90 ? `${seconds}s` : seconds < 5400 ? `${Math.round(seconds / 60)}m` : seconds < 172800 ? `${Math.round(seconds / 3600)}h` : `${Math.round(seconds / DAY)}d`)
  const weekday = new Array(7).fill(0) as number[]
  for (const time of times) weekday[new Date(time * 1000).getUTCDay()] += 1
  const weekdayEntropy = entropyOf(weekday) / Math.log2(7)
  const now = Math.floor(Date.now() / 1000)
  const recent = times.filter((time) => now - time < 7 * DAY).length
  const perActiveDay = times.length / days.length
  const shape = days.length === 1 ? "single-session" : longestStreak / days.length > 0.8 ? "single-campaign" : perActiveDay >= 10 ? "burst-days" : weekdayEntropy > 0.9 ? "steady-spread" : "intermittent"
  out.push(`${pad("Active days")}${days.length} distinct UTC days, longest consecutive streak ${longestStreak} day${longestStreak === 1 ? "" : "s"}`)
  out.push(`${pad("Per active day")}${perActiveDay.toFixed(1)} entries per active day`)
  out.push(`${pad("Inter-entry gap")}median ${humanGap(percentile(0.5))}  p90 ${humanGap(percentile(0.9))}  max ${humanGap(gaps[gaps.length - 1] ?? 0)}`)
  out.push(`${pad("Recent split")}${recent} entries in the last 7 days (${((recent / times.length) * 100).toFixed(1)}%), ${times.length - recent} older`)
  out.push(`${pad("Weekday spread")}entropy ${weekdayEntropy.toFixed(2)} of a possible 1.00 (1.00 means activity is spread evenly across all seven days)`)
  out.push(`${pad("Shape")}${shape}`)
  out.push("Ref names, hashes, subjects, paths, remotes and contents are never emitted.")
  return out.join("\n")
}

export async function recoverableObjectWindow(args: { cwd?: string }): Promise<string> {
  const root = await repoRoot(args.cwd ?? ".")
  if ((await git(root, ["rev-parse", "--is-inside-work-tree"])) !== "true") throw new Error("Selected directory is not a Git work tree")
  const fsck = await git(root, ["fsck", "--full", "--unreachable", "--no-reflogs", "--no-progress"], true)
  const named = new Set(
    (await git(root, ["reflog", "--all", "--format=%H"], true))
      .split(/\r?\n/)
      .slice(0, MAX_LINES)
      .map((line) => line.trim().slice(0, 8))
      .filter((line) => /^[0-9a-f]{8,}$/.test(line)),
  )
  const types = { commit: 0, tree: 0, blob: 0, tag: 0, other: 0 }
  const stillNamed: Record<string, number> = { commit: 0, tree: 0, blob: 0, tag: 0, other: 0 }
  let total = 0
  for (const line of fsck.split(/\r?\n/).slice(0, MAX_LINES)) {
    const match = line.match(/\b(?:unreachable|dangling)\s+(commit|tree|blob|tag)\b\s+([0-9a-f]{7,40})/i)
    const loose = line.match(/\b(?:unreachable|dangling)\s+(\w+)\b\s+([0-9a-f]{7,40})/i)
    if (!match && !loose) continue
    const kind = (match?.[1] ?? loose?.[1] ?? "other").toLowerCase()
    const oid = (match?.[2] ?? loose?.[2] ?? "").toLowerCase()
    const bucket = (Object.keys(types) as Array<keyof typeof types>).includes(kind as keyof typeof types) ? (kind as keyof typeof types) : "other"
    types[bucket] += 1
    total += 1
    if (oid && named.has(oid.slice(0, 8))) stillNamed[bucket] += 1
  }
  const stillNamedTotal = Object.values(stillNamed).reduce((sum, value) => sum + value, 0)
  const out: string[] = []
  out.push(`Recovery window for objects unreachable from every ref (${total} objects, reflog read separately)`)
  out.push(`${pad("Unreachable")}commit ${types.commit}  tree ${types.tree}  blob ${types.blob}  tag ${types.tag}  other ${types.other}`)
  out.push(`${pad("Still reflog-named")}commit ${stillNamed.commit}  tree ${stillNamed.tree}  blob ${stillNamed.blob}  tag ${stillNamed.tag}  other ${stillNamed.other}`)
  out.push(`${pad("Window")}${stillNamedTotal} of ${total} unreachable objects are still named by a reflog entry (${total ? ((stillNamedTotal / total) * 100).toFixed(1) : "0.0"}%)`)
  if (!total) out.push(`${pad("Hint")}no-unreachable-objects-observed`)
  else if (stillNamedTotal > 0) out.push(`${pad("Hint")}reflog-still-holds-unreachable-objects - expiring the reflog would drop them`)
  else out.push(`${pad("Hint")}unreachable-objects-are-not-reflog-referenced - they survive only until garbage collection`)
  out.push("Object IDs, messages, paths, ref names, remotes and contents are never emitted.")
  return out.join("\n")
}
