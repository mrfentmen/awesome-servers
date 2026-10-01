import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"

const exec = promisify(execFile)
const MAX_BRANCHES = 40
const MAX_FILES = 2000
const MAX_OUTPUT = 12000
const ALLOWED_ROOT_ENV = "MERGE_CONFLICT_FORECASTER_ROOT"

export class ForecasterError extends Error {}

type BranchRecord = { name: string; upstream: string; ahead: number; behind: number; files: Set<string> }

type FileOverlap = { branchCount: number; pressure: string }

async function allowedRoot(): Promise<string> {
  const configured = process.env[ALLOWED_ROOT_ENV] ?? path.join(process.cwd(), "..")
  return realpath(path.resolve(configured)).catch(() => path.resolve(configured))
}

async function confined(input: string): Promise<string> {
  const allowed = await allowedRoot()
  const requested = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new ForecasterError("Repository path must stay inside the configured local workspace")
  const info = await stat(target).catch(() => null)
  if (!info?.isDirectory()) throw new ForecasterError("Repository directory is unavailable")
  return target
}

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const result = await exec("git", args, { cwd, timeout: 15000, maxBuffer: 2 * 1024 * 1024 })
    return result.stdout.trim()
  } catch {
    throw new ForecasterError("Local Git analysis failed; verify the repository and requested local ref")
  }
}

function parseCount(value: string): number {
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? Math.min(100000, number) : 0
}

export function parseBranchRows(output: string): Array<{ name: string; upstream: string; ahead: number; behind: number }> {
  return output.split(/\r?\n/).filter(Boolean).slice(0, MAX_BRANCHES).map((line) => {
    const [name = "", upstream = "", ahead = "0", behind = "0"] = line.split("\t")
    return { name, upstream, ahead: parseCount(ahead), behind: parseCount(behind) }
  }).filter((branch) => branch.name.length > 0)
}

export function parseNameStatus(output: string): string[] {
  const files: string[] = []
  for (const line of output.split(/\r?\n/)) {
    const separator = line.indexOf("\t")
    if (separator < 0) continue
    const file = line.slice(separator + 1).trim()
    if (file && files.length < MAX_FILES) files.push(file)
  }
  return files
}

function pressureFor(branchCount: number): string {
  return branchCount >= 4 ? "high" : branchCount === 3 ? "medium" : "low"
}

async function validateBase(repository: string, base: string): Promise<void> {
  if (base === "HEAD") return
  try {
    await git(repository, ["check-ref-format", "--branch", base])
    await git(repository, ["show-ref", "--verify", "--quiet", `refs/heads/${base}`])
  } catch {
    throw new ForecasterError("The selected base must be an existing local branch")
  }
}

export async function forecast(input: { cwd: string; base?: string; limit?: number }): Promise<Record<string, unknown>> {
  const repository = await confined(input.cwd)
  const limit = Math.min(MAX_BRANCHES, Math.max(1, Number(input.limit ?? 20)))
  if (await git(repository, ["rev-parse", "--is-inside-work-tree"]) !== "true") throw new ForecasterError("Selected directory is not a Git work tree")

  const current = (await git(repository, ["branch", "--show-current"])) || "detached"
  const requestedBase = input.base?.trim()
  const base = requestedBase || (current === "detached" ? "HEAD" : current)
  await validateBase(repository, base)
  const branchRows = parseBranchRows(await git(repository, ["for-each-ref", "--format=%(refname:short)\t%(upstream:short)", "refs/heads"]))
  const candidateRows = branchRows.filter((row) => row.name !== base)
  const branches: BranchRecord[] = []
  for (const row of candidateRows.slice(0, limit)) {
    const range = `${base}...${row.name}`
    const counts = (await git(repository, ["rev-list", "--left-right", "--count", range])).split(/\s+/).map(parseCount)
    const files = new Set(parseNameStatus(await git(repository, ["diff", "--name-status", "--no-renames", range])))
    branches.push({ ...row, behind: counts[0] ?? 0, ahead: counts[1] ?? 0, files })
  }

  const byFile = new Map<string, Set<string>>()
  for (const branch of branches) for (const file of branch.files) {
    if (!byFile.has(file)) byFile.set(file, new Set())
    byFile.get(file)?.add(branch.name)
  }
  const overlaps: FileOverlap[] = [...byFile.values()].filter((owners) => owners.size > 1).map((owners) => ({ branchCount: owners.size, pressure: pressureFor(owners.size) }))
  const branchPressure = branches.map((branch) => {
    const overlapCounts = [...branch.files].map((file) => byFile.get(file)?.size ?? 0).filter((owners) => owners > 1)
    const overlappingFileCount = overlapCounts.length
    const maximumSharedBranchCount = overlapCounts.length ? Math.max(...overlapCounts) : 1
    return {
      ahead: branch.ahead,
      behind: branch.behind,
      changedFileCount: branch.files.size,
      overlappingFileCount,
      pressure: pressureFor(maximumSharedBranchCount),
    }
  })
  const high = overlaps.filter((item) => item.pressure === "high").length
  const medium = overlaps.filter((item) => item.pressure === "medium").length
  return {
    repositoryBranchCount: branchRows.length,
    analyzedBranchCount: branches.length,
    currentBranchPresent: branchRows.some((branch) => branch.name === current),
    baseSpecified: Boolean(requestedBase),
    baseResolved: base === "HEAD" ? "detached-head" : base === current ? "current-branch" : "provided-branch",
    branchAheadTotal: branches.reduce((sum, branch) => sum + branch.ahead, 0),
    branchBehindTotal: branches.reduce((sum, branch) => sum + branch.behind, 0),
    changedFileTotal: new Set(branches.flatMap((branch) => [...branch.files])).size,
    overlappingFileCount: overlaps.length,
    highPressureOverlapCount: high,
    mediumPressureOverlapCount: medium,
    lowPressureOverlapCount: Math.max(0, overlaps.length - high - medium),
    branchPressure,
    forecast: high > 0 ? "high-overlap-pressure" : medium > 0 ? "medium-overlap-pressure" : overlaps.length > 0 ? "low-overlap-pressure" : "no-observed-file-overlap",
    valueFree: true,
    metadataOnly: true,
    warning: "This forecast compares each analyzed local branch with the selected base and uses shared changed-file counts. Branch names, file paths, commit messages, hashes, authors, remotes, and source contents are never returned. It estimates collision pressure; it does not prove a merge will conflict.",
  }
}

export function format(value: unknown): string {
  const output = JSON.stringify(value, null, 2)
  return output.length <= MAX_OUTPUT ? output : JSON.stringify({ error: "Result exceeded the output budget and was reduced.", valueFree: true, metadataOnly: true, truncated: true })
}
