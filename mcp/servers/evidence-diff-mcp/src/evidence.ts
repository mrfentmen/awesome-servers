import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readdir, realpath, stat } from "node:fs/promises"
import path from "node:path"

const exec = promisify(execFile)
const MAX_OUTPUT = 14000
const MAX_ENTRIES = 120
const MAX_LOG_BYTES = 2 * 1024 * 1024
const TEST_NAMES = /(?:test|spec|e2e|playwright|cypress|vitest|jest|pytest|cargo test)/i
const BUILD_NAMES = /(?:dist|build|coverage|artifact|report|junit|test-results)/i

export class EvidenceError extends Error {}
async function safeRoot(input: string): Promise<string> {
  const configured = process.env.EVIDENCE_DIFF_ROOT ?? path.join(process.cwd(), "..")
  const allowed = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input) ? input : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new EvidenceError("Project path must stay inside the configured local workspace")
  return target
}
async function git(cwd: string, args: string[]): Promise<string> {
  try { const result = await exec("git", args, { cwd, timeout: 15000, maxBuffer: MAX_LOG_BYTES }); return result.stdout.trim() }
  catch { throw new EvidenceError("Git evidence unavailable for this local project") }
}
async function topLevel(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    return entries.filter((entry) => entry.name !== ".git" && entry.name !== "node_modules").slice(0, MAX_ENTRIES).map((entry) => entry.name).sort()
  } catch {
    throw new EvidenceError("Local project evidence could not be read")
  }
}
function classify(name: string): string { if (TEST_NAMES.test(name)) return "test-evidence"; if (BUILD_NAMES.test(name)) return "build-evidence"; return "other" }
export async function explainEvidence(input: string): Promise<Record<string, unknown>> {
  const root = await safeRoot(input)
  const inside = await git(root, ["rev-parse", "--is-inside-work-tree"])
  if (inside !== "true") throw new EvidenceError("Project is not a Git work tree")
  const status = await git(root, ["status", "--porcelain=v1"])
  const recent = await git(root, ["log", "-5", "--date=short", "--format=%ad%x09%s"])
  const changed = await git(root, ["diff", "--name-status", "HEAD"])
  const staged = await git(root, ["diff", "--cached", "--name-status"])
  const entries = await topLevel(root)
  const evidenceKinds = entries.filter((name) => TEST_NAMES.test(name) || BUILD_NAMES.test(name)).map(classify)
  const testEvidenceCount = evidenceKinds.filter((kind) => kind === "test-evidence").length
  const buildEvidenceCount = evidenceKinds.filter((kind) => kind === "build-evidence").length
  const concerns: string[] = []
  if (status) concerns.push("working-tree-not-clean")
  if (changed || staged) concerns.push("uncommitted-change-evidence")
  if (testEvidenceCount > 0 && buildEvidenceCount === 0) concerns.push("test-evidence-without-build-evidence")
  return {
    root: "<local-project>",
    branch: (await git(root, ["branch", "--show-current"])) ? "named-branch" : "detached",
    workingTree: status ? "changed" : "clean",
    recentCommitCount: recent ? recent.split("\n").length : 0,
    changedPathCount: (changed ? changed.split("\n").length : 0) + (staged ? staged.split("\n").length : 0),
    evidenceKinds: [...new Set(evidenceKinds)].sort(),
    testEvidenceCount,
    buildEvidenceCount,
    concerns,
    explanation: concerns.length ? "The available local evidence suggests a change or an incomplete test-build evidence trail; inspect the project directly for details." : "No coarse evidence contradiction was detected; this does not prove the build or tests are correct.",
    valueFree: true,
    warning: "Only counts, coarse categories, branch state, and commit dates are returned. Source diffs, paths, subjects, authors, file contents, command output, and secrets are never emitted."
  }
}
export function format(value: unknown): string {
  const output = JSON.stringify(value, null, 2)
  return output.length <= MAX_OUTPUT ? output : JSON.stringify({ error: "Result exceeded the output budget and was reduced.", valueFree: true, truncated: true })
}
