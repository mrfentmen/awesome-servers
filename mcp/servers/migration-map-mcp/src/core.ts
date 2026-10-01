import { readdir, realpath, stat } from "node:fs/promises"
import path from "node:path"

export class MigrationError extends Error {}
const SKIP = new Set([".git", "node_modules", "dist", "build"])
const MIGRATION_EXT = /\.(sql|js|ts|py|rb|go|rs)$/i
const sequencePattern = /(?:^|[_-])(\d{1,8})(?:[_-]|\.|$)/

async function bounded(input: string): Promise<string> {
  const configured = process.env.MIGRATION_MAP_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(root, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new MigrationError("Project path must stay inside the configured root")
  if (!(await stat(target).catch(() => null))) throw new MigrationError("Project path does not exist")
  return target
}

export async function inspectMigrationMap(input: { project: string }): Promise<Record<string, unknown>> {
  const root = await bounded(input.project)
  const sequences: number[] = []
  const directions = new Map<number, Set<string>>()
  let files = 0
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > 6 || files > 2000) return
    for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      if (entry.isDirectory()) { await walk(full, depth + 1); continue }
      if (!MIGRATION_EXT.test(entry.name)) continue
      const match = entry.name.match(sequencePattern)
      if (!match) continue
      files++
      const sequence = Number(match[1])
      sequences.push(sequence)
      const direction = /(?:rollback|revert|undo|down)/i.test(entry.name) ? "rollback" : "forward"
      const set = directions.get(sequence) ?? new Set<string>()
      set.add(direction)
      directions.set(sequence, set)
    }
  }
  await walk(root, 0)
  const unique = [...new Set(sequences)].sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i < unique.length; i++) for (let n = unique[i - 1] + 1; n < unique[i]; n++) gaps.push(n)
  const duplicateSequenceCount = unique.filter((sequence) => sequences.filter((value) => value === sequence).length > 1).length
  const pairedRollbackCount = [...directions.values()].filter((set) => set.has("forward") && set.has("rollback")).length
  const unpairedRollbackCount = [...directions.values()].filter((set) => set.has("rollback") && !set.has("forward")).length
  return { filesScanned: files, migrationCount: sequences.length, sequenceRange: unique.length ? [unique[0], unique.at(-1)] : null, gapCount: gaps.length, duplicateSequenceCount, pairedRollbackCount, unpairedRollbackCount, numberingRisk: gaps.length || duplicateSequenceCount ? "review" : "low-signal", rollbackRisk: unpairedRollbackCount ? "review" : "low-signal", valueFree: true, warning: "Only counts, sequence, and rollback pairing signals are returned. Migration names, paths, SQL, and source contents are never emitted." }
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 12000) }
