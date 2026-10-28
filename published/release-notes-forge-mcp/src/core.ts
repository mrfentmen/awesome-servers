import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"

const run = promisify(execFile)
export class ReleaseError extends Error {}

async function boundedRepository(input: string): Promise<string> {
  const configured = process.env.RELEASE_NOTES_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(root, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new ReleaseError("Repository path must stay inside the configured root")
  const info = await stat(target).catch(() => null)
  if (!info?.isDirectory()) throw new ReleaseError("Repository path must be a readable directory")
  return target
}

const age = (days: number) => days < 1 ? "under-1d" : days < 7 ? "1d-to-1w" : days < 30 ? "1w-to-1m" : "over-1m"
const category = (subject: string) => /^(feat|add)/i.test(subject) ? "feature" : /^(fix|bug)/i.test(subject) ? "fix" : /^(docs|doc)/i.test(subject) ? "docs" : /^(refactor|perf|test|build|ci|chore)/i.test(subject) ? "maintenance" : "other"

export async function summarizeReleaseHistory(input: { cwd: string, limit?: number }): Promise<Record<string, unknown>> {
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 25)))
  const repository = await boundedRepository(input.cwd)
  let stdout: string
  try {
    ({ stdout } = await run("git", ["-C", repository, "log", `-${limit}`, "--format=%ct%x09%s"], { maxBuffer: 1_000_000 }))
  } catch { throw new ReleaseError("The selected directory is not a readable Git repository") }
  const now = Date.now() / 1000
  const categories: Record<string, number> = {}
  const ages: Record<string, number> = {}
  let count = 0
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue
    const [stamp, subject] = line.split("\t")
    const time = Number(stamp)
    if (!Number.isFinite(time)) continue
    count++
    const key = category(subject || "")
    const ageKey = age((now - time) / 86400)
    categories[key] = (categories[key] || 0) + 1
    ages[ageKey] = (ages[ageKey] || 0) + 1
  }
  return { commitCount: count, categoryCounts: categories, ageBuckets: ages, valueFree: true, warning: "Commit messages, hashes, paths, branch names, remotes, and author identities are never returned." }
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 12000) }
