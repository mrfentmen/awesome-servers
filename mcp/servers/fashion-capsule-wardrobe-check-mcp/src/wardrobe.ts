import { promises as fs } from "node:fs"
import path from "node:path"
import { z } from "zod"
import { ToolError } from "./run.js"

export const CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
  "underwear",
  "activewear",
  "other",
] as const
export type Category = (typeof CATEGORIES)[number]

export const SEASONS = ["spring", "summer", "fall", "winter", "all"] as const
export type Season = (typeof SEASONS)[number]
export const TARGET_SEASONS = ["spring", "summer", "fall", "winter"] as const

export const FORMALITIES = ["casual", "smart-casual", "business", "formal", "athletic", "loungewear"] as const
export type Formality = (typeof FORMALITIES)[number]

export const CONDITIONS = ["new", "good", "fair", "worn"] as const
export type Condition = (typeof CONDITIONS)[number]

export const itemSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  color: z.string().min(1).max(80).optional(),
  season: z.union([z.enum(SEASONS), z.array(z.enum(SEASONS)).min(1).max(5)]).optional(),
  formality: z.enum(FORMALITIES).optional(),
  cost: z.number().min(0).max(1_000_000).optional(),
  wearCount: z.number().int().min(0).max(1_000_000).optional(),
  lastWorn: z.string().max(10).optional(),
  condition: z.enum(CONDITIONS).optional(),
  fabric: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
})

export type RawItem = z.infer<typeof itemSchema>

export const targetSchema = z.object({
  name: z.string().max(120).optional(),
  seasons: z.array(z.enum(SEASONS)).min(1).max(5).optional(),
  dressCodes: z.array(z.enum(FORMALITIES)).min(1).max(6).optional(),
  maxItems: z.number().int().min(1).max(500).optional(),
  budget: z.number().min(0).max(1_000_000).nullable().optional(),
  targetCpw: z.number().min(0).max(10_000).optional(),
  laundryDays: z.number().int().min(1).max(30).optional(),
})

export type TargetInput = z.infer<typeof targetSchema>

export interface TargetProfile {
  name: string
  seasons: Season[]
  dressCodes: Formality[]
  maxItems: number
  budget: number | null
  targetCpw: number
  laundryDays: number
}

export interface DataIssue {
  code: string
  severity: "error" | "warning"
  message: string
  itemId?: string
}

export interface WardrobeItem {
  id: string
  name: string
  category: Category
  color: string
  season: Season[]
  formality: Formality
  cost: number | null
  wearCount: number | null
  lastWorn: string | null
  condition: Condition
  fabric: string | null
  notes: string | null
  dataFields: number
}

export interface LoadedWardrobe {
  items: WardrobeItem[]
  issues: DataIssue[]
  source: string
  rawCount: number
}

export interface Gap {
  type: "category" | "season" | "formality"
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
  items: WardrobeItem[]
  categoryCounts: Record<Category, number>
  seasonCounts: Record<string, number>
  formalityCounts: Record<string, number>
  colorCounts: Record<string, number>
  totalCost: number
  knownCostCount: number
  totalWears: number
  knownWearCount: number
  averageCpw: number
  cpwItems: Array<{ id: string; name: string; cost: number | null; wearCount: number | null; cpw: number | null }>
  categoryCoverage: Record<Category, number>
  seasonCoverage: Record<string, number>
  formalityCoverage: Record<string, number>
  readiness: number
  confidence: number
  dataCompleteness: number
  components: {
    category: number
    season: number
    formality: number
    condition: number
    data: number
    versatility: number
  }
  gaps: Gap[]
  risks: Risk[]
  constraints: Constraint[]
  duplicates: DuplicateGroup[]
  variance: {
    cpw: { count: number; mean: number; variance: number; stddev: number; min: number; max: number }
    categories: { mean: number; variance: number }
    colorDiversity: number
    uniqueColors: number
  }
  benchmark: {
    rows: Array<{ metric: string; value: number; target: string; pass: boolean }>
    passed: number
    total: number
    verdict: "strong" | "mixed" | "thin"
  }
  options: Array<{ name: string; maxItems: number; expected: Record<Category, number>; fit: number }>
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
    averageCpw: number
    gaps: number
    risks: number
    duplicates: number
    dataIssues: number
  }
}

export const BASELINE: Record<Category, number> = {
  top: 6,
  bottom: 4,
  dress: 2,
  outerwear: 2,
  shoes: 3,
  accessory: 3,
  underwear: 7,
  activewear: 3,
  other: 0,
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
const normalizeText = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeItem(raw: RawItem, index: number, issues: DataIssue[]): WardrobeItem {
  const id = raw.id?.trim() || `item-${index + 1}`
  const rawSeason = raw.season
  const season: Season[] = rawSeason
    ? Array.isArray(rawSeason)
      ? [...new Set(rawSeason)]
      : [rawSeason]
    : ["all"]
  let dataFields = 0
  if (raw.cost !== undefined) dataFields += 1
  if (raw.wearCount !== undefined) dataFields += 1
  if (raw.lastWorn !== undefined) dataFields += 1
  if (raw.color !== undefined) dataFields += 1
  if (raw.season !== undefined) dataFields += 1
  if (raw.formality !== undefined) dataFields += 1
  if (raw.condition !== undefined) dataFields += 1
  if (raw.fabric !== undefined) dataFields += 1

  let lastWorn: string | null = raw.lastWorn ?? null
  if (lastWorn) {
    const time = Date.parse(`${lastWorn}T00:00:00Z`)
    if (!Number.isFinite(time)) {
      issues.push({
        code: "invalid_last_worn",
        severity: "warning",
        message: `${id} has an invalid lastWorn date; expected YYYY-MM-DD.`,
        itemId: id,
      })
      lastWorn = null
    } else if (time > Date.now()) {
      issues.push({
        code: "future_last_worn",
        severity: "warning",
        message: `${id} has a lastWorn date in the future.`,
        itemId: id,
      })
    }
  }

  return {
    id,
    name: raw.name.trim(),
    category: raw.category,
    color: raw.color?.trim() || "unknown",
    season,
    formality: raw.formality ?? "casual",
    cost: raw.cost ?? null,
    wearCount: raw.wearCount ?? null,
    lastWorn,
    condition: raw.condition ?? "good",
    fabric: raw.fabric?.trim() || null,
    notes: raw.notes?.trim() || null,
    dataFields,
  }
}

export async function loadWardrobe(input: {
  items?: unknown[]
  content?: string
  path?: string
  cwd?: string
}): Promise<LoadedWardrobe> {
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
  if (!rawItems) throw new ToolError("Wardrobe JSON must be an array or an object with an items array.")
  if (rawItems.length > MAX_ITEMS) throw new ToolError(`Wardrobe has more than ${MAX_ITEMS} items.`)

  const items: WardrobeItem[] = []
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
      issues.push({
        code: "duplicate_id",
        severity: "error",
        message: `Item id ${id} appears ${count} times.`,
        itemId: id,
      })
    }
  }

  const missingCost = items.filter((item) => item.cost === null).length
  const missingWear = items.filter((item) => item.wearCount === null).length
  const missingLastWorn = items.filter((item) => item.lastWorn === null).length
  if (missingCost) {
    issues.push({
      code: "missing_cost",
      severity: "warning",
      message: `${missingCost} item(s) have no cost; cost-per-wear is incomplete.`,
    })
  }
  if (missingWear) {
    issues.push({
      code: "missing_wear_count",
      severity: "warning",
      message: `${missingWear} item(s) have no wear count; cost-per-wear is incomplete.`,
    })
  }
  if (missingLastWorn) {
    issues.push({
      code: "missing_last_worn",
      severity: "warning",
      message: `${missingLastWorn} item(s) have no last-worn date; recency is unknown.`,
    })
  }
  if (items.length === 0) {
    issues.push({ code: "empty_wardrobe", severity: "error", message: "No valid wardrobe items were loaded." })
  }

  return { items, issues, source, rawCount: rawItems.length }
}

export function normalizeTarget(input?: TargetInput): TargetProfile {
  const rawSeasons = input?.seasons?.length ? input.seasons : (["all"] as Season[])
  const seasons = [...new Set(rawSeasons.flatMap((season) => (season === "all" ? [...TARGET_SEASONS] : [season])))]
  const dressCodes = input?.dressCodes?.length ? [...new Set(input.dressCodes)] : [...FORMALITIES]
  return {
    name: input?.name ?? "default capsule",
    seasons,
    dressCodes,
    maxItems: input?.maxItems ?? 30,
    budget: input?.budget ?? null,
    targetCpw: input?.targetCpw ?? 10,
    laundryDays: input?.laundryDays ?? 7,
  }
}

function getCategoryCounts(items: WardrobeItem[]): Record<Category, number> {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<Category, number>
  for (const item of items) counts[item.category] += 1
  return counts
}

function coversSeason(item: WardrobeItem, season: string): boolean {
  return item.season.includes("all") || item.season.includes(season as Season)
}

function findDuplicates(items: WardrobeItem[]): DuplicateGroup[] {
  const groups = new Map<string, WardrobeItem[]>()
  for (const item of items) {
    const key = `${item.category}|${normalizeText(item.name)}|${normalizeText(item.color)}`
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

function rankFixes(candidates: Array<Omit<Fix, "score">>): Fix[] {
  return candidates
    .map((fix) => ({ ...fix, score: round(fix.impact / Math.max(1, fix.effort), 2) }))
    .sort((left, right) => right.score - left.score || right.impact - left.impact)
}

export function analyze(loaded: LoadedWardrobe, targetInput?: TargetProfile): Analysis {
  const target = targetInput ?? normalizeTarget()
  const items = loaded.items
  const categoryCounts = getCategoryCounts(items)
  const seasonCounts: Record<string, number> = {}
  for (const season of target.seasons) seasonCounts[season] = items.filter((item) => coversSeason(item, season)).length
  const formalityCounts: Record<string, number> = {}
  for (const formality of target.dressCodes) {
    formalityCounts[formality] = items.filter((item) => item.formality === formality).length
  }
  const colorCounts: Record<string, number> = {}
  for (const item of items) colorCounts[item.color] = (colorCounts[item.color] ?? 0) + 1

  const totalCost = round(sum(items.map((item) => item.cost ?? 0)))
  const knownCostCount = items.filter((item) => item.cost !== null).length
  const totalWears = sum(items.map((item) => item.wearCount ?? 0))
  const knownWearCount = items.filter((item) => item.wearCount !== null).length
  const cpwItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    cost: item.cost,
    wearCount: item.wearCount,
    cpw: item.cost !== null && item.wearCount !== null ? round(item.cost / Math.max(1, item.wearCount)) : null,
  }))
  const cpwValues = cpwItems.map((item) => item.cpw).filter((value): value is number => value !== null)
  const averageCpw = round(average(cpwValues))

  const categoryCoverage = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      BASELINE[category] === 0 ? 1 : Math.min(1, categoryCounts[category] / BASELINE[category]),
    ]),
  ) as Record<Category, number>
  const expectedPerSeason = Math.max(1, Math.ceil(target.maxItems / target.seasons.length))
  const seasonCoverage = Object.fromEntries(
    target.seasons.map((season) => [season, Math.min(1, seasonCounts[season] / expectedPerSeason)]),
  )
  const expectedPerFormality = Math.max(1, Math.ceil(target.maxItems / target.dressCodes.length))
  const formalityCoverage = Object.fromEntries(
    target.dressCodes.map((formality) => [
      formality,
      Math.min(1, formalityCounts[formality] / expectedPerFormality),
    ]),
  )

  const categoryScore = average(Object.values(categoryCoverage))
  const seasonScore = average(Object.values(seasonCoverage))
  const formalityScore = average(Object.values(formalityCoverage))
  const conditionAvg = average(items.map((item) => conditionScore(item.condition)))
  const dataCompleteness = average(items.map((item) => item.dataFields / 8))
  const versatilityScore = average(
    items.map((item) => (item.season.includes("all") ? 4 : item.season.length) / 4),
  )
  const readiness = Math.round(
    100 *
      (0.4 * categoryScore +
        0.2 * seasonScore +
        0.15 * formalityScore +
        0.1 * conditionAvg +
        0.1 * dataCompleteness +
        0.05 * versatilityScore),
  )
  const confidence =
    items.length === 0
      ? 0
      : Math.round(
          100 *
            (0.45 * dataCompleteness +
              0.25 * Math.min(1, items.length / 20) +
              0.15 * (knownCostCount / items.length) +
              0.15 * (knownWearCount / items.length)),
        )

  const gaps: Gap[] = []
  for (const category of CATEGORIES) {
    const missing = Math.max(0, BASELINE[category] - categoryCounts[category])
    if (missing === 0) continue
    gaps.push({
      type: "category",
      key: category,
      missing,
      severity: category === "top" || category === "bottom" || category === "shoes" ? "high" : "medium",
      message: `Add ${missing} ${category} item(s) to reach the ${BASELINE[category]}-item baseline.`,
    })
  }
  for (const season of target.seasons) {
    const missing = Math.max(0, expectedPerSeason - seasonCounts[season])
    if (missing === 0) continue
    gaps.push({
      type: "season",
      key: season,
      missing,
      severity: "medium",
      message: `Add ${missing} item(s) that work in ${season} to reach ${expectedPerSeason} per season.`,
    })
  }
  for (const formality of target.dressCodes) {
    const missing = Math.max(0, expectedPerFormality - formalityCounts[formality])
    if (missing === 0) continue
    gaps.push({
      type: "formality",
      key: formality,
      missing,
      severity: "low",
      message: `Add ${missing} ${formality} item(s) to cover that dress code.`,
    })
  }

  const duplicates = findDuplicates(items)
  const risks: Risk[] = []
  if (items.length === 0) {
    risks.push({ code: "empty", severity: "critical", message: "No wardrobe items are loaded.", impact: 5 })
  }
  if (categoryCounts.top === 0 && categoryCounts.dress === 0) {
    risks.push({ code: "no_top", severity: "critical", message: "No tops or dresses; outfits cannot be built.", impact: 5 })
  }
  if (categoryCounts.bottom === 0 && categoryCounts.dress === 0) {
    risks.push({ code: "no_bottom", severity: "critical", message: "No bottoms or dresses; outfits cannot be built.", impact: 5 })
  }
  if (categoryCounts.shoes === 0) {
    risks.push({ code: "no_shoes", severity: "high", message: "No shoes; every outfit is incomplete.", impact: 5 })
  }
  if (readiness < 60) {
    risks.push({ code: "low_readiness", severity: "high", message: `Readiness is ${readiness}/100.`, impact: 4 })
  }
  if (averageCpw > target.targetCpw) {
    risks.push({
      code: "high_cpw",
      severity: "medium",
      message: `Average cost per wear is ${averageCpw}, above the target ${target.targetCpw}.`,
      impact: 3,
    })
  }
  const worn = items.filter((item) => item.condition === "worn")
  if (worn.length) {
    risks.push({
      code: "worn_items",
      severity: "medium",
      message: `${worn.length} item(s) are worn and should be repaired or retired.`,
      impact: 3,
    })
  }
  if (duplicates.length) {
    risks.push({
      code: "duplicates",
      severity: "low",
      message: `${duplicates.length} duplicate group(s) are taking up capsule space.`,
      impact: 2,
    })
  }
  if (dataCompleteness < 0.7) {
    risks.push({
      code: "thin_data",
      severity: "medium",
      message: "Cost, wear, or recency data is missing for many items.",
      impact: 3,
    })
  }
  if (items.length > target.maxItems) {
    risks.push({
      code: "over_max",
      severity: "medium",
      message: `${items.length} items exceed the ${target.maxItems}-item cap.`,
      impact: 3,
    })
  }
  if (target.budget !== null && totalCost > target.budget) {
    risks.push({
      code: "over_budget",
      severity: "high",
      message: `Tracked cost ${totalCost} exceeds the budget ${target.budget}.`,
      impact: 4,
    })
  }
  if (Object.keys(colorCounts).filter((color) => color !== "unknown").length <= 2 && items.length >= 5) {
    risks.push({
      code: "narrow_palette",
      severity: "low",
      message: "The palette has two or fewer known colors; matching may be easy but range is limited.",
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
      key: "seasons",
      label: "Season coverage",
      pass: target.seasons.every((season) => seasonCounts[season] > 0),
      actual: seasonCounts,
      target: target.seasons,
      message: target.seasons.every((season) => seasonCounts[season] > 0) ? "Every target season has coverage." : "At least one target season has no items.",
    },
    {
      key: "dress_codes",
      label: "Dress-code coverage",
      pass: target.dressCodes.every((formality) => formalityCounts[formality] > 0),
      actual: formalityCounts,
      target: target.dressCodes,
      message: target.dressCodes.every((formality) => formalityCounts[formality] > 0) ? "Every target dress code has coverage." : "At least one dress code has no items.",
    },
    {
      key: "target_cpw",
      label: "Cost per wear",
      pass: averageCpw <= target.targetCpw,
      actual: averageCpw,
      target: target.targetCpw,
      message: averageCpw <= target.targetCpw ? "Average cost per wear is within target." : "Average cost per wear is above target.",
    },
    {
      key: "laundry_buffer",
      label: "Laundry buffer",
      pass: categoryCounts.underwear >= target.laundryDays && categoryCounts.activewear >= Math.ceil(target.laundryDays / 2),
      actual: { underwear: categoryCounts.underwear, activewear: categoryCounts.activewear },
      target: { underwear: target.laundryDays, activewear: Math.ceil(target.laundryDays / 2) },
      message:
        categoryCounts.underwear >= target.laundryDays && categoryCounts.activewear >= Math.ceil(target.laundryDays / 2)
          ? "Laundry buffer is covered."
          : "Laundry buffer is short.",
    },
  ]

  const cpwMean = average(cpwValues)
  const cpwVariance = cpwValues.length ? average(cpwValues.map((value) => (value - cpwMean) ** 2)) : 0
  const categoryValues = CATEGORIES.map((category) => categoryCounts[category])
  const categoryMean = average(categoryValues)
  const categoryVariance = average(categoryValues.map((value) => (value - categoryMean) ** 2))
  const uniqueColors = Object.keys(colorCounts).filter((color) => color !== "unknown").length
  const variance = {
    cpw: {
      count: cpwValues.length,
      mean: round(cpwMean),
      variance: round(cpwVariance),
      stddev: round(Math.sqrt(cpwVariance)),
      min: cpwValues.length ? round(Math.min(...cpwValues)) : 0,
      max: cpwValues.length ? round(Math.max(...cpwValues)) : 0,
    },
    categories: { mean: round(categoryMean), variance: round(categoryVariance) },
    colorDiversity: items.length ? round(uniqueColors / items.length, 3) : 0,
    uniqueColors,
  }

  const benchmarkRows = [
    { metric: "item_count", value: items.length, target: "24-36", pass: items.length >= 24 && items.length <= 36 },
    { metric: "readiness", value: readiness, target: ">=70", pass: readiness >= 70 },
    { metric: "average_cpw", value: averageCpw, target: `<=${target.targetCpw}`, pass: averageCpw <= target.targetCpw },
    { metric: "category_coverage", value: Math.round(categoryScore * 100), target: ">=80", pass: categoryScore >= 0.8 },
    { metric: "season_coverage", value: Math.round(seasonScore * 100), target: ">=75", pass: seasonScore >= 0.75 },
    { metric: "data_completeness", value: Math.round(dataCompleteness * 100), target: ">=80", pass: dataCompleteness >= 0.8 },
  ]
  const benchmarkPassed = benchmarkRows.filter((row) => row.pass).length
  const benchmark = {
    rows: benchmarkRows,
    passed: benchmarkPassed,
    total: benchmarkRows.length,
    verdict: (benchmarkPassed >= 5 ? "strong" : benchmarkPassed >= 3 ? "mixed" : "thin") as "strong" | "mixed" | "thin",
  }

  const options = [
    { name: "lean", maxItems: 20 },
    { name: "balanced", maxItems: 30 },
    { name: "full", maxItems: 40 },
  ].map((option) => {
    const scale = option.maxItems / 30
    const expected = Object.fromEntries(
      CATEGORIES.map((category) => [category, Math.round(BASELINE[category] * scale)]),
    ) as Record<Category, number>
    const fit = Math.round(
      100 *
        average(
          CATEGORIES.map((category) =>
            expected[category] === 0 ? 1 : Math.min(1, categoryCounts[category] / expected[category]),
          ),
        ),
    )
    return { ...option, expected, fit }
  })

  const tradeoffs = [
    {
      title: "Closet size vs outfit range",
      current: `${items.length} items`,
      note:
        items.length < 20
          ? "Small closet. Add versatile layers before adding statement pieces."
          : items.length > 36
            ? "Large closet. Remove low-wear items to sharpen the capsule."
            : "Balanced size. Protect it by replacing, not adding.",
    },
    {
      title: "Cost vs wear",
      current: `${averageCpw} average CPW`,
      note:
        averageCpw > target.targetCpw
          ? "Some pieces are not earning their cost. Wear or retire them."
          : "Cost per wear is inside target.",
    },
    {
      title: "Neutral palette vs expression",
      current: `${uniqueColors} known colors`,
      note:
        uniqueColors < 3
          ? "Low color range. Add one accent that matches three existing pieces."
          : "Color range is broad. Check that pieces still combine.",
    },
    {
      title: "Season coverage vs storage",
      current: target.seasons.map((season) => `${season}:${seasonCounts[season]}`).join(", "),
      note: "More seasons mean more storage. Keep off-season items out of the active count.",
    },
    {
      title: "Laundry buffer vs space",
      current: `${categoryCounts.underwear} underwear, ${categoryCounts.activewear} activewear`,
      note:
        categoryCounts.underwear < target.laundryDays
          ? "Below laundry buffer. Add basics before fashion items."
          : "Laundry buffer is covered.",
    },
  ]

  const checklistItems = [
    ...gaps.slice(0, 10).map((gap) => gap.message),
    ...risks
      .filter((risk) => risk.severity === "critical" || risk.severity === "high")
      .slice(0, 6)
      .map((risk) => risk.message),
    ...(target.budget === null ? ["Set a total budget for the capsule."] : []),
    ...(dataCompleteness < 0.8 ? ["Fill missing cost, wear count, and last-worn dates."] : []),
    ...(categoryCounts.underwear < target.laundryDays ? ["Add enough basics for the laundry cycle."] : []),
  ]
  const checklist = [...new Set(checklistItems)].map((item) => ({ item, done: false }))

  const quickCandidates: Array<Omit<Fix, "score">> = [
    ...gaps
      .filter((gap) => gap.missing <= 2)
      .map((gap) => ({
        action: gap.message,
        impact: gap.severity === "high" ? 5 : 3,
        effort: 1,
        source: "gap",
      })),
    ...loaded.issues
      .filter((issue) => issue.severity === "warning")
      .slice(0, 8)
      .map((issue) => ({ action: issue.message, impact: 2, effort: 1, source: "data" })),
    ...worn.slice(0, 5).map((item) => ({
      action: `Repair or retire ${item.name}.`,
      impact: 4,
      effort: 2,
      source: "condition",
    })),
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
    ...loaded.issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => ({ action: issue.message, impact: 4, effort: 1, source: "data-error" })),
  ]
  const fixes = rankFixes(fixCandidates).slice(0, 12)
  const nextSteps = fixes.slice(0, 5)

  const questions: string[] = []
  if (items.length === 0) questions.push("Do you have a wardrobe list to import?")
  if (target.budget === null) questions.push("What total budget should the capsule stay under?")
  if (dataCompleteness < 0.8) questions.push("Can you fill in cost, wear count, and last-worn dates?")
  if (categoryCounts.underwear < target.laundryDays) {
    questions.push(`Do you have at least ${target.laundryDays} underwear items for a ${target.laundryDays}-day laundry cycle?`)
  }
  if (target.seasons.some((season) => seasonCounts[season] === 0)) {
    questions.push("Which target season is missing from the closet?")
  }
  if (duplicates.length) questions.push("Which duplicate items can be removed?")
  if (items.some((item) => item.lastWorn === null)) questions.push("When was each item last worn?")
  if (questions.length === 0) questions.push("What is the one outfit you want the capsule to cover first?")

  const edgeCases: string[] = []
  if (items.length === 0) edgeCases.push("Empty wardrobe.")
  if (items.length === 1) edgeCases.push("Single item; coverage and outfit counts are not meaningful yet.")
  if (new Set(items.map((item) => item.id)).size !== items.length) edgeCases.push("Duplicate item ids.")
  if (items.some((item) => item.cost === 0)) edgeCases.push("Zero-cost item; cost per wear is zero.")
  if (items.some((item) => item.wearCount === 0)) edgeCases.push("Unworn item; cost per wear equals full cost.")
  if (items.every((item) => item.color === "unknown")) edgeCases.push("No color data.")
  if (items.length > target.maxItems) edgeCases.push("Wardrobe exceeds the item cap.")
  if (items.some((item) => item.lastWorn && Date.parse(`${item.lastWorn}T00:00:00Z`) > Date.now())) {
    edgeCases.push("Future last-worn date.")
  }

  return {
    target,
    itemCount: items.length,
    items,
    categoryCounts,
    seasonCounts,
    formalityCounts,
    colorCounts,
    totalCost,
    knownCostCount,
    totalWears,
    knownWearCount,
    averageCpw,
    cpwItems,
    categoryCoverage,
    seasonCoverage,
    formalityCoverage,
    readiness,
    confidence,
    dataCompleteness,
    components: {
      category: round(categoryScore, 3),
      season: round(seasonScore, 3),
      formality: round(formalityScore, 3),
      condition: round(conditionAvg, 3),
      data: round(dataCompleteness, 3),
      versatility: round(versatilityScore, 3),
    },
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
      averageCpw,
      gaps: gaps.length,
      risks: risks.length,
      duplicates: duplicates.length,
      dataIssues: loaded.issues.length,
    },
  }
}

export function changeSet(before: LoadedWardrobe, after: LoadedWardrobe) {
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
