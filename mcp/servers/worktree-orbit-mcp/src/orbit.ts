import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"

const exec = promisify(execFile)
const MAX_WORKTREES = 200
const MAX_OUTPUT = 12000

export class OrbitError extends Error {}

async function allowedRoot(): Promise<string> {
  const configured = process.env.WORKTREE_ORBIT_ROOT ?? path.join(process.cwd(), "..")
  return realpath(path.resolve(configured)).catch(() => path.resolve(configured))
}

async function confined(input: string, allowMissing = false): Promise<string> {
  const allowed = await allowedRoot()
  const requested = path.isAbsolute(input) ? input : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => allowMissing ? path.resolve(requested) : requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new OrbitError("Repository path must stay inside the configured local workspace")
  return target
}

async function root(input: string): Promise<string> {
  const target = await confined(input)
  const info = await stat(target).catch(() => null)
  if (!info?.isDirectory()) throw new OrbitError("Repository directory is unavailable")
  return target
}

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const result = await exec("git", args, { cwd, timeout: 15000, maxBuffer: 2 * 1024 * 1024 })
    return result.stdout.trim()
  } catch {
    throw new OrbitError("Local Git topology could not be read")
  }
}

type ParsedWorktree = { path: string; detached: boolean; locked: boolean; prunable: boolean }
type Worktree = ParsedWorktree & { isPrimary: boolean; clean: boolean; unavailable: boolean }

export function parseWorktreePorcelain(output: string): ParsedWorktree[] {
  const entries: ParsedWorktree[] = []
  let current: ParsedWorktree | null = null
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

async function inspectLinked(entry: ParsedWorktree): Promise<{ clean: boolean; unavailable: boolean }> {
  let worktreePath: string
  try {
    worktreePath = await confined(entry.path, true)
  } catch {
    return { clean: false, unavailable: true }
  }
  const info = await stat(worktreePath).catch(() => null)
  if (!info?.isDirectory()) return { clean: false, unavailable: true }
  try {
    return { clean: (await git(worktreePath, ["status", "--porcelain=v1"])).length === 0, unavailable: false }
  } catch {
    return { clean: false, unavailable: true }
  }
}

export async function inspectTopology(input: string): Promise<Record<string, unknown>> {
  const directory = await root(input)
  if (await git(directory, ["rev-parse", "--is-inside-work-tree"]) !== "true") throw new OrbitError("Selected directory is not a Git work tree")
  const parsed = parseWorktreePorcelain(await git(directory, ["worktree", "list", "--porcelain"]))
  const states: Worktree[] = []
  for (const [index, entry] of parsed.entries()) states.push({ ...entry, isPrimary: index === 0, ...(await inspectLinked(entry)) })
  const cleanCount = states.filter((item) => item.clean && !item.unavailable).length
  const unavailableCount = states.filter((item) => item.unavailable).length
  const detachedCount = states.filter((item) => item.detached).length
  const lockedCount = states.filter((item) => item.locked).length
  const prunableCount = states.filter((item) => item.prunable).length
  return {
    worktreeCount: states.length,
    primaryCount: states.filter((item) => item.isPrimary).length,
    linkedCount: Math.max(0, states.length - 1),
    cleanCount,
    dirtyCount: states.filter((item) => !item.clean && !item.unavailable).length,
    unavailableCount,
    detachedCount,
    namedBranchCount: states.length - detachedCount,
    lockedCount,
    prunableCount,
    topologyHint: prunableCount > 0 ? "prunable-worktrees-present" : unavailableCount > 0 ? "unavailable-worktrees-present" : states.length > 1 ? "parallel-worktrees-present" : detachedCount > 0 ? "detached-worktree-present" : "single-worktree",
    valueFree: true,
    warning: "Only aggregate topology and state counts are returned. Paths, branch names, hashes, remotes, lock reasons, subjects, and file contents are never emitted.",
  }
}

export function format(value: unknown): string {
  const output = JSON.stringify(value, null, 2)
  return output.length <= MAX_OUTPUT ? output : JSON.stringify({ error: "Result exceeded the output budget and was reduced.", valueFree: true, truncated: true })
}
