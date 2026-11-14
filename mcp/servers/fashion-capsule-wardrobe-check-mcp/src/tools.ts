import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  analyze,
  BASELINE,
  CATEGORIES,
  changeSet,
  itemSchema,
  loadWardrobe,
  normalizeTarget,
  targetSchema,
  type LoadedWardrobe,
  type RawItem,
  type TargetInput,
  type TargetProfile,
} from "./wardrobe.js"
import { errorMessage, fail, text } from "./run.js"

const json = (value: unknown) => text(JSON.stringify(value, null, 2))

type SourceArgs = {
  items?: RawItem[]
  content?: string
  path?: string
  cwd?: string
  target?: TargetInput
}

async function runAnalysis(
  args: SourceArgs,
  build: (
    report: ReturnType<typeof analyze>,
    loaded: LoadedWardrobe,
    target: TargetProfile,
  ) => unknown,
) {
  try {
    const loaded = await loadWardrobe(args)
    const target = normalizeTarget(args.target)
    const report = analyze(loaded, target)
    return json(build(report, loaded, target))
  } catch (error) {
    return fail(errorMessage(error))
  }
}

const itemArray = z.array(itemSchema).max(500).optional().describe(
  "Wardrobe items as JSON objects. Use this, content, or path, not more than one.",
)
const contentArg = z.string().max(2_000_000).optional().describe(
  "Wardrobe JSON as text. Must be an array or an object with an items array.",
)
const pathArg = z.string().min(1).max(2_000).optional().describe(
  "Path to a wardrobe JSON file. Must be an array or an object with an items array.",
)
const cwdArg = z.string().min(1).max(2_000).optional().describe("Base directory for path.")
const targetArg = targetSchema.optional().describe(
  "Target capsule profile: seasons, dress codes, item cap, budget, cost-per-wear target and laundry days.",
)

const sourceShape = {
  items: itemArray,
  content: contentArg,
  path: pathArg,
  cwd: cwdArg,
  target: targetArg,
}

const validateSourceShape = {
  items: z.array(z.unknown()).max(500).optional().describe(
    "Arbitrary wardrobe JSON to validate. Unlike the other tools, invalid items are accepted so they can be reported.",
  ),
  content: contentArg,
  path: pathArg,
  cwd: cwdArg,
}

const sourceObjectShape = {
  items: itemArray,
  content: contentArg,
  path: pathArg,
  cwd: cwdArg,
}
const sourceObjectSchema = z.object(sourceObjectShape)

export function registerWardrobeTools(server: McpServer): void {
  server.tool(
    "inventory_capsule_wardrobe",
    "Count the wardrobe by category, season, dress code and color. Returns spend, wears and average cost per wear.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        target: report.target,
        items: report.itemCount,
        categories: report.categoryCounts,
        seasons: report.seasonCounts,
        formality: report.formalityCounts,
        colors: report.colorCounts,
        totalCost: report.totalCost,
        knownCostCount: report.knownCostCount,
        totalWears: report.totalWears,
        knownWearCount: report.knownWearCount,
        averageCpw: report.averageCpw,
      })),
  )

  server.tool(
    "score_capsule_wardrobe_readiness",
    "Score the capsule from 0 to 100 for coverage, season range, dress codes, condition, data quality and versatility.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        readiness: report.readiness,
        confidence: report.confidence,
        components: report.components,
        benchmark: report.benchmark,
      })),
  )

  server.tool(
    "audit_capsule_wardrobe_coverage",
    "Show category, season and dress-code coverage as 0-1 ratios, plus the raw counts behind each ratio.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        category: report.categoryCoverage,
        season: report.seasonCoverage,
        formality: report.formalityCoverage,
        counts: {
          categories: report.categoryCounts,
          seasons: report.seasonCounts,
          formality: report.formalityCounts,
        },
      })),
  )

  server.tool(
    "flag_capsule_wardrobe_gaps",
    "List missing categories, thin seasons and uncovered dress codes with the number of items needed.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.gaps.length,
        gaps: report.gaps,
      })),
  )

  server.tool(
    "rank_capsule_wardrobe_risks",
    "Rank capsule risks: missing essentials, low readiness, high cost per wear, worn items, duplicates and data gaps.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.risks.length,
        risks: report.risks,
      })),
  )

  server.tool(
    "check_capsule_wardrobe_constraints",
    "Check the wardrobe against the target item cap, budget, seasons, dress codes, cost-per-wear target and laundry buffer.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        pass: report.constraints.every((constraint) => constraint.pass),
        constraints: report.constraints,
      })),
  )

  server.tool(
    "compare_capsule_wardrobe_baseline",
    "Compare category counts with the 30-item baseline and show the surplus or shortfall for each category.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        current: report.categoryCounts,
        baseline: BASELINE,
        deltas: Object.fromEntries(
          CATEGORIES.map((category) => [category, report.categoryCounts[category] - BASELINE[category]]),
        ),
        readiness: report.readiness,
      })),
  )

  server.tool(
    "estimate_capsule_wardrobe_cost_per_wear",
    "Calculate cost per wear for every item, plus total tracked cost, total wears and the average.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        totalCost: report.totalCost,
        totalWears: report.totalWears,
        knownCostCount: report.knownCostCount,
        knownWearCount: report.knownWearCount,
        averageCpw: report.averageCpw,
        targetCpw: report.target.targetCpw,
        items: report.cpwItems,
      })),
  )

  server.tool(
    "find_capsule_wardrobe_quick_wins",
    "Find low-effort, high-impact fixes: small gaps, missing data, worn pieces and duplicates.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.quickWins.length,
        quickWins: report.quickWins,
      })),
  )

  server.tool(
    "map_capsule_wardrobe_dependencies",
    "Map outfit prerequisites: tops, bottoms or dresses, shoes, cold-weather layers and optional accessories.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => {
        const tops = report.categoryCounts.top + report.categoryCounts.dress
        const bottoms = report.categoryCounts.bottom + report.categoryCounts.dress
        const capacity = Math.min(tops, bottoms, report.categoryCounts.shoes)
        const checks = [
          {
            need: "top or dress",
            present: report.categoryCounts.top > 0 || report.categoryCounts.dress > 0,
            optional: false,
            count: report.categoryCounts.top + report.categoryCounts.dress,
          },
          {
            need: "bottom or dress",
            present: report.categoryCounts.bottom > 0 || report.categoryCounts.dress > 0,
            optional: false,
            count: report.categoryCounts.bottom + report.categoryCounts.dress,
          },
          {
            need: "shoes",
            present: report.categoryCounts.shoes > 0,
            optional: false,
            count: report.categoryCounts.shoes,
          },
          {
            need: "cold-weather layer",
            present: report.categoryCounts.outerwear > 0 || !report.target.seasons.includes("winter"),
            optional: false,
            count: report.categoryCounts.outerwear,
          },
          {
            need: "accessory",
            present: report.categoryCounts.accessory > 0,
            optional: true,
            count: report.categoryCounts.accessory,
          },
        ]
        return {
          outfitCapacity: capacity,
          dependencies: checks,
          missing: checks.filter((check) => !check.present && !check.optional).map((check) => check.need),
        }
      }),
  )

  server.tool(
    "test_capsule_wardrobe_edge_cases",
    "Test edge cases: empty wardrobe, one item, duplicate ids, zero cost, unworn items, missing colors and future dates.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report, loaded) => ({
        valid: loaded.issues.every((issue) => issue.severity !== "error"),
        edgeCases: report.edgeCases,
        dataIssues: loaded.issues,
      })),
  )

  server.tool(
    "summarize_capsule_wardrobe_findings",
    "Summarize the audit: headline counts, top gaps, top risks and data issues.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        summary: report.summary,
        topGaps: report.gaps.slice(0, 5),
        topRisks: report.risks.slice(0, 5),
        dataIssues: report.dataIssues,
      })),
  )

  server.tool(
    "prioritize_capsule_wardrobe_fixes",
    "Rank fixes by impact divided by effort. Returns a shortlist and the next five actions.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        fixes: report.fixes,
        nextSteps: report.nextSteps,
      })),
  )

  server.tool(
    "validate_capsule_wardrobe_inputs",
    "Validate arbitrary wardrobe JSON, report schema errors and warnings, and count valid items.",
    validateSourceShape,
    async (args) => {
      try {
        const loaded = await loadWardrobe(args)
        const report = analyze(loaded)
        return json({
          valid: loaded.issues.every((issue) => issue.severity !== "error"),
          rawCount: loaded.rawCount,
          loadedCount: report.itemCount,
          issues: loaded.issues,
          duplicates: report.duplicates,
        })
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "detect_capsule_wardrobe_duplicates",
    "Group items that share the same category, normalized name and color. Shows ids and the number of extra copies.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.duplicates.length,
        wastedItems: report.duplicates.reduce((total, group) => total + group.count - 1, 0),
        duplicates: report.duplicates,
      })),
  )

  server.tool(
    "measure_capsule_wardrobe_variance",
    "Measure cost-per-wear spread, category-count variance and color diversity.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        variance: report.variance,
        averageCpw: report.averageCpw,
        readiness: report.readiness,
      })),
  )

  server.tool(
    "benchmark_capsule_wardrobe_options",
    "Benchmark against lean, balanced and full capsule sizes, plus item count, readiness, cost and coverage targets.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        target: report.target,
        benchmark: report.benchmark,
        options: report.options,
      })),
  )

  server.tool(
    "explain_capsule_wardrobe_tradeoffs",
    "Explain the real tradeoffs in the closet: size vs range, cost vs wear, palette vs expression, seasons and laundry buffer.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        tradeoffs: report.tradeoffs,
      })),
  )

  server.tool(
    "draft_capsule_wardrobe_checklist",
    "Draft a practical checklist from gaps, high risks, missing data, budget and laundry needs.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.checklist.length,
        checklist: report.checklist,
      })),
  )

  server.tool(
    "export_capsule_wardrobe_audit",
    "Export the full audit: target, metrics, coverage, gaps, risks, constraints, duplicates, benchmark, checklist and next steps.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report, loaded) => ({
        ...report,
        source: loaded.source,
        rawCount: loaded.rawCount,
      })),
  )

  server.tool(
    "track_capsule_wardrobe_changes",
    "Compare two wardrobe snapshots by item id and return added, removed and changed items.",
    {
      before: sourceObjectSchema.describe("The earlier wardrobe snapshot."),
      after: sourceObjectSchema.describe("The newer wardrobe snapshot."),
    },
    async (args) => {
      try {
        const before = await loadWardrobe(args.before)
        const after = await loadWardrobe(args.after)
        return json(changeSet(before, after))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "review_capsule_wardrobe_history",
    "Review dated wardrobe snapshots and return readiness, cost, gaps and risk trends from first to last.",
    {
      history: z
        .array(
          z.object({
            date: z.string().min(1).max(40),
            items: z.array(itemSchema).max(500),
          }),
        )
        .min(1)
        .max(60),
      target: targetArg,
    },
    async (args) => {
      try {
        const target = normalizeTarget(args.target)
        const ordered = [...args.history].sort((left, right) => left.date.localeCompare(right.date))
        const points = []
        for (const snapshot of ordered) {
          const loaded = await loadWardrobe({ items: snapshot.items })
          const report = analyze(loaded, target)
          points.push({
            date: snapshot.date,
            items: report.itemCount,
            readiness: report.readiness,
            confidence: report.confidence,
            totalCost: report.totalCost,
            averageCpw: report.averageCpw,
            gaps: report.gaps.length,
            risks: report.risks.length,
          })
        }
        const first = points[0]
        const last = points[points.length - 1]
        return json({
          points,
          delta:
            points.length > 1
              ? {
                  items: last.items - first.items,
                  readiness: last.readiness - first.readiness,
                  confidence: last.confidence - first.confidence,
                  totalCost: Number((last.totalCost - first.totalCost).toFixed(2)),
                  averageCpw: Number((last.averageCpw - first.averageCpw).toFixed(2)),
                  gaps: last.gaps - first.gaps,
                  risks: last.risks - first.risks,
                }
              : null,
        })
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "score_capsule_wardrobe_confidence",
    "Score how much the audit can be trusted from data completeness, item count, cost coverage and wear coverage.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        confidence: report.confidence,
        dataCompleteness: report.dataCompleteness,
        itemCount: report.itemCount,
        knownCostCount: report.knownCostCount,
        knownWearCount: report.knownWearCount,
        components: report.components,
      })),
  )

  server.tool(
    "recommend_capsule_wardrobe_next_steps",
    "Recommend the next five actions from the ranked fix list, with quick wins alongside.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        nextSteps: report.nextSteps,
        quickWins: report.quickWins.slice(0, 3),
      })),
  )

  server.tool(
    "open_capsule_wardrobe_questions",
    "List open questions that block a better audit: budget, data, laundry, season coverage, duplicates and recency.",
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        questions: report.questions,
        openEdgeCases: report.edgeCases,
      })),
  )
}
