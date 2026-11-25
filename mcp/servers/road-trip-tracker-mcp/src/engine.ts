import { promises as fs } from "node:fs"
import path from "node:path"
import { z } from "zod"
import { ToolError } from "./run.js"
import { config } from "./config.js"

export const CONDITIONS = ["new", "good", "fair", "worn"] as const
export type Condition = (typeof CONDITIONS)[number]

export interface CategoryConfig {
  id: string
  label: string
  baseline: number
}

export interface MetricConfig {
  id: string
  label: string
  unit: string
  target: number
  direction: "lower" | "higher"
}

export interface DependencyGroup {
  id: string
  label: string
  categories: string[]
}

export interface ServerConfig {
  name: string
  title: string
  description: string
  prefix: string
  entity: string
  categories: CategoryConfig[]
  metric: MetricConfig
  target: {
    maxItems: number
    budget: number | null
    coverage: number
    expiryDays: number
  }
  dependencies: DependencyGroup[]
  sample: RawItem[]
}

export const itemSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  tags: z.array(z.string().min(1).max(80)).max(20).optional(),
  cost: z.number().min(0).max(1_000_000).optional(),
  quantity: z.number().min(0).max(1_000_000).optional(),
  acquired: z.string().max(10).optional(),
  expires: z.string().max(10).optional(),
  lastUsed: z.string().max(10).optional(),
  condition: z.enum(CONDITIONS).optional(),
  notes: z.string().max(1000).optional(),
})

export type RawItem = z.infer<typeof itemSchema>

export const targetSchema = z.object({
  maxItems: z.number().int().min(1).max(1000).optional(),
  budget: z.number().min(0).max(1_000_000).nullable().optional(),
  coverage: z.number().min(0).max(1).optional(),
  expiryDays: z.number().int().min(0).max(3650).optional(),
})

export type TargetInput = z.infer<typeof targetSchema>

export interface TargetProfile {
  maxItems: number
  budget: number | null
  coverage: number
  expiryDays: number
}

export interface DataIssue {
  code: string
  severity: "error" | "warning"
  message: string
  itemId?: string
}

export interface CollectionItem {
  id: string
  name: string
  category: string
  tags: string[]
  cost: number | null
  quantity: number | null
  acquired: string | null
  expires: string | null
  lastUsed: string | null
  condition: Condition
  notes: string | null
  dataFields: number
}

export interface LoadedCollection {
  items: CollectionItem[]
  issues: DataIssue[]
  source: string
  rawCount: number
}

export interface Gap {
  type: "category" | "expiry" | "dependency"
  key: string
  missing: number
  severity: "high" | "medium" | "low"
  message: string
}

export interface Risk {
  code: string
  severity: "critical" | "high" | "medium" | "low"
  message: string
  impact: number
}

export interface Constraint {
  key: string
  label: string
  pass: boolean
  actual: unknown
  target: unknown
  message: string
}

export interface DuplicateGroup {
  key: string
  count: number
  ids: string[]
  names: string[]
}

export interface Fix {
  action: string
  impact: number
  effort: number
  score: number
  source: string
}

export interface Analysis {
  target: TargetProfile
  itemCount: number
  items: CollectionItem[]
  categoryCounts: Record<string, number>
  unknownCategories: string[]
  totalCost: number
  knownCostCount: number
  totalQuantity: number
  knownQuantityCount: number
  expired: CollectionItem[]
  expiring: CollectionItem[]
  metricRows: Array<{ id: string; name: string; value: number | null }>
  metricMean: number
  metricPassCount: number
  metricKnownCount: number
  categoryCoverage: Record<string, number>
  coverageScore: number
  conditionScore: number
  dataCompleteness: number
  readiness: number
  confidence: number
  gaps: Gap[]
  risks: Risk[]
  constraints: Constraint[]
  duplicates: DuplicateGroup[]
  variance: {
    metric: { count: number; mean: number; variance: number; stddev: number; min: number; max: number }
    categories: { mean: number; variance: number }
    tagDiversity: number
  }
  benchmark: {
    rows: Array<{ metric: string; value: number; target: string; pass: boolean }>
    passed: number
    total: number
    verdict: "strong" | "mixed" | "thin"
  }
  options: Array<{ name: string; maxItems: number; expected: Record<string, number>; fit: number }>
  tradeoffs: Array<{ title: string; current: string; note: string }>
  checklist: Array<{ item: string; done: boolean }>
  quickWins: Fix[]
  fixes: Fix[]
  nextSteps: Fix[]
  questions: string[]
  edgeCases: string[]
  dataIssues: DataIssue[]
  summary: {
    items: number
    readiness: number
    confidence: number
    totalCost: number
    metricMean: number
    gaps: number
    risks: number
    duplicates: number
    dataIssues: number
  }
}

const MAX_INPUT = 2_000_000
const MAX_ITEMS = 500
const round = (value: number, digits = 2): number => {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length
const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0)
const today = (): string => new Date().toISOString().slice(0, 10)
const parseDate = (value: string): number | null => {
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) ? time : null
}
const daysBetween = (from: string, to: string): number | null => {
  const left = parseDate(from)
  const right = parseDate(to)
  return left === null || right === null ? null : Math.round((right - left) / 86_400_000)
}
const normalizeText = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeItem(raw: RawItem, index: number, issues: DataIssue[]): CollectionItem {
  const id = raw.id?.trim() || `item-${index + 1}`
  let dataFields = 0
  if (raw.cost !== undefined) dataFields += 1
  if (raw.quantity !== undefined) dataFields += 1
  if (raw.acquired !== undefined) dataFields += 1
  if (raw.expires !== undefined) dataFields += 1
  if (raw.lastUsed !== undefined) dataFields += 1
  if (raw.condition !== undefined) dataFields += 1
  if (raw.tags !== undefined) dataFields += 1
  if (raw.notes !== undefined) dataFields += 1

  const checkDate = (key: "acquired" | "expires" | "lastUsed"): string | null => {
    const value = raw[key]
    if (!value) return null
    if (parseDate(value) === null) {
      issues.push({
        code: `invalid_${key}`,
        severity: "warning",
        message: `${id} has an invalid ${key} date; expected YYYY-MM-DD.`,
        itemId: id,
      })
      return null
    }
    return value
  }

  return {
    id,
    name: raw.name.trim(),
    category: raw.category.trim(),
    tags: [...new Set((raw.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    cost: raw.cost ?? null,
    quantity: raw.quantity ?? null,
    acquired: checkDate("acquired"),
    expires: checkDate("expires"),
    lastUsed: checkDate("lastUsed"),
    condition: raw.condition ?? "good",
    notes: raw.notes?.trim() || null,
    dataFields,
  }
}

export async function loadCollection(input: {
  items?: unknown[]
  content?: string
  path?: string
  cwd?: string
}): Promise<LoadedCollection> {
  if (input.items !== undefined && (input.content !== undefined || input.path !== undefined)) {
    throw new ToolError("Use one source: items, content, or path.")
  }
  if (input.content !== undefined && input.path !== undefined) {
    throw new ToolError("Use content or path, not both.")
  }

  let raw: unknown
  let source = "inline"
  if (input.items !== undefined) {
    raw = input.items
  } else if (input.content !== undefined) {
    if (input.content.length > MAX_INPUT) throw new ToolError(`Input is larger than ${MAX_INPUT} characters.`)
    try {
      raw = JSON.parse(input.content)
    } catch {
      throw new ToolError("Content is not valid JSON.")
    }
    source = "content"
  } else if (input.path) {
    if (input.path.includes("\0")) throw new ToolError("Path contains a null byte.")
    const file = path.isAbsolute(input.path)
      ? input.path
      : path.resolve(input.cwd ? path.resolve(input.cwd) : process.cwd(), input.path)
    const stat = await fs.stat(file)
    if (!stat.isFile()) throw new ToolError(`Not a file: ${file}`)
    if (stat.size > MAX_INPUT) throw new ToolError(`File is larger than ${MAX_INPUT} bytes.`)
    const body = await fs.readFile(file, "utf8")
    try {
      raw = JSON.parse(body)
    } catch {
      throw new ToolError(`File is not valid JSON: ${file}`)
    }
    source = file
  } else {
    throw new ToolError("Provide items, content, or path.")
  }

  const rawItems = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : null
  if (!rawItems) throw new ToolError("Collection JSON must be an array or an object with an items array.")
  if (rawItems.length > MAX_ITEMS) throw new ToolError(`Collection has more than ${MAX_ITEMS} items.`)

  const items: CollectionItem[] = []
  const issues: DataIssue[] = []
  rawItems.forEach((value, index) => {
    const parsed = itemSchema.safeParse(value)
    if (!parsed.success) {
      issues.push({
        code: "invalid_item",
        severity: "error",
        message: `Item ${index + 1}: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "item"} ${issue.message}`).join("; ")}`,
      })
      return
    }
    items.push(normalizeItem(parsed.data, index, issues))
  })

  const idCounts = new Map<string, number>()
  for (const item of items) idCounts.set(item.id, (idCounts.get(item.id) ?? 0) + 1)
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ code: "duplicate_id", severity: "error", message: `Item id ${id} appears ${count} times.`, itemId: id })
    }
  }
  const missingCost = items.filter((item) => item.cost === null).length
  const missingQuantity = items.filter((item) => item.quantity === null).length
  const missingExpiry = items.filter((item) => item.expires === null).length
  if (missingCost) issues.push({ code: "missing_cost", severity: "warning", message: `${missingCost} item(s) have no cost.` })
  if (missingQuantity) issues.push({ code: "missing_quantity", severity: "warning", message: `${missingQuantity} item(s) have no quantity.` })
  if (missingExpiry) issues.push({ code: "missing_expiry", severity: "warning", message: `${missingExpiry} item(s) have no expiry date.` })
  if (items.length === 0) issues.push({ code: "empty_collection", severity: "error", message: "No valid items were loaded." })

  return { items, issues, source, rawCount: rawItems.length }
}

export function normalizeTarget(input?: TargetInput): TargetProfile {
  return {
    maxItems: input?.maxItems ?? config.target.maxItems,
    budget: input?.budget ?? config.target.budget,
    coverage: input?.coverage ?? config.target.coverage,
    expiryDays: input?.expiryDays ?? config.target.expiryDays,
  }
}

function metricValue(item: CollectionItem, tagCounts: Map<string, number>): number | null {
  switch (config.metric.id) {
    case "cost_per_use":
      return item.cost !== null && item.quantity !== null ? item.cost / Math.max(1, item.quantity) : null
    case "days_to_expiry":
      return item.expires ? daysBetween(today(), item.expires) : null
    case "active_overlap":
      return item.tags.filter((tag) => (tagCounts.get(tag) ?? 0) > 1).length
    case "clearance_risk":
      return item.tags.includes("denied") ? 5 : item.tags.includes("pending") ? 3 : item.tags.includes("cleared") ? 0 : 2
    case "dtc_severity":
      return item.tags.includes("critical") ? 5 : item.tags.includes("warning") ? 3 : item.tags.includes("info") ? 1 : 2
    case "battery_health":
    case "germination_rate":
    case "contrast_ratio":
    case "paint_liters":
    case "service_gap":
      return item.quantity
    default:
      return item.quantity
  }
}

function metricPass(value: number): boolean {
  return config.metric.direction === "lower" ? value <= config.metric.target : value >= config.metric.target
}

function conditionScore(condition: Condition): number {
  switch (condition) {
    case "new":
      return 1
    case "good":
      return 0.8
    case "fair":
      return 0.5
    case "worn":
      return 0.2
  }
}

function findDuplicates(items: CollectionItem[]): DuplicateGroup[] {
  const groups = new Map<string, CollectionItem[]>()
  for (const item of items) {
    const key = `${item.category}|${normalizeText(item.name)}`
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      count: group.length,
      ids: group.map((item) => item.id),
      names: group.map((item) => item.name),
    }))
}

function rankFixes(candidates: Array<Omit<Fix, "score">>): Fix[] {
  return candidates
    .map((fix) => ({ ...fix, score: round(fix.impact / Math.max(1, fix.effort), 2) }))
    .sort((left, right) => right.score - left.score || right.impact - left.impact)
}

export function analyze(loaded: LoadedCollection, targetInput?: TargetProfile): Analysis {
  const target = targetInput ?? normalizeTarget()
  const items = loaded.items
  const categoryCounts: Record<string, number> = {}
  for (const category of config.categories) categoryCounts[category.id] = 0
  for (const item of items) categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1
  const unknownCategories = [...new Set(items.map((item) => item.category))].filter(
    (category) => !config.categories.some((known) => known.id === category),
  )

  const totalCost = round(sum(items.map((item) => item.cost ?? 0)))
  const knownCostCount = items.filter((item) => item.cost !== null).length
  const totalQuantity = round(sum(items.map((item) => item.quantity ?? 0)))
  const knownQuantityCount = items.filter((item) => item.quantity !== null).length
  const current = today()
  const expired = items.filter((item) => item.expires !== null && (daysBetween(current, item.expires) ?? 0) < 0)
  const expiring = items.filter((item) => {
    const days = item.expires ? daysBetween(current, item.expires) : null
    return days !== null && days >= 0 && days <= target.expiryDays
  })

  const tagCounts = new Map<string, number>()
  for (const item of items) for (const tag of item.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  const metricRows = items.map((item) => ({ id: item.id, name: item.name, value: metricValue(item, tagCounts) }))
  const metricValues = metricRows.map((row) => row.value).filter((value): value is number => value !== null)
  const metricMean = round(average(metricValues))
  const metricPassCount = metricValues.filter(metricPass).length
  const metricKnownCount = metricValues.length

  const categoryCoverage = Object.fromEntries(
    config.categories.map((category) => [
      category.id,
      category.baseline === 0 ? 1 : Math.min(1, (categoryCounts[category.id] ?? 0) / category.baseline),
    ]),
  )
  const coverageScore = average(Object.values(categoryCoverage))
  const conditionAvg = average(items.map((item) => conditionScore(item.condition)))
  const dataCompleteness = average(items.map((item) => item.dataFields / 8))
  const expiryScore =
    expired.length + expiring.length === 0
      ? 1
      : Math.max(0, 1 - (expired.length + expiring.length * 0.5) / Math.max(1, items.filter((item) => item.expires).length))
  const metricScore = metricKnownCount === 0 ? 0 : metricPassCount / metricKnownCount
  const readiness = Math.round(
    100 * (0.45 * coverageScore + 0.2 * conditionAvg + 0.15 * dataCompleteness + 0.1 * expiryScore + 0.1 * metricScore),
  )
  const confidence =
    items.length === 0
      ? 0
      : Math.round(
          100 *
            (0.5 * dataCompleteness +
              0.2 * Math.min(1, items.length / 20) +
              0.15 * (knownCostCount / items.length) +
              0.15 * (knownQuantityCount / items.length)),
        )

  const gaps: Gap[] = []
  for (const category of config.categories) {
    const missing = Math.max(0, category.baseline - (categoryCounts[category.id] ?? 0))
    if (missing === 0) continue
    gaps.push({
      type: "category",
      key: category.id,
      missing,
      severity: missing >= category.baseline ? "high" : "medium",
      message: `Add ${missing} ${category.label.toLowerCase()} item(s) to reach the ${category.baseline}-item baseline.`,
    })
  }
  if (expired.length) {
    gaps.push({
      type: "expiry",
      key: "expired",
      missing: expired.length,
      severity: "high",
      message: `${expired.length} item(s) are past their expiry date.`,
    })
  }
  if (expiring.length) {
    gaps.push({
      type: "expiry",
      key: "expiring",
      missing: expiring.length,
      severity: "medium",
      message: `${expiring.length} item(s) expire within ${target.expiryDays} days.`,
    })
  }
  for (const dependency of config.dependencies) {
    if (dependency.categories.some((category) => (categoryCounts[category] ?? 0) > 0)) continue
    gaps.push({
      type: "dependency",
      key: dependency.id,
      missing: 1,
      severity: "medium",
      message: `No item covers the ${dependency.label.toLowerCase()} dependency.`,
    })
  }

  const duplicates = findDuplicates(items)
  const risks: Risk[] = []
  if (items.length === 0) risks.push({ code: "empty", severity: "critical", message: "No items are loaded.", impact: 5 })
  if (coverageScore < target.coverage) {
    risks.push({
      code: "low_coverage",
      severity: "high",
      message: `Category coverage is ${Math.round(coverageScore * 100)}%, below ${Math.round(target.coverage * 100)}%.`,
      impact: 4,
    })
  }
  if (expired.length) risks.push({ code: "expired", severity: "critical", message: `${expired.length} item(s) are expired.`, impact: 5 })
  if (expiring.length) risks.push({ code: "expiring", severity: "medium", message: `${expiring.length} item(s) expire soon.`, impact: 3 })
  if (target.budget !== null && totalCost > target.budget) {
    risks.push({ code: "over_budget", severity: "high", message: `Cost ${totalCost} exceeds budget ${target.budget}.`, impact: 4 })
  }
  if (items.length > target.maxItems) {
    risks.push({ code: "over_max", severity: "medium", message: `${items.length} items exceed the ${target.maxItems}-item cap.`, impact: 3 })
  }
  const worn = items.filter((item) => item.condition === "worn")
  if (worn.length) risks.push({ code: "worn", severity: "medium", message: `${worn.length} item(s) are worn.`, impact: 3 })
  if (duplicates.length) risks.push({ code: "duplicates", severity: "low", message: `${duplicates.length} duplicate group(s) found.`, impact: 2 })
  if (dataCompleteness < 0.7) risks.push({ code: "thin_data", severity: "medium", message: "Cost, quantity, or date data is incomplete.", impact: 3 })
  if (metricKnownCount > 0 && metricPassCount < metricKnownCount) {
    risks.push({
      code: "metric_miss",
      severity: "medium",
      message: `${metricKnownCount - metricPassCount} item(s) miss the ${config.metric.label.toLowerCase()} target.`,
      impact: 3,
    })
  }
  if (unknownCategories.length) {
    risks.push({
      code: "unknown_categories",
      severity: "low",
      message: `Unknown categories: ${unknownCategories.join(", ")}.`,
      impact: 2,
    })
  }

  const constraints: Constraint[] = [
    {
      key: "max_items",
      label: "Item count",
      pass: items.length <= target.maxItems,
      actual: items.length,
      target: target.maxItems,
      message: items.length <= target.maxItems ? "Within the item cap." : "Over the item cap.",
    },
    {
      key: "budget",
      label: "Budget",
      pass: target.budget === null || totalCost <= target.budget,
      actual: totalCost,
      target: target.budget,
      message: target.budget === null ? "No budget set." : totalCost <= target.budget ? "Within budget." : "Over budget.",
    },
    {
      key: "coverage",
      label: "Category coverage",
      pass: coverageScore >= target.coverage,
      actual: round(coverageScore, 3),
      target: target.coverage,
      message: coverageScore >= target.coverage ? "Coverage target met." : "Coverage target missed.",
    },
    {
      key: "expiry",
      label: "Expiry",
      pass: expired.length === 0,
      actual: expired.length,
      target: 0,
      message: expired.length === 0 ? "No expired items." : `${expired.length} expired item(s).`,
    },
    {
      key: "metric",
      label: config.metric.label,
      pass: metricKnownCount === 0 || metricPassCount === metricKnownCount,
      actual: { known: metricKnownCount, passing: metricPassCount, mean: metricMean },
      target: config.metric.target,
      message: metricKnownCount === 0 ? "No metric data." : `${metricPassCount}/${metricKnownCount} item(s) meet the target.`,
    },
  ]

  const metricVariance = metricValues.length
    ? average(metricValues.map((value) => (value - average(metricValues)) ** 2))
    : 0
  const categoryValues = config.categories.map((category) => categoryCounts[category.id] ?? 0)
  const categoryMean = average(categoryValues)
  const categoryVariance = average(categoryValues.map((value) => (value - categoryMean) ** 2))
  const uniqueTags = new Set(items.flatMap((item) => item.tags)).size
  const variance = {
    metric: {
      count: metricValues.length,
      mean: metricMean,
      variance: round(metricVariance),
      stddev: round(Math.sqrt(metricVariance)),
      min: metricValues.length ? round(Math.min(...metricValues)) : 0,
      max: metricValues.length ? round(Math.max(...metricValues)) : 0,
    },
    categories: { mean: round(categoryMean), variance: round(categoryVariance) },
    tagDiversity: items.length ? round(uniqueTags / items.length, 3) : 0,
  }

  const benchmarkRows = [
    {
      metric: "item_count",
      value: items.length,
      target: `${Math.ceil(target.maxItems * 0.8)}-${target.maxItems}`,
      pass: items.length >= Math.ceil(target.maxItems * 0.8) && items.length <= target.maxItems,
    },
    { metric: "readiness", value: readiness, target: ">=70", pass: readiness >= 70 },
    { metric: "coverage", value: Math.round(coverageScore * 100), target: `>=${Math.round(target.coverage * 100)}`, pass: coverageScore >= target.coverage },
    { metric: config.metric.id, value: metricMean, target: `${config.metric.direction === "lower" ? "<=" : ">="}${config.metric.target}`, pass: metricKnownCount > 0 && metricPassCount === metricKnownCount },
    { metric: "data_completeness", value: Math.round(dataCompleteness * 100), target: ">=80", pass: dataCompleteness >= 0.8 },
  ]
  const benchmarkPassed = benchmarkRows.filter((row) => row.pass).length
  const benchmark = {
    rows: benchmarkRows,
    passed: benchmarkPassed,
    total: benchmarkRows.length,
    verdict: (benchmarkPassed >= 4 ? "strong" : benchmarkPassed >= 2 ? "mixed" : "thin") as "strong" | "mixed" | "thin",
  }

  const options = [
    { name: "lean", maxItems: Math.max(1, Math.round(target.maxItems * 0.7)) },
    { name: "balanced", maxItems: target.maxItems },
    { name: "full", maxItems: Math.round(target.maxItems * 1.3) },
  ].map((option) => {
    const scale = option.maxItems / Math.max(1, target.maxItems)
    const expected = Object.fromEntries(
      config.categories.map((category) => [category.id, Math.round(category.baseline * scale)]),
    ) as Record<string, number>
    const fit = Math.round(
      100 *
        average(
          config.categories.map((category) =>
            expected[category.id] === 0 ? 1 : Math.min(1, (categoryCounts[category.id] ?? 0) / expected[category.id]),
          ),
        ),
    )
    return { ...option, expected, fit }
  })

  const tradeoffs = [
    {
      title: "Collection size vs coverage",
      current: `${items.length} items`,
      note:
        items.length < Math.ceil(target.maxItems * 0.8)
          ? "Small collection. Fill the baseline gaps before adding extras."
          : items.length > target.maxItems
            ? "Large collection. Remove low-use items to sharpen the set."
            : "Balanced size. Replace rather than add.",
    },
    {
      title: "Cost vs use",
      current: `${metricMean} mean ${config.metric.label.toLowerCase()}`,
      note:
        metricKnownCount > 0 && metricPassCount === metricKnownCount
          ? "All measured items meet the target."
          : "Some items miss the target; use them more or retire them.",
    },
    {
      title: "Freshness vs stock",
      current: `${expired.length} expired, ${expiring.length} expiring`,
      note: expired.length ? "Clear expired items before buying more." : "No expired items; keep the expiry window visible.",
    },
    {
      title: "Data quality vs speed",
      current: `${Math.round(dataCompleteness * 100)}% complete`,
      note: dataCompleteness < 0.8 ? "Fill cost, quantity, and dates before trusting the score." : "Data is strong enough for decisions.",
    },
  ]

  const checklistItems = [
    ...gaps.slice(0, 10).map((gap) => gap.message),
    ...risks.filter((risk) => risk.severity === "critical" || risk.severity === "high").slice(0, 6).map((risk) => risk.message),
    ...(target.budget === null ? ["Set a total budget."] : []),
    ...(dataCompleteness < 0.8 ? ["Fill missing cost, quantity, and date fields."] : []),
  ]
  const checklist = [...new Set(checklistItems)].map((item) => ({ item, done: false }))

  const quickCandidates: Array<Omit<Fix, "score">> = [
    ...gaps.filter((gap) => gap.missing <= 2).map((gap) => ({
      action: gap.message,
      impact: gap.severity === "high" ? 5 : 3,
      effort: 1,
      source: "gap",
    })),
    ...loaded.issues.filter((issue) => issue.severity === "warning").slice(0, 8).map((issue) => ({
      action: issue.message,
      impact: 2,
      effort: 1,
      source: "data",
    })),
    ...expired.slice(0, 5).map((item) => ({ action: `Remove or replace ${item.name}.`, impact: 5, effort: 1, source: "expiry" })),
    ...duplicates.slice(0, 5).map((group) => ({
      action: `Remove or consolidate duplicate ${group.names[0]}.`,
      impact: 3,
      effort: 1,
      source: "duplicate",
    })),
  ]
  const quickWins = rankFixes(quickCandidates).slice(0, 8)

  const fixCandidates: Array<Omit<Fix, "score">> = [
    ...gaps.map((gap) => ({
      action: gap.message,
      impact: gap.severity === "high" ? 5 : gap.severity === "medium" ? 3 : 2,
      effort: 2,
      source: "gap",
    })),
    ...risks.map((risk) => ({
      action: risk.message,
      impact: risk.impact,
      effort: risk.severity === "critical" ? 1 : 2,
      source: "risk",
    })),
    ...loaded.issues.filter((issue) => issue.severity === "error").map((issue) => ({
      action: issue.message,
      impact: 4,
      effort: 1,
      source: "data-error",
    })),
  ]
  const fixes = rankFixes(fixCandidates).slice(0, 12)
  const nextSteps = fixes.slice(0, 5)

  const questions: string[] = []
  if (items.length === 0) questions.push("Do you have a collection list to import?")
  if (target.budget === null) questions.push("What total budget should this collection stay under?")
  if (dataCompleteness < 0.8) questions.push("Can you fill in cost, quantity, and date fields?")
  if (expired.length || expiring.length) questions.push("Which expired or expiring items should be replaced first?")
  if (duplicates.length) questions.push("Which duplicate items can be removed?")
  if (unknownCategories.length) questions.push(`Should these categories be added: ${unknownCategories.join(", ")}?`)
  if (questions.length === 0) questions.push(`What is the one ${config.entity} job you need this collection to handle first?`)

  const edgeCases: string[] = []
  if (items.length === 0) edgeCases.push("Empty collection.")
  if (items.length === 1) edgeCases.push("Single item; coverage is not meaningful yet.")
  if (new Set(items.map((item) => item.id)).size !== items.length) edgeCases.push("Duplicate item ids.")
  if (items.some((item) => item.cost === 0)) edgeCases.push("Zero-cost item.")
  if (expired.length) edgeCases.push("Expired items present.")
  if (items.every((item) => item.expires === null)) edgeCases.push("No expiry dates; freshness is unknown.")
  if (unknownCategories.length) edgeCases.push("Unknown categories present.")

  return {
    target,
    itemCount: items.length,
    items,
    categoryCounts,
    unknownCategories,
    totalCost,
    knownCostCount,
    totalQuantity,
    knownQuantityCount,
    expired,
    expiring,
    metricRows,
    metricMean,
    metricPassCount,
    metricKnownCount,
    categoryCoverage,
    coverageScore,
    conditionScore: conditionAvg,
    dataCompleteness,
    readiness,
    confidence,
    gaps,
    risks,
    constraints,
    duplicates,
    variance,
    benchmark,
    options,
    tradeoffs,
    checklist,
    quickWins,
    fixes,
    nextSteps,
    questions,
    edgeCases,
    dataIssues: loaded.issues,
    summary: {
      items: items.length,
      readiness,
      confidence,
      totalCost,
      metricMean,
      gaps: gaps.length,
      risks: risks.length,
      duplicates: duplicates.length,
      dataIssues: loaded.issues.length,
    },
  }
}

export function changeSet(before: LoadedCollection, after: LoadedCollection) {
  const beforeMap = new Map(before.items.map((item) => [item.id, item]))
  const afterMap = new Map(after.items.map((item) => [item.id, item]))
  const added = after.items.filter((item) => !beforeMap.has(item.id))
  const removed = before.items.filter((item) => !afterMap.has(item.id))
  const changed = after.items
    .filter((item) => beforeMap.has(item.id) && JSON.stringify(beforeMap.get(item.id)) !== JSON.stringify(item))
    .map((item) => ({ before: beforeMap.get(item.id), after: item }))
  return {
    counts: {
      before: before.items.length,
      after: after.items.length,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
    },
    added,
    removed,
    changed,
  }
}
