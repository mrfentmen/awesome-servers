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

// ---------------------------------------------------------------------------
// Per-artifact-kind breakdown
//
// Same privacy contract as inspectBuildCache: only aggregate counts and byte
// totals. No path, filename or file content is ever emitted. "Stale" means a
// file whose mtime is older than STALE_MS, which is the usual signal that a
// cache entry is safe to drop and rebuild.
// ---------------------------------------------------------------------------

const STALE_MS = 7 * 24 * 60 * 60 * 1000

interface KindStat {
  directories: number
  files: number
  bytes: number
  oldestMtime: number
  newestMtime: number
  staleFiles: number
  staleBytes: number
}

async function walkByKind(root: string): Promise<Map<string, KindStat>> {
  const stats = new Map<string, KindStat>()
  let files = 0
  let total = 0
  let directoriesVisited = 0
  const bump = (kind: string): KindStat => {
    let s = stats.get(kind)
    if (!s) {
      s = { directories: 0, files: 0, bytes: 0, oldestMtime: 0, newestMtime: 0, staleFiles: 0, staleBytes: 0 }
      stats.set(kind, s)
    }
    return s
  }
  async function walk(directory: string, depth: number, kind: string | null): Promise<void> {
    if (depth > MAX_DEPTH || files >= MAX_FILES || total >= MAX_TOTAL_BYTES || directoriesVisited >= MAX_DIRECTORIES) return
    directoriesVisited++
    for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const info = await stat(full).catch(() => null)
      if (!info) continue
      if (entry.isDirectory()) {
        const isArtifact = ARTIFACT_DIRS.has(entry.name)
        const childKind = isArtifact ? entry.name : kind
        if (isArtifact) bump(entry.name).directories++
        await walk(full, depth + 1, childKind)
      } else if (kind && info.size <= MAX_FILE_BYTES && total + info.size <= MAX_TOTAL_BYTES) {
        files++
        total += info.size
        const s = bump(kind)
        s.files++
        s.bytes += info.size
        if (s.oldestMtime === 0 || info.mtimeMs < s.oldestMtime) s.oldestMtime = info.mtimeMs
        if (info.mtimeMs > s.newestMtime) s.newestMtime = info.mtimeMs
        if (Date.now() - info.mtimeMs > STALE_MS) {
          s.staleFiles++
          s.staleBytes += info.size
        }
      }
      if (files >= MAX_FILES || total >= MAX_TOTAL_BYTES) return
    }
  }
  const rootIsArtifact = ARTIFACT_DIRS.has(path.basename(root))
  if (rootIsArtifact) bump(path.basename(root)).directories++
  await walk(root, 0, rootIsArtifact ? path.basename(root) : null)
  return stats
}

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function dayStamp(ms: number): string {
  return ms > 0 ? new Date(ms).toISOString().slice(0, 10) : "not reported"
}

export async function artifactBreakdown(input: { project: string }): Promise<string> {
  const root = await rootOf(input.project)
  const stats = await walkByKind(root)
  if (!stats.size) return "No recognized artifact directories were found, so there is nothing to break down."
  const totalBytes = [...stats.values()].reduce((s, k) => s + k.bytes, 0)
  const totalFiles = [...stats.values()].reduce((s, k) => s + k.files, 0)
  const ranked = [...stats.entries()].sort((a, b) => b[1].bytes - a[1].bytes)
  const lines = [
    `Artifact footprint split by cache kind: ${ranked.length} kind(s), ${totalFiles} file(s), ${humanBytes(totalBytes)} total.`,
    ...ranked.map(([kind, s], i) => {
      const share = totalBytes ? ((s.bytes / totalBytes) * 100).toFixed(1) : "0.0"
      const mean = s.files ? Math.round(s.bytes / s.files) : 0
      return `${i + 1}. ${kind} | ${humanBytes(s.bytes)} (${share}%) across ${s.files} file(s) in ${s.directories} directory/ies` +
        ` | mean file ${humanBytes(mean)}` +
        ` | written ${dayStamp(s.oldestMtime)} to ${dayStamp(s.newestMtime)}`
    }),
    "Aggregate counts and byte totals only, as with inspect_build_cache. No paths or filenames.",
  ]
  return lines.join("\n")
}

export async function reclaimableCache(input: { project: string }): Promise<string> {
  const root = await rootOf(input.project)
  const stats = await walkByKind(root)
  if (!stats.size) return "No recognized artifact directories were found, so there is nothing to reclaim."
  const ranked = [...stats.entries()].sort((a, b) => b[1].staleBytes - a[1].staleBytes)
  const totalStale = ranked.reduce((s, [, k]) => s + k.staleBytes, 0)
  const totalBytes = ranked.reduce((s, [, k]) => s + k.bytes, 0)
  const totalStaleFiles = ranked.reduce((s, [, k]) => s + k.staleFiles, 0)
  const pct = totalBytes ? ((totalStale / totalBytes) * 100).toFixed(1) : "0.0"
  const lines = [
    `Cache older than 7 days: ${humanBytes(totalStale)} across ${totalStaleFiles} file(s), ${pct}% of the ${humanBytes(totalBytes)} observed.`,
    ...ranked.map(([kind, s], i) => {
      const share = s.bytes ? ((s.staleBytes / s.bytes) * 100).toFixed(1) : "0.0"
      return `${i + 1}. ${kind} | ${humanBytes(s.staleBytes)} stale of ${humanBytes(s.bytes)} (${share}%) in ${s.staleFiles} of ${s.files} file(s)`
    }),
    totalStale === 0
      ? "Nothing is stale, so a rebuild would gain nothing."
      : "Deleting the stale entries forces a cold rebuild of those caches only.",
    "Counts and byte totals only. No paths or filenames.",
  ]
  return lines.join("\n")
}
