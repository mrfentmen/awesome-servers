import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

const MAX_DEPTH = 4
const MAX_FILES = 80
const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_OUTPUT = 14000
const SKIP = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"])
const FILES = new Map<string, string>([
  ["package.json", "npm"], ["package-lock.json", "npm"], ["npm-shrinkwrap.json", "npm"],
  ["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "yarn"], ["bun.lock", "bun"], ["bun.lockb", "bun"],
  ["Cargo.toml", "cargo"], ["Cargo.lock", "cargo"], ["go.mod", "go"], ["go.sum", "go"],
  ["pyproject.toml", "python"], ["poetry.lock", "python"], ["Pipfile", "python"], ["Pipfile.lock", "python"],
  ["Gemfile", "ruby"], ["Gemfile.lock", "ruby"], ["composer.json", "php"], ["composer.lock", "php"],
])

export class DriftError extends Error {}
type Found = { name: string; manager: string; bytes: number; text: string }

async function boundedRoot(input: string): Promise<string> {
  const configured = process.env.DEPENDENCY_DRIFT_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input || "") ? path.resolve(input || ".") : path.resolve(root, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new DriftError("Project path must stay inside the configured root")
  const info = await stat(target).catch(() => null)
  if (!info?.isDirectory()) throw new DriftError("Project must be a readable directory")
  return target
}

async function collect(root: string): Promise<Found[]> {
  const found: Found[] = []
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || found.length >= MAX_FILES) return
    let entries
    try { entries = await readdir(directory, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const relative = path.relative(root, resolved)
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue
      if (entry.isDirectory()) { await walk(resolved, depth + 1); continue }
      const manager = FILES.get(entry.name)
      if (!manager) continue
      const info = await stat(resolved).catch(() => null)
      if (!info?.isFile() || info.size > MAX_FILE_BYTES) continue
      const bytes = await readFile(resolved).catch(() => Buffer.alloc(0))
      found.push({ name: entry.name, manager, bytes: bytes.byteLength, text: bytes.toString("utf8") })
      if (found.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  return found
}

function countManifestDependencies(text: string, file: string): number {
  if (file !== "package.json" && file !== "composer.json") return 0
  try {
    const value = JSON.parse(text) as Record<string, unknown>
    const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies", "require"]
    return sections.reduce((sum, key) => {
      const section = value[key]
      return sum + (Array.isArray(section) ? section.length : section && typeof section === "object" ? Object.keys(section).length : 0)
    }, 0)
  } catch { return 0 }
}

function countLockEntries(text: string, file: string): number {
  if (file === "package-lock.json" || file === "npm-shrinkwrap.json") {
    try {
      const value = JSON.parse(text) as Record<string, unknown>
      const packages = value.packages
      if (packages && typeof packages === "object") return Math.max(0, Object.keys(packages).length - 1)
      const dependencies = value.dependencies
      return dependencies && typeof dependencies === "object" ? Object.keys(dependencies).length : 0
    } catch { return 0 }
  }
  const markers = file === "pnpm-lock.yaml" ? /(?:^|\n)\s{2,}[^\s:#][^:]*:/g : file === "yarn.lock" ? /(?:^|\n)[^\s#][^\n]*:\n/g : /(?:^|\n)(?:\s{2,})[^\s#][^\n:]*:/g
  return (text.match(markers) ?? []).length
}

function marker(text: string): string { if (/lockfileVersion/i.test(text)) return "lockfile-version"; if (/^lockfileVersion:/m.test(text)) return "yaml-lockfile-version"; if (/^packages:/m.test(text)) return "package-map"; if (/^dependencies:/m.test(text)) return "dependency-map"; return "unmarked" }

export async function inspectDependencyDrift(input: string): Promise<Record<string, unknown>> {
  const root = await boundedRoot(input)
  const found = await collect(root)
  const manifests = found.filter((item) => !/lock$|\.lock$|lock\.json$|lock\.yaml$|shrinkwrap|sum$/.test(item.name))
  const locks = found.filter((item) => !manifests.includes(item))
  const manifestManagers = [...new Set(manifests.map((item) => item.manager))].sort()
  const lockManagers = [...new Set(locks.map((item) => item.manager))].sort()
  const managerMismatchCount = locks.filter((lock) => !manifests.some((manifest) => manifest.manager === lock.manager)).length
  const declaredDependencyCount = manifests.reduce((sum, item) => sum + countManifestDependencies(item.text, item.name), 0)
  const lockedEntryCount = locks.reduce((sum, item) => sum + countLockEntries(item.text, item.name), 0)
  const lockMarkers = Object.fromEntries([...new Set(locks.map((item) => marker(item.text)))].sort().map((key) => [key, locks.filter((item) => marker(item.text) === key).length]))
  const result = {
    filesScanned: found.length,
    manifestCount: manifests.length,
    lockfileCount: locks.length,
    manifestManagerCounts: Object.fromEntries([...new Set(manifestManagers)].map((manager) => [manager, manifests.filter((item) => item.manager === manager).length])),
    lockfileManagerCounts: Object.fromEntries([...new Set(lockManagers)].map((manager) => [manager, locks.filter((item) => item.manager === manager).length])),
    declaredDependencyCount,
    lockedEntryCount,
    missingLockfileCount: Math.max(0, manifests.filter((manifest) => !locks.some((lock) => lock.manager === manifest.manager)).length),
    orphanLockfileCount: Math.max(0, locks.filter((lock) => !manifests.some((manifest) => manifest.manager === lock.manager)).length),
    managerMismatchCount,
    lockMarkerCounts: lockMarkers,
    driftRisk: managerMismatchCount > 0 || manifests.length > locks.length ? "review" : "low-signal",
    valueFree: true,
    warning: "Only aggregate counts and manager categories are returned. Package names, versions, paths, commands, source text, and environment values are never emitted."
  }
  return result
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT) }
