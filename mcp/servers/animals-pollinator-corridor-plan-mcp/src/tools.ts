import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  analyze,
  changeSet,
  itemSchema,
  loadCollection,
  normalizeTarget,
  targetSchema,
  type LoadedCollection,
  type RawItem,
  type TargetInput,
  type TargetProfile,
} from "./engine.js"
import { config } from "./config.js"
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
    loaded: LoadedCollection,
    target: TargetProfile,
  ) => unknown,
) {
  try {
    const loaded = await loadCollection(args)
    const target = normalizeTarget(args.target)
    const report = analyze(loaded, target)
    return json(build(report, loaded, target))
  } catch (error) {
    return fail(errorMessage(error))
  }
}

const itemArray = z.array(itemSchema).max(500).optional().describe(
  `Items to audit as JSON objects. Use this, content, or path, not more than one.`,
)
const contentArg = z.string().max(2_000_000).optional().describe(
  "Collection JSON as text. Must be an array or an object with an items array.",
)
const pathArg = z.string().min(1).max(2_000).optional().describe(
  "Path to a collection JSON file. Must be an array or an object with an items array.",
)
const cwdArg = z.string().min(1).max(2_000).optional().describe("Base directory for path.")
const targetArg = targetSchema.optional().describe("Target overrides for item cap, budget, coverage and expiry window.")

const sourceShape = {
  items: itemArray,
  content: contentArg,
  path: pathArg,
  cwd: cwdArg,
  target: targetArg,
}

const validateSourceShape = {
  items: z.array(z.unknown()).max(500).optional().describe(
    "Arbitrary collection JSON to validate. Invalid items are accepted so they can be reported.",
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

const prefix = config.prefix
const tool = {
  inventory: `inventory_${prefix}`,
  score: `score_${prefix}_readiness`,
  coverage: `audit_${prefix}_coverage`,
  gaps: `flag_${prefix}_gaps`,
  risks: `rank_${prefix}_risks`,
  constraints: `check_${prefix}_constraints`,
  baseline: `compare_${prefix}_baseline`,
  metric: `estimate_${prefix}_${config.metric.id}`,
  quickWins: `find_${prefix}_quick_wins`,
  dependencies: `map_${prefix}_dependencies`,
  edgeCases: `test_${prefix}_edge_cases`,
  findings: `summarize_${prefix}_findings`,
  priorities: `prioritize_${prefix}_fixes`,
  validate: `validate_${prefix}_inputs`,
  duplicates: `detect_${prefix}_duplicates`,
  variance: `measure_${prefix}_variance`,
  benchmark: `benchmark_${prefix}_options`,
  tradeoffs: `explain_${prefix}_tradeoffs`,
  checklist: `draft_${prefix}_checklist`,
  export: `export_${prefix}_audit`,
  changes: `track_${prefix}_changes`,
  history: `review_${prefix}_history`,
  confidence: `score_${prefix}_confidence`,
  next: `recommend_${prefix}_next_steps`,
  questions: `open_${prefix}_questions`,
}

export function registerTools(server: McpServer): void {
  server.tool(
    tool.inventory,
    `Count the ${config.entity} collection by category. Returns spend, quantity, freshness and ${config.metric.label.toLowerCase()}.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        target: report.target,
        items: report.itemCount,
        categories: report.categoryCounts,
        unknownCategories: report.unknownCategories,
        totalCost: report.totalCost,
        knownCostCount: report.knownCostCount,
        totalQuantity: report.totalQuantity,
        knownQuantityCount: report.knownQuantityCount,
        expired: report.expired.length,
        expiring: report.expiring.length,
        metric: { id: config.metric.id, mean: report.metricMean, known: report.metricKnownCount },
      })),
  )

  server.tool(
    tool.score,
    `Score ${config.entity} readiness from 0 to 100 for coverage, condition, data quality, freshness and ${config.metric.label.toLowerCase()}.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        readiness: report.readiness,
        confidence: report.confidence,
        components: {
          coverage: Number(report.coverageScore.toFixed(3)),
          condition: Number(report.conditionScore.toFixed(3)),
          data: Number(report.dataCompleteness.toFixed(3)),
          metricPassRatio:
            report.metricKnownCount === 0 ? 0 : Number((report.metricPassCount / report.metricKnownCount).toFixed(3)),
        },
        benchmark: report.benchmark,
      })),
  )

  server.tool(
    tool.coverage,
    `Show category coverage for the ${config.entity} collection as 0-1 ratios, plus unknown categories.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        category: report.categoryCoverage,
        unknownCategories: report.unknownCategories,
        counts: report.categoryCounts,
      })),
  )

  server.tool(
    tool.gaps,
    `List missing categories, expired items, expiring items and dependency gaps for the ${config.entity} collection.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.gaps.length,
        gaps: report.gaps,
      })),
  )

  server.tool(
    tool.risks,
    `Rank risks: low coverage, expired stock, budget overruns, duplicates, worn items and missing data.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.risks.length,
        risks: report.risks,
      })),
  )

  server.tool(
    tool.constraints,
    `Check the ${config.entity} collection against item cap, budget, coverage, expiry and metric targets.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        pass: report.constraints.every((constraint) => constraint.pass),
        constraints: report.constraints,
      })),
  )

  server.tool(
    tool.baseline,
    `Compare category counts with the configured baseline and show surplus or shortfall.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        current: report.categoryCounts,
        baseline: Object.fromEntries(config.categories.map((category) => [category.id, category.baseline])),
        deltas: Object.fromEntries(
          config.categories.map((category) => [
            category.id,
            (report.categoryCounts[category.id] ?? 0) - category.baseline,
          ]),
        ),
        readiness: report.readiness,
      })),
  )

  server.tool(
    tool.metric,
    `Calculate ${config.metric.label.toLowerCase()} for every ${config.entity}, with mean and target pass count.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        metric: config.metric,
        mean: report.metricMean,
        known: report.metricKnownCount,
        passing: report.metricPassCount,
        target: report.target,
        rows: report.metricRows,
      })),
  )

  server.tool(
    tool.quickWins,
    `Find low-effort fixes: small category gaps, missing data, expired items and duplicates.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.quickWins.length,
        quickWins: report.quickWins,
      })),
  )

  server.tool(
    tool.dependencies,
    `Map collection dependencies: which configured groups are present, how many items cover them and what is missing.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => {
        const dependencies = config.dependencies.map((dependency) => {
          const counts = Object.fromEntries(
            dependency.categories.map((category) => [category, report.categoryCounts[category] ?? 0]),
          )
          const present = Object.values(counts).some((count) => count > 0)
          return { id: dependency.id, label: dependency.label, categories: dependency.categories, counts, present }
        })
        return {
          dependencies,
          missing: dependencies.filter((dependency) => !dependency.present).map((dependency) => dependency.id),
        }
      }),
  )

  server.tool(
    tool.edgeCases,
    `Test edge cases: empty collection, one item, duplicate ids, zero cost, expired items, missing dates and unknown categories.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report, loaded) => ({
        valid: loaded.issues.every((issue) => issue.severity !== "error"),
        edgeCases: report.edgeCases,
        dataIssues: loaded.issues,
      })),
  )

  server.tool(
    tool.findings,
    `Summarize the ${config.entity} audit: counts, top gaps, top risks and data issues.`,
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
    tool.priorities,
    `Rank fixes by impact divided by effort. Returns a shortlist and the next five actions.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        fixes: report.fixes,
        nextSteps: report.nextSteps,
      })),
  )

  server.tool(
    tool.validate,
    `Validate arbitrary ${config.entity} JSON, report schema errors and warnings, and count valid items.`,
    validateSourceShape,
    async (args) => {
      try {
        const loaded = await loadCollection(args)
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
    tool.duplicates,
    `Group ${config.entity} items with the same category and normalized name. Shows ids and extra copies.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.duplicates.length,
        wastedItems: report.duplicates.reduce((total, group) => total + group.count - 1, 0),
        duplicates: report.duplicates,
      })),
  )

  server.tool(
    tool.variance,
    `Measure ${config.metric.label.toLowerCase()} spread, category-count variance and tag diversity.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        variance: report.variance,
        metricMean: report.metricMean,
        readiness: report.readiness,
      })),
  )

  server.tool(
    tool.benchmark,
    `Benchmark lean, balanced and full collection sizes, plus readiness, coverage, metric and data targets.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        target: report.target,
        benchmark: report.benchmark,
        options: report.options,
      })),
  )

  server.tool(
    tool.tradeoffs,
    `Explain the real tradeoffs: size vs coverage, cost vs use, freshness vs stock and data quality vs speed.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        tradeoffs: report.tradeoffs,
      })),
  )

  server.tool(
    tool.checklist,
    `Draft a practical checklist from gaps, high risks, missing data and budget.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        count: report.checklist.length,
        checklist: report.checklist,
      })),
  )

  server.tool(
    tool.export,
    `Export the full ${config.entity} audit: target, metrics, gaps, risks, constraints, duplicates, benchmark and next steps.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report, loaded) => ({
        ...report,
        source: loaded.source,
        rawCount: loaded.rawCount,
      })),
  )

  server.tool(
    tool.changes,
    `Compare two ${config.entity} snapshots by item id and return added, removed and changed items.`,
    {
      before: sourceObjectSchema.describe("The earlier collection snapshot."),
      after: sourceObjectSchema.describe("The newer collection snapshot."),
    },
    async (args) => {
      try {
        const before = await loadCollection(args.before)
        const after = await loadCollection(args.after)
        return json(changeSet(before, after))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    tool.history,
    `Review dated ${config.entity} snapshots and return readiness, cost and metric trends from first to last.`,
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
          const loaded = await loadCollection({ items: snapshot.items })
          const report = analyze(loaded, target)
          points.push({
            date: snapshot.date,
            items: report.itemCount,
            readiness: report.readiness,
            confidence: report.confidence,
            totalCost: report.totalCost,
            metricMean: report.metricMean,
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
                  metricMean: Number((last.metricMean - first.metricMean).toFixed(2)),
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
    tool.confidence,
    `Score how much the audit can be trusted from data completeness, item count, cost coverage and quantity coverage.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        confidence: report.confidence,
        dataCompleteness: report.dataCompleteness,
        itemCount: report.itemCount,
        knownCostCount: report.knownCostCount,
        knownQuantityCount: report.knownQuantityCount,
        coverageScore: report.coverageScore,
        conditionScore: report.conditionScore,
      })),
  )

  server.tool(
    tool.next,
    `Recommend the next five actions from the ranked fix list, with quick wins alongside.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        nextSteps: report.nextSteps,
        quickWins: report.quickWins.slice(0, 3),
      })),
  )

  server.tool(
    tool.questions,
    `List open questions that block a better audit: budget, data, expiry, duplicates and unknown categories.`,
    sourceShape,
    async (args) =>
      runAnalysis(args, (report) => ({
        questions: report.questions,
        openEdgeCases: report.edgeCases,
      })),
  )
}
