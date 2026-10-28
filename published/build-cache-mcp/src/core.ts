import { readdir, realpath, stat } from "node:fs/promises"
import path from "node:path"

export class BuildCacheError extends Error {}
const ARTIFACT_DIRS = new Set(["dist", "build", "out", "coverage", ".cache", ".next", "target", ".turbo", ".parcel-cache", ".vite"])
const SKIP = new Set([".git", "node_modules"])
const MAX_DEPTH = 8
const MAX_FILES = 5000
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024
const MAX_TOTAL_BYTES = 8 * 1024 * 1024 * 1024
const MAX_DIRECTORIES = 2000
const size = (n: number) => n < 1024 * 1024 ? "under-1mb" : n < 100 * 1024 * 1024 ? "1mb-to-100mb" : n < 1024 * 1024 * 1024 ? "100mb-to-1gb" : "over-1gb"
const age = (n: number) => n < 86400000 ? "under-1d" : n < 604800000 ? "1d-to-1w" : "over-1w"

async function rootOf(input: string): Promise<string> {
  const configured = process.env.BUILD_CACHE_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(root, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new BuildCacheError("Project path must stay inside the configured root")
  return target
}

export async function inspectBuildCache(input: { project: string }): Promise<Record<string, unknown>> {
  const root = await rootOf(input.project)
  let dirsFound = 0
  let files = 0
  let total = 0
  let directoriesVisited = 0
  const sizes: Record<string, number> = {}
  const ages: Record<string, number> = {}
  async function walk(directory: string, depth: number, insideArtifact: boolean): Promise<void> {
    if (depth > MAX_DEPTH || files >= MAX_FILES || total >= MAX_TOTAL_BYTES || directoriesVisited >= MAX_DIRECTORIES) return
    directoriesVisited++
    for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const info = await stat(full).catch(() => null)
      if (!info) continue
      if (entry.isDirectory()) {
        const artifact = insideArtifact || ARTIFACT_DIRS.has(entry.name)
        if (ARTIFACT_DIRS.has(entry.name)) dirsFound++
        await walk(full, depth + 1, artifact)
      } else if (insideArtifact && info.size <= MAX_FILE_BYTES && total + info.size <= MAX_TOTAL_BYTES) {
        files++
        total += info.size
        sizes[size(info.size)] = (sizes[size(info.size)] || 0) + 1
        ages[age(Date.now() - info.mtimeMs)] = (ages[age(Date.now() - info.mtimeMs)] || 0) + 1
      }
      if (files >= MAX_FILES || total >= MAX_TOTAL_BYTES) return
    }
  }
  const rootIsArtifact = ARTIFACT_DIRS.has(path.basename(root))
  if (rootIsArtifact) dirsFound = 1
  await walk(root, 0, rootIsArtifact)
  return { cacheOrArtifactDirectories: dirsFound, directoriesVisited, filesObserved: files, totalBytes: total, sizeBuckets: sizes, ageBuckets: ages, valueFree: true, warning: "Only aggregate size and age data from recognized artifact directories are returned. Paths, filenames, contents, and dependency values are never emitted." }
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 12000) }
