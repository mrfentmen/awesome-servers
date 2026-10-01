import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_FILES = 80
const MAX_OUTPUT = 14000
const ALLOWED = /(?:test|run|result|report|junit|jest|playwright|cypress|pytest|vitest|mocha|tap)/i
const SKIP = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache", "vendor"])

type Outcome = "passed" | "failed" | "skipped" | "unknown"
export class HistoryError extends Error {}

async function safeRoot(input: string): Promise<string> {
  const configured = process.env.FLAKY_HISTORY_ROOT ?? path.join(process.cwd(), "..")
  const allowed = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input) ? input : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new HistoryError("Project path must stay inside the configured local workspace")
  return target
}
async function collect(root: string): Promise<string[]> {
  const found: string[] = []
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > 4 || found.length >= MAX_FILES) return
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
      else if (ALLOWED.test(entry.name) && /\.(?:json|jsonl|csv|xml)$/i.test(entry.name)) found.push(relative)
      if (found.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  return [...new Set(found)].sort()
}
function outcome(value: unknown): Outcome {
  const text = String(value ?? "").trim().toLowerCase()
  if (/^(?:skip|skipped|pending|todo|neutral)$/.test(text)) return "skipped"
  if (/^(?:fail|failed|failure|error|errored|broken|not ok\b|red|false|0)$/.test(text)) return "failed"
  if (/^(?:pass|passed|success|successful|ok|green|true|1)$/.test(text)) return "passed"
  return "unknown"
}
function parseRecords(file: string, content: string): Outcome[] {
  try {
    const lowerFile = file.toLowerCase()
    if (lowerFile.endsWith(".csv")) return content.split(/\r?\n/).slice(1).filter(Boolean).map((line) => outcome(line.split(",").at(-1)))
    if (lowerFile.endsWith(".jsonl")) return content.split(/\r?\n/).filter(Boolean).map((line) => { const value = JSON.parse(line) as Record<string, unknown>; return outcome(value.status ?? value.outcome ?? value.result) })
    if (lowerFile.endsWith(".xml")) {
      const results: Outcome[] = []
      for (const match of content.matchAll(/<(?:testcase|test)\b([^>]*)>([\s\S]*?)<\/(?:testcase|test)>/gi)) {
        const attrs = match[1]
        const body = match[2]
        if (/<(?:failure|error)\b/i.test(body)) results.push("failed")
        else if (/<skipped\b/i.test(body)) results.push("skipped")
        else results.push(outcome(attrs.match(/(?:status|result|outcome)=["']([^"']+)["']/i)?.[1] ?? "passed"))
      }
      for (const match of content.matchAll(/<(?:testcase|test)\b([^>]*)\/>/gi)) results.push(outcome(match[1].match(/(?:status|result|outcome)=["']([^"']+)["']/i)?.[1] ?? "passed"))
      return results
    }
    const value = JSON.parse(content) as unknown
    const records = Array.isArray(value) ? value : (value && typeof value === "object" && Array.isArray((value as { tests?: unknown[] }).tests) ? (value as { tests: unknown[] }).tests : [value])
    return records.map((record) => outcome(record && typeof record === "object" ? (record as Record<string, unknown>).status ?? (record as Record<string, unknown>).outcome ?? (record as Record<string, unknown>).result : record))
  } catch { return [] }
}
export async function analyzeHistory(input: string): Promise<Record<string, unknown>> {
  const root = await safeRoot(input)
  const files = await collect(root)
  const totals = { passed: 0, failed: 0, skipped: 0, unknown: 0 }
  let fileCount = 0
  for (const file of files) {
    const target = await realpath(path.resolve(root, file)).catch(() => "")
    const info = target ? await stat(target).catch(() => null) : null
    if (!info?.isFile() || info.size > MAX_FILE_BYTES) continue
    let content: string
    try { content = await readFile(target, "utf8") } catch { continue }
    const outcomes = parseRecords(file, content)
    if (outcomes.length === 0) continue
    fileCount += 1
    for (const item of outcomes) totals[item] += 1
  }
  const total = totals.passed + totals.failed + totals.skipped + totals.unknown
  const failureRate = total ? Number((totals.failed / total).toFixed(4)) : 0
  const instabilitySignal = total >= 3 && totals.failed > 0 && totals.passed > 0 ? "mixed-outcomes-observed" : total >= 3 && totals.failed === total ? "consistently-failing" : total >= 3 && totals.passed === total ? "consistently-passing" : "insufficient-history"
  return { root: "<local-project>", historyFileCount: fileCount, totalObservations: total, totals, failureRate, instabilitySignal, valueFree: true, warning: "Only aggregate outcome counts and coarse stability signals are returned. Test names, file names, raw records, exact versions, paths, and secret values are never emitted." }
}
export function format(value: unknown): string { const output = JSON.stringify(value, null, 2); return output.length <= MAX_OUTPUT ? output : JSON.stringify({ error: "Result exceeded the output budget and was reduced.", valueFree: true, truncated: true }) }
