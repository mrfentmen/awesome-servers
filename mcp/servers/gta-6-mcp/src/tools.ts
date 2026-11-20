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
  character: `lookup_${prefix}_character`,
  location: `lookup_${prefix}_location`,
  vehicle: `lookup_${prefix}_vehicle`,
  weapon: `lookup_${prefix}_weapon`,
  nextPlay: `suggest_${prefix}_next_play`,
  mission: `lookup_${prefix}_mission`,
  activity: `lookup_${prefix}_activity`,
  collectible: `lookup_${prefix}_collectible`,
  tip: `lookup_${prefix}_tip`,
  completion: `track_${prefix}_completion`,
  vehicleCompare: `compare_${prefix}_vehicles`,
  heistPrep: `plan_${prefix}_heist_prep`,
  challenge: `pick_${prefix}_challenge`,
}

const guideBlurbs: Record<string, string> = {
  "gta6-lucia": "Lucia Caminos, co-protagonist shown in the GTA VI trailers, fresh out of prison and pulling scores across Leonida with Jason.",
  "gta6-jason": "Jason Duval, co-protagonist shown in the GTA VI trailers, drifting between odd jobs and bigger scores across Leonida.",
  "gta6-vice-beach": "Vice Beach, the neon shoreline at the heart of Vice City. Street races, robberies, and fast jetski getaways.",
  "gta6-grassrivers": "Grassrivers, the swampy wetlands outside the city. Fishing, airboat runs, and hidden smuggler stashes.",
  "gta6-prologue": "Opening stretch: learn driving, shooting, and the wanted system before the first real score unlocks.",
  "gta6-first-score": "First big score with Lucia and Jason. Bring full armor, a fast getaway car, and an escape route through the Grassrivers.",
  "gta6-sports-car": "Fast coupe for getaways. Upgrade acceleration first, then bulletproof tires.",
  "gta6-boat": "Smuggler boat for water escapes and stash runs. Wanted heat clears faster on open water.",
  "gta6-rifle": "Workhorse rifle, best all-round gun. Grab it from Ammu-Nation as soon as cash allows.",
  "gta6-pistol": "Reliable sidearm for early missions. Free in most loadouts, upgrade later.",
  "gta6-street-race": "Street race series across Vice City. Win all six to unlock the midnight finale.",
  "gta6-fishing": "Grassrivers fishing for quick cash between missions. Dawn gives the best catch rate.",
  "gta6-signs": "Hidden signs scattered across Leonida. Collect them all for a completion bonus.",
  "gta6-stashes": "Smuggler stashes with cash and armor. Listen for the audio cue when close.",
  "gta6-wanted-tip": "Break line of sight, swap cars, then hide until the wanted stars flash and clear.",
  "gta6-money-tip": "Replay street races and stash runs early. Save story payouts for post-game investments.",
  "gta6-switch": "Switch between Lucia and Jason outside missions to cover more of Leonida. Each protagonist has their own contacts and side jobs.",
  "gta6-crew": "Track getaway drivers, hackers, and gunmen for bigger scores. Better crews cost more but keep more of the take.",
  "gta6-ocean-strip": "Neon strip along Vice Beach. Bars, night street races, and easy marks for quick cash.",
  "gta6-port-vc": "Docks full of cargo and smuggling work. Night shifts mean fewer witnesses.",
  "gta6-airport": "Fast travel and smuggling runs. Small planes beat traffic across the whole map.",
  "gta6-keys": "Island chain south of Vice City. Boats, diving spots, and quiet stash hideouts.",
  "gta6-downtown": "Banks and jewelry stores for big scores. Also the most cops per block.",
  "gta6-bayou": "Swamp backroads with zero witnesses. Best place to cool a hot car.",
  "gta6-getaway": "Plan the exit before the entry. Mark two routes: fast car on roads, boat near water.",
  "gta6-stealth": "Suppressed pistol, night entry, cameras first. If spotted, run before the second star.",
  "gta6-heist-prep": "Checklist: getaway vehicle, armor, ammo, masks, escape route scouted. See plan_gta6_guide_heist_prep.",
  "gta6-finale": "Final stretch: max armor, best guns, fastest getaway. Nothing carries over except your legend.",
  "gta6-side-chain": "Chains of small jobs that unlock safehouses and discounts. Do them between story beats.",
  "gta6-rank-replay": "Replay finished missions for gold rank: faster time, higher accuracy, fewer deaths.",
  "gta6-bike": "Fastest through traffic, worst in a crash. Helmet on, getaway planned.",
  "gta6-heli": "Skip every roadblock. Learn landing spots before you need one under fire.",
  "gta6-suv": "Crew transport that eats bullets. Slow, but it always arrives.",
  "gta6-jetski": "Beach escape pod. Cops lose you fast once you hit open water.",
  "gta6-plane": "Cross Leonida in minutes. Needed for cargo runs and island hops.",
  "gta6-truck": "Ram anything, outrun nothing. Park it as the getaway anchor.",
  "gta6-shotgun": "Clears rooms fast. Useless past twenty meters.",
  "gta6-smg": "Best drive-by gun. Spray from the passenger seat, then vanish.",
  "gta6-sniper": "One shot from far away. Scout finale vantage points early.",
  "gta6-armor": "Five vests minimum before any score. Armor is cheaper than hospital bills.",
  "gta6-explosives": "Sticky bombs for vault doors and tailing cars. Buy four, use two.",
  "gta6-melee": "Silent takedowns save ammo. Never bring a bat to a shootout.",
  "gta6-flight-school": "Five lessons that pay for themselves: takeoffs, landings, and low flying under bridges.",
  "gta6-hunting": "Bayou hunts pay cash per pelt. Bring the sniper, leave no witnesses but gators.",
  "gta6-diving": "Wrecks hide cash and weapons. Watch your air meter, not the sharks.",
  "gta6-taxi": "Eight fares across the city. Learn every shortcut while getting paid.",
  "gta6-bar-games": "Darts and pool for small cash and new contacts. Winners hear rumors.",
  "gta6-photography": "Ten landmarks pay per photo. A calm way to learn the map.",
  "gta6-jumps": "Fifteen ramps across Leonida. Hit them all for the stunt bonus.",
  "gta6-packages": "Twenty-five packages in alleys and rooftops. Each one is free money.",
  "gta6-photos": "Thirty landmarks to photograph. Finish the set for a completion bonus.",
  "gta6-trials": "Ten solo time trials. Beat par to unlock the midnight race.",
  "gta6-armor-tip": "Buy armor before every score, not during. Five vests is the minimum.",
  "gta6-save-tip": "Save before every score and after every big purchase. No take-backs otherwise.",
  "gta6-drive-tip": "Brake before the turn, not in it. A clean getaway beats a fast crash.",
  "gta6-health-tip": "Snacks heal mid-fight. Stock up at every corner store.",
  "gta6-cops-tip": "One star: outrun. Two stars: swap cars. Three plus: water or tunnels.",
  "gta6-prep-tip": "Drive the escape route before the score. You will thank yourself at three stars.",
}

function guideLookup(category: string, id?: string) {
  const items = config.sample.filter((item) => item.category === category)
  if (id) {
    const wanted = id.toLowerCase()
    const found = items.find((item) => item.id === id || item.name.toLowerCase() === wanted)
    if (!found) return { error: `No ${category} entry with id or name ${JSON.stringify(id)}.` }
    return { ...found, guide: guideBlurbs[found.id ?? ""] ?? "" }
  }
  return items.map((item) => ({ ...item, guide: guideBlurbs[item.id ?? ""] ?? "" }))
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

  server.tool(
    tool.character,
    `Look up GTA 6 characters from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Character id or name. Empty lists every character."),
    },
    async (args) => json(guideLookup("characters", args.id)),
  )

  server.tool(
    tool.location,
    `Look up GTA 6 locations from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Location id or name. Empty lists every location."),
    },
    async (args) => json(guideLookup("locations", args.id)),
  )

  server.tool(
    tool.vehicle,
    `Look up GTA 6 vehicles from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Vehicle id or name. Empty lists every vehicle."),
    },
    async (args) => json(guideLookup("vehicles", args.id)),
  )

  server.tool(
    tool.weapon,
    `Look up GTA 6 weapons from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Weapon id or name. Empty lists every weapon."),
    },
    async (args) => json(guideLookup("weapons", args.id)),
  )

  server.tool(
    tool.nextPlay,
    `Suggest what to play next: weakest guide category against its baseline plus money and wanted-level tips.`,
    {},
    async () => {
      const counts: Record<string, number> = {}
      for (const item of config.sample) counts[item.category] = (counts[item.category] ?? 0) + 1
      let weakest = config.categories[0].id
      let weakestRatio = Infinity
      for (const category of config.categories) {
        const ratio = (counts[category.id] ?? 0) / Math.max(1, category.baseline)
        if (ratio < weakestRatio) {
          weakestRatio = ratio
          weakest = category.id
        }
      }
      const tips = config.sample
        .filter((item) => item.category === "tips")
        .map((item) => ({ name: item.name, guide: guideBlurbs[item.id ?? ""] ?? "" }))
      return json({
        weakestCategory: weakest,
        coverageRatio: Number(weakestRatio.toFixed(3)),
        suggestion: `Focus your next session on ${weakest}: add entries until it meets its baseline.`,
        tips,
      })
    },
  )

  server.tool(
    tool.mission,
    `Look up GTA 6 mission playbooks from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Mission id or name. Empty lists every mission."),
    },
    async (args) => json(guideLookup("missions", args.id)),
  )

  server.tool(
    tool.activity,
    `Look up GTA 6 side activities from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Activity id or name. Empty lists every activity."),
    },
    async (args) => json(guideLookup("activities", args.id)),
  )

  server.tool(
    tool.collectible,
    `Look up GTA 6 collectibles from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Collectible id or name. Empty lists every collectible."),
    },
    async (args) => json(guideLookup("collectibles", args.id)),
  )

  server.tool(
    tool.tip,
    `Look up GTA 6 tips from the bundled guide. Pass an id or name, or leave empty to list all.`,
    {
      id: z.string().min(1).max(200).optional().describe("Tip id or name. Empty lists every tip."),
    },
    async (args) => json(guideLookup("tips", args.id)),
  )

  server.tool(
    tool.completion,
    `Track GTA 6 guide completion: per-category counts against baselines, overall percent, and weakest category.`,
    {},
    async () => {
      const counts: Record<string, number> = {}
      for (const item of config.sample) counts[item.category ?? ""] = (counts[item.category ?? ""] ?? 0) + 1
      const rows = config.categories.map((category) => {
        const count = counts[category.id] ?? 0
        const percent = Math.min(1, count / Math.max(1, category.baseline))
        return {
          category: category.id,
          label: category.label,
          count,
          baseline: category.baseline,
          percent: Number(percent.toFixed(3)),
        }
      })
      const overall = rows.reduce((sum, row) => sum + row.percent, 0) / rows.length
      const weakest = rows.reduce((a, b) => (a.percent <= b.percent ? a : b))
      return json({
        overallPercent: Number(overall.toFixed(3)),
        weakestCategory: weakest.category,
        rows,
      })
    },
  )

  server.tool(
    tool.vehicleCompare,
    `Compare GTA 6 vehicles by price, stock, and condition. Pass ids or names, or leave empty to compare all.`,
    {
      ids: z
        .array(z.string().min(1).max(200))
        .max(50)
        .optional()
        .describe("Vehicle ids or names. Empty compares every vehicle."),
    },
    async (args) => {
      let vehicles = config.sample.filter((item) => item.category === "vehicles")
      if (args.ids?.length) {
        const wanted = new Set(args.ids.map((v) => v.toLowerCase()))
        vehicles = vehicles.filter(
          (v) => wanted.has((v.id ?? "").toLowerCase()) || wanted.has(v.name.toLowerCase()),
        )
      }
      const rows = vehicles
        .map((v) => ({
          id: v.id,
          name: v.name,
          cost: v.cost ?? 0,
          quantity: v.quantity ?? 0,
          condition: v.condition ?? "unknown",
          guide: guideBlurbs[v.id ?? ""] ?? "",
        }))
        .sort((a, b) => b.cost - a.cost)
      return json({ count: rows.length, rows })
    },
  )

  server.tool(
    tool.heistPrep,
    `Build a heist prep checklist: getaway, loadout, escape route, and scout steps for a named score.`,
    {
      score: z.string().min(1).max(200).optional().describe("Score name. Empty gives the general checklist."),
    },
    async (args) => {
      const steps = [
        "Scout the target and drive two escape routes.",
        "Buy body armor: five vests minimum.",
        "Stock rifle ammo and two sticky bombs.",
        "Stage a fast getaway car near the exit.",
        "Park a boat backup near water.",
        "Wear masks, ditch the car, clear wanted heat.",
      ]
      const loadoutIds = ["gta6-armor", "gta6-rifle", "gta6-explosives", "gta6-sports-car", "gta6-boat"]
      const loadout = config.sample
        .filter((item) => loadoutIds.includes(item.id ?? ""))
        .map((item) => ({ id: item.id, name: item.name, cost: item.cost ?? 0, guide: guideBlurbs[item.id ?? ""] ?? "" }))
      return json({ score: args.score ?? "general score", steps, loadout })
    },
  )

  server.tool(
    tool.challenge,
    `Pick a deterministic daily challenge from side activities and collectibles. Same seed always picks the same challenge.`,
    {
      seed: z.string().min(1).max(200).optional().describe("Seed text. Empty uses today's date, so the pick changes daily."),
    },
    async (args) => {
      const pool = config.sample.filter((item) => item.category === "activities" || item.category === "collectibles")
      const key = args.seed ?? new Date().toISOString().slice(0, 10)
      let hash = 0
      for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
      const pick = pool[hash % pool.length]
      return json({
        seed: key,
        challenge: { ...pick, guide: guideBlurbs[pick.id ?? ""] ?? "" },
        poolSize: pool.length,
      })
    },
  )
}
