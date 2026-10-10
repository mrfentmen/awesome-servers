import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

// ---- muxB tools:
const ALLOWED_NAME = /(?:test|run|result|report|junit|jest|playwright|cypress|pytest|vitest|mocha|tap)/i
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache", "vendor"])
const MAX_FILES = 80
const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_DEPTH = 4

type Outcome = "passed" | "failed" | "skipped" | "unknown"
type Cohort = { format: string; outcomes: Outcome[] }

function pad(label: string, width = 22): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

function outcomeOf(value: unknown): Outcome {
  const text = String(value ?? "").trim().toLowerCase()
  if (/^(?:skip|skipped|pending|todo|neutral)$/.test(text)) return "skipped"
  if (/^(?:fail|failed|failure|error|errored|broken|not ok\b|red|false|0)$/.test(text)) return "failed"
  if (/^(?:pass|passed|success|successful|ok|green|true|1)$/.test(text)) return "passed"
  return "unknown"
}

function parseRecords(file: string, content: string): Outcome[] {
  try {
    const lower = file.toLowerCase()
    if (lower.endsWith(".csv")) return content.split(/\r?\n/).slice(1).filter(Boolean).map((line) => outcomeOf(line.split(",").at(-1)))
    if (lower.endsWith(".jsonl")) return content.split(/\r?\n/).filter(Boolean).map((line) => { const record = JSON.parse(line) as Record<string, unknown>; return outcomeOf(record.status ?? record.outcome ?? record.result) })
    if (lower.endsWith(".xml")) {
      const results: Outcome[] = []
      for (const match of content.matchAll(/<(?:testcase|test)\b([^>]*)>([\s\S]*?)<\/(?:testcase|test)>/gi)) {
        if (/<(?:failure|error)\b/i.test(match[2])) results.push("failed")
        else if (/<skipped\b/i.test(match[2])) results.push("skipped")
        else results.push(outcomeOf(match[1].match(/(?:status|result|outcome)=["']([^"']+)["']/i)?.[1] ?? "passed"))
      }
      for (const match of content.matchAll(/<(?:testcase|test)\b([^>]*)\/>/gi)) results.push(outcomeOf(match[1].match(/(?:status|result|outcome)=["']([^"']+)["']/i)?.[1] ?? "passed"))
      return results
    }
    const value = JSON.parse(content) as unknown
    const records = Array.isArray(value) ? value : (value && typeof value === "object" && Array.isArray((value as { tests?: unknown[] }).tests) ? (value as { tests: unknown[] }).tests : [value])
    return records.map((record) => outcomeOf(record && typeof record === "object" ? (record as Record<string, unknown>).status ?? (record as Record<string, unknown>).outcome ?? (record as Record<string, unknown>).result : record))
  } catch {
    return []
  }
}

async function collectCohorts(input: string): Promise<{ cohorts: Cohort[]; considered: number; formats: Record<string, number> }> {
  const configured = process.env.FLAKY_HISTORY_ROOT ?? path.join(process.cwd(), "..")
  const allowedRoot = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input) ? input : path.resolve(allowedRoot, input || ".")
  const root = await realpath(requested).catch(() => requested)
  const relative = path.relative(allowedRoot, root)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Project path must stay inside the configured local workspace")
  const candidates: string[] = []
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || candidates.length >= MAX_FILES) return
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const rel = path.relative(root, resolved)
      if (rel.startsWith("..") || path.isAbsolute(rel)) continue
      if (entry.isDirectory()) await walk(resolved, depth + 1)
      else if (ALLOWED_NAME.test(entry.name) && /\.(?:json|jsonl|csv|xml)$/i.test(entry.name)) candidates.push(rel)
      if (candidates.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  const unique = [...new Set(candidates)].sort()
  const cohorts: Cohort[] = []
  const formats: Record<string, number> = {}
  for (const file of unique) {
    const target = await realpath(path.resolve(root, file)).catch(() => "")
    const info = target ? await stat(target).catch(() => null) : null
    if (!info?.isFile() || info.size > MAX_FILE_BYTES) continue
    const content = await readFile(target, "utf8").catch(() => "")
    const outcomes = parseRecords(file, content)
    if (!outcomes.length) continue
    const format = file.toLowerCase().endsWith(".csv") ? "csv" : file.toLowerCase().endsWith(".jsonl") ? "jsonl" : file.toLowerCase().endsWith(".xml") ? "xml" : "json"
    formats[format] = (formats[format] ?? 0) + 1
    cohorts.push({ format, outcomes })
  }
  return { cohorts, considered: unique.length, formats }
}

export async function historyCohortSpread(args: { project?: string }): Promise<string> {
  const { cohorts, considered, formats } = await collectCohorts(args.project ?? ".")
  const out: string[] = []
  out.push(`History cohort spread (${cohorts.length} history files with records out of ${considered} candidates)`)
  out.push(`${pad("Formats")}${Object.keys(formats).sort().map((key) => `${key}=${formats[key]}`).join("  ") || "not reported"}`)
  if (cohorts.length < 2) {
    out.push(`${pad("Result")}fewer than two cohorts parsed, spread is not computable`)
    out.push("Test names, file names, raw records, exact versions, paths and secret values are never emitted.")
    return out.join("\n")
  }
  const rates = cohorts.map((cohort) => cohort.outcomes.filter((item) => item === "failed").length / cohort.outcomes.length)
  const sizes = cohorts.map((cohort) => cohort.outcomes.length).sort((a, b) => a - b)
  const mean = rates.reduce((sum, value) => sum + value, 0) / rates.length
  const variance = rates.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rates.length
  const sorted = [...rates].sort((a, b) => a - b)
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
  const allFail = rates.filter((value) => value === 1).length
  const allPass = rates.filter((value) => value === 0).length
  const mixed = rates.length - allFail - allPass
  const bands = { "0%": 0, "1-10%": 0, "11-50%": 0, "51-99%": 0, "100%": 0 }
  for (const rate of rates) {
    if (rate === 0) bands["0%"] += 1
    else if (rate <= 0.1) bands["1-10%"] += 1
    else if (rate <= 0.5) bands["11-50%"] += 1
    else if (rate < 1) bands["51-99%"] += 1
    else bands["100%"] += 1
  }
  const totalRecords = sizes.reduce((sum, value) => sum + value, 0)
  out.push(`${pad("Cohorts")}${rates.length} with a computed failure rate`)
  out.push(`${pad("Failure rate")}mean ${(mean * 100).toFixed(1)}%  median ${(median * 100).toFixed(1)}%  min ${(sorted[0] * 100).toFixed(1)}%  max ${(sorted[sorted.length - 1] * 100).toFixed(1)}%`)
  out.push(`${pad("Dispersion")}standard deviation ${(Math.sqrt(variance) * 100).toFixed(1)} points, coefficient of variation ${mean > 0 ? (Math.sqrt(variance) / mean).toFixed(2) : "not reported (mean is zero)"}`)
  out.push(`${pad("Cohort mix")}${allPass} all-pass  ${mixed} mixed  ${allFail} all-fail`)
  out.push(`${pad("Rate histogram")}${Object.entries(bands).map(([label, count]) => `${label}:${count}`).join("  ")}`)
  out.push(`${pad("Cohort size")}min ${sizes[0]}  median ${sizes[Math.floor((sizes.length - 1) / 2)]}  max ${sizes[sizes.length - 1]} records`)
  out.push(`${pad("Concentration")}${totalRecords ? ((sizes[sizes.length - 1] / totalRecords) * 100).toFixed(1) : "0.0"}% of all observations sit in the largest single cohort`)
  out.push(`${pad("Verdict")}${Math.sqrt(variance) > 0.2 ? "failure is unevenly spread across history files" : "failure is evenly spread across history files"}`)
  out.push("Test names, file names, raw records, exact versions, paths and secret values are never emitted.")
  return out.join("\n")
}

export async function historyFlapPatterns(args: { project?: string }): Promise<string> {
  const { cohorts } = await collectCohorts(args.project ?? ".")
  const out: string[] = []
  out.push(`History flap patterns (${cohorts.length} history files with records)`)
  if (!cohorts.length) {
    out.push(`${pad("Result")}no history file produced a parseable record`)
    out.push("Test names, file names, raw records, exact versions, paths and secret values are never emitted.")
    return out.join("\n")
  }
  const graded = (item: Outcome) => (item === "failed" ? "F" : item === "passed" ? "P" : item === "skipped" ? "S" : "U")
  let totalRecords = 0
  let totalTransitions = 0
  let longestAlternating = 0
  let flappingCohorts = 0
  const cohortTable: string[] = []
  for (const [index, cohort] of cohorts.entries()) {
    const sequence = cohort.outcomes.map(graded).join("")
    let transitions = 0
    for (let i = 1; i < sequence.length; i += 1) if (sequence[i] !== sequence[i - 1]) transitions += 1
    let run = 0
    let best = 0
    let previous = ""
    for (const symbol of sequence) {
      if (previous && ((symbol === "F" && previous === "P") || (symbol === "P" && previous === "F"))) { run += 1; best = Math.max(best, run) } else if (symbol === "F" || symbol === "P") { run = 1; best = Math.max(best, run) } else { run = 0 }
      previous = symbol
    }
    const flipRate = sequence.length > 1 ? transitions / (sequence.length - 1) : 0
    totalRecords += sequence.length
    totalTransitions += transitions
    longestAlternating = Math.max(longestAlternating, best)
    if (flipRate > 0.25) flappingCohorts += 1
    if (index < 12) cohortTable.push(`  cohort ${index + 1} (${cohort.format}): ${sequence.length} records, ${transitions} transitions (${(flipRate * 100).toFixed(0)}% flip rate), longest alternation ${best}`)
  }
  out.push(`${pad("Records")}${totalRecords} graded records across ${cohorts.length} cohorts`)
  out.push(`${pad("Transitions")}${totalTransitions} outcome changes (${totalRecords > 1 ? ((totalTransitions / (totalRecords - 1)) * 100).toFixed(1) : "0.0"}% of adjacent positions)`)
  out.push(`${pad("Longest alternation")}${longestAlternating} consecutive pass-fail flips in one cohort`)
  out.push(`${pad("Flapping cohorts")}${flappingCohorts} of ${cohorts.length} change outcome on more than a quarter of adjacent records`)
  out.push("Per-cohort shape (cohort index and format only):")
  for (const row of cohortTable) out.push(row)
  if (cohorts.length > cohortTable.length) out.push(`  +${cohorts.length - cohortTable.length} further cohorts not listed`)
  out.push("Test names, file names, raw records, exact versions, paths and secret values are never emitted.")
  return out.join("\n")
}
