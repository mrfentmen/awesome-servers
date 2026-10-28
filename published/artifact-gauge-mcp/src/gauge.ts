import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

const MAX_DEPTH = 6
const MAX_FILES = 2000
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024
const MAX_TOTAL_BYTES = 8 * 1024 * 1024 * 1024
const MAX_OUTPUT = 14000
const SKIP = new Set([".git", "node_modules", "coverage", ".next", ".cache"])
const MANIFESTS = new Set(["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock", "go.sum", "requirements.txt", "pyproject.toml"])

export class GaugeError extends Error {}

async function boundedRoot(input: string): Promise<string> {
  const configured = process.env.ARTIFACT_GAUGE_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const target = await realpath(path.resolve(input || ".")).catch(() => path.resolve(input || "."))
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new GaugeError(`Artifact path must stay inside ${root}`)
  return target
}

type FileInfo = { path: string; bytes: number; extension: string }
async function collect(root: string): Promise<FileInfo[]> {
  const result: FileInfo[] = []
  let totalBytes = 0
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || result.length >= MAX_FILES) return
    let entries
    try { entries = await readdir(directory, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const relative = path.relative(root, resolved)
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue
      if (entry.isDirectory()) await walk(resolved, depth + 1)
      else {
        const info = await stat(resolved).catch(() => null)
        if (!info?.isFile() || info.size > MAX_FILE_BYTES || totalBytes + info.size > MAX_TOTAL_BYTES) continue
        result.push({ path: relative, bytes: info.size, extension: path.extname(entry.name).toLowerCase() || "[none]" })
        totalBytes += info.size
      }
      if (result.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  return result
}

export async function inspect(input: string): Promise<Record<string, unknown>> {
  const root = await boundedRoot(input)
  const files = await collect(root)
  const totalBytes = files.reduce((sum, item) => sum + item.bytes, 0)
  const byExtension = Object.entries(files.reduce<Record<string, { files: number; bytes: number }>>((out, item) => { out[item.extension] ??= { files: 0, bytes: 0 }; out[item.extension].files += 1; out[item.extension].bytes += item.bytes; return out }, {})).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 50).map(([extension, value]) => ({ extension, ...value }))
  const largestFiles = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 50)
  const manifests = files.filter((item) => MANIFESTS.has(path.basename(item.path))).map((item) => ({ path: item.path, bytes: item.bytes }))
  return { root, filesScanned: files.length, totalBytes, byExtension, largestFiles, manifests, valueFree: true, warning: "Only paths, byte counts, extensions, and manifest filenames are returned. File contents and dependency versions are not emitted; this is a size heuristic, not a full bundler analyzer." }
}

export async function manifest(input: string, relativeFile: string): Promise<Record<string, unknown>> {
  const root = await boundedRoot(input)
  const target = await realpath(path.resolve(root, relativeFile)).catch(() => "")
  const relative = path.relative(root, target)
  if (!target || relative.startsWith("..") || path.isAbsolute(relative)) throw new GaugeError("Manifest path must stay inside the selected root")
  if (!MANIFESTS.has(path.basename(target))) throw new GaugeError("Only recognized dependency manifest filenames are supported")
  const bytes = await readFile(target)
  if (bytes.byteLength > 2 * 1024 * 1024) throw new GaugeError("Manifest exceeds the 2 MB safety limit")
  const text = bytes.toString("utf8")
  return { path: relative, bytes: bytes.byteLength, lines: text.split(/\r?\n/).length, hasDependenciesWord: /dependencies|requires|requirement/i.test(text), valueFree: true, warning: "Manifest contents are not returned. This reports only bounded metadata." }
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT) }
