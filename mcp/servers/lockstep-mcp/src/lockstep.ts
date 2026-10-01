import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

const MAX_BYTES = 1024 * 1024
const MAX_OUTPUT = 14000
const FILES = new Set(["package.json", "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "Cargo.lock", "go.sum", "poetry.lock", "Pipfile.lock", "composer.lock", "Gemfile.lock", "flake.lock"])
const SKIP = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"])

export class LockstepError extends Error {}
async function root(input: string): Promise<string> {
  const configured = process.env.LOCKSTEP_ROOT ?? path.join(process.cwd(), "..")
  const allowed = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const target = await realpath(path.resolve(input || ".")).catch(() => path.resolve(input || "."))
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new LockstepError(`Project path must stay inside ${allowed}`)
  return target
}
async function find(rootDir: string): Promise<string[]> {
  const found: string[] = []
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > 4 || found.length >= 100) return
    let entries
    try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const relative = path.relative(rootDir, resolved)
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue
      if (entry.isDirectory()) await walk(resolved, depth + 1)
      else if (FILES.has(entry.name)) found.push(relative)
    }
  }
  await walk(rootDir, 0)
  return [...new Set(found)].sort()
}
function declaredPackageManager(content: string): string | null {
  const match = content.match(/"packageManager"\s*:\s*"\s*(npm|pnpm|yarn|bun)(?:@[^\"]*)?"/i)
  return match?.[1]?.toLowerCase() ?? null
}
function manager(file: string, content = ""): string { if (file === "package.json") return declaredPackageManager(content) ?? "npm"; if (/npm-shrinkwrap/.test(file)) return "npm"; if (file.startsWith("pnpm")) return "pnpm"; if (file.startsWith("yarn")) return "yarn"; if (file.startsWith("bun")) return "bun"; if (file === "Cargo.lock") return "cargo"; if (file === "go.sum") return "go"; if (/poetry|Pipfile/.test(file)) return "python"; if (file === "composer.lock") return "composer"; if (file === "Gemfile.lock") return "ruby"; if (file === "flake.lock") return "nix"; return "unknown" }
function signals(file: string, content: string): string[] { const result: string[] = []; if (/lockfileVersion|lockfileVersion:/.test(content)) result.push("lockfile-version-marker"); if (/^\s*lockfileVersion:/m.test(content)) result.push("yaml-lockfile-marker"); if (/^\s*nodes:/m.test(content)) result.push("dependency-graph-marker"); if (/^\s*dependencies:/m.test(content)) result.push("dependency-section-marker"); if (file === "package.json" && declaredPackageManager(content)) result.push("declared-package-manager"); return result }
export async function inspect(input: string): Promise<Record<string, unknown>> {
  const rootDir = await root(input)
  const files = await find(rootDir)
  const metadata = []
  for (const file of files) {
    const target = await realpath(path.resolve(rootDir, file)).catch(() => "")
    if (!target) continue
    const info = await stat(target).catch(() => null)
    if (!info?.isFile() || info.size > MAX_BYTES) continue
    const content = await readFile(target, "utf8")
    metadata.push({ file, manager: manager(file, content), bytes: info.size, lines: content.split(/\r?\n/).length, signals: signals(file, content) })
  }
  const managers = [...new Set(metadata.map((item) => item.manager))].sort()
  const lockManagers = [...new Set(metadata.filter((item) => item.file !== "package.json").map((item) => item.manager))].sort()
  const manifestManagers = [...new Set(metadata.filter((item) => item.file === "package.json").map((item) => item.manager))]
  const missingLockfileManager = manifestManagers.find((item) => !lockManagers.includes(item))
  const concerns = missingLockfileManager ? [`${missingLockfileManager}-manifest-without-lockfile`] : []
  return { root: rootDir, files: metadata, managers, lockManagers, concerns, reproducibilityHints: concerns.length ? ["Commit a lockfile for the package manager used by the project."] : ["Keep one declared package-manager lockfile strategy per project and verify it in CI."], valueFree: true, warning: "Only lockfile filenames, byte counts, line counts, manager labels, and structural signals are returned. Dependency names and versions are never emitted; this is a reproducibility aid, not a security audit." }
}
export function format(value: unknown): string {
  const serialized = JSON.stringify(value, null, 2)
  if (serialized.length <= MAX_OUTPUT) return serialized
  return JSON.stringify({ error: "Result exceeded the output budget and was reduced.", valueFree: true, truncated: true })
}
