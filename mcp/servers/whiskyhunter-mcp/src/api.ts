const ALL = "https://whiskyhunter.net/api/auctions_data/"
const UA = "mrfentmen-whiskyhunter-mcp/1.0 (https://github.com/mrfentmen)"

export class WhiskyhunterError extends Error {}

export interface AuctionRecord {
  dt?: string
  winning_bid_mean?: number
  auction_trading_volume?: number
  auction_lots_count?: number
  all_auctions_lots_count?: number
  auction_name?: string
  auction_slug?: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 404) throw new WhiskyhunterError(`Not found (404): ${url}`)
  if (!res.ok) throw new WhiskyhunterError(`WhiskyHunter returned ${res.status}`)
  const d = (await res.json()) as T
  if (!Array.isArray(d)) throw new WhiskyhunterError("Unexpected response shape from WhiskyHunter")
  return d
}

let cache: { at: number; records: AuctionRecord[] } | null = null

/** WhisyHunter's full dataset is ~2,000 monthly records; cache it for the session. */
async function allRecords(): Promise<AuctionRecord[]> {
  if (cache && Date.now() - cache.at < 300000) return cache.records
  const records = await getJson<AuctionRecord[]>(ALL)
  cache = { at: Date.now(), records }
  return records
}

const money = (v: unknown): string => {
  const n = Number(v)
  return Number.isFinite(n) ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"
}

const num = (v: unknown): string => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString() : "—"
}

const bySlug = (a: AuctionRecord, slug?: string) =>
  !slug || (a.auction_slug ?? "").toLowerCase() === slug.trim().toLowerCase()

function recordLine(r: AuctionRecord, i?: number, showDate = true): string {
  const pre = i === undefined ? "" : `${i + 1}. `
  const head = showDate ? `${r.dt ?? "?"} — ${r.auction_name ?? r.auction_slug ?? "?"}` : (r.auction_name ?? r.auction_slug ?? "?")
  return `${pre}${head}\n   mean winning bid ${money(r.winning_bid_mean)} | trading volume ${money(r.auction_trading_volume)} | ${num(r.auction_lots_count)} lot(s)`
}

export async function auctions(args: { auction?: string; limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 40)
  const slug = (args.auction ?? "").trim()
  const all = await allRecords()
  const list = all.filter((a) => bySlug(a, slug || undefined))
  if (!list.length) {
    const slugs = [...new Set(all.map((a) => a.auction_slug))].filter(Boolean).slice(0, 12)
    return slug
      ? `No auction data for "${slug}". Known slugs include: ${slugs.join(", ")}`
      : "No auction data returned."
  }
  const recent = [...list].sort((a, b) => String(b.dt ?? "").localeCompare(String(a.dt ?? "")))
  return (
    `Whisky auction results${slug ? ` for ${slug}` : ""} — latest ${Math.min(limit, recent.length)} of ${recent.length} monthly record(s):\n\n` +
    recent.slice(0, limit).map((r, i) => recordLine(r, i)).join("\n\n")
  )
}

export async function auctionByDate(args: { date: string }): Promise<string> {
  const date = (args.date ?? "").trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Provide a date as YYYY-MM-DD, e.g. '2024-09-01'."
  const list = (await allRecords()).filter((a) => a.dt === date)
  if (!list.length) return `No auction results recorded on ${date}.`
  const ranked = [...list].sort((a, b) => (b.auction_trading_volume ?? 0) - (a.auction_trading_volume ?? 0))
  const totalVolume = ranked.reduce((s, a) => s + (Number(a.auction_trading_volume) || 0), 0)
  return (
    `Whisky auctions on ${date} (${ranked.length}):\n` +
    `Combined trading volume: ${money(totalVolume)}\n\n` +
    ranked.map((r, i) => recordLine(r, i, false)).join("\n")
  )
}

export async function auctionSummary(args: { auction?: string }): Promise<string> {
  const slug = (args.auction ?? "").trim()
  const all = await allRecords()
  const list = all.filter((a) => bySlug(a, slug || undefined))
  if (!list.length) return `No auction data for "${slug}".`
  const bids = list.map((a) => Number(a.winning_bid_mean)).filter(Number.isFinite)
  const volumes = list.map((a) => Number(a.auction_trading_volume)).filter(Number.isFinite)
  const lots = list.map((a) => Number(a.auction_lots_count)).filter(Number.isFinite)
  const dates = list.map((a) => String(a.dt ?? "")).filter(Boolean).sort()
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN)
  return [
    `${slug || "All whisky auctions"} — summary`,
    `Monthly records: ${list.length}`,
    `Date range: ${dates[0] ?? "?"} to ${dates[dates.length - 1] ?? "?"}`,
    `Mean winning bid: ${money(mean(bids))}`,
    `Highest mean winning bid: ${money(Math.max(...bids))}`,
    `Lowest mean winning bid: ${money(Math.min(...bids))}`,
    `Total trading volume: ${money(volumes.reduce((s, x) => s + x, 0))}`,
    `Average volume per month: ${money(mean(volumes))}`,
    `Total lots sold: ${num(lots.reduce((s, x) => s + x, 0))}`,
  ].join("\n")
}

export async function topAuctions(args: { limit?: number; metric?: "volume" | "mean_bid" | "lots" }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 31)
  const metric = args.metric ?? "volume"
  const all = await allRecords()
  const groups = new Map<string, AuctionRecord[]>()
  for (const a of all) {
    const key = a.auction_slug ?? a.auction_name ?? "?"
    groups.set(key, [...(groups.get(key) ?? []), a])
  }
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
  const rows = [...groups.entries()].map(([slug, records]) => {
    const volumes = records.map((r) => Number(r.auction_trading_volume)).filter(Number.isFinite)
    const bids = records.map((r) => Number(r.winning_bid_mean)).filter(Number.isFinite)
    const lots = records.map((r) => Number(r.auction_lots_count)).filter(Number.isFinite)
    const value = metric === "volume" ? sum(volumes) : metric === "lots" ? sum(lots) : bids.length ? sum(bids) / bids.length : 0
    return { slug, name: records[0]?.auction_name ?? slug, value, months: records.length, volume: sum(volumes), meanBid: bids.length ? sum(bids) / bids.length : NaN }
  })
  rows.sort((a, b) => b.value - a.value)
  const label = metric === "volume" ? "total trading volume" : metric === "lots" ? "total lots sold" : "average mean winning bid"
  return (
    `Whisky auctions ranked by ${label}:\n` +
    rows
      .slice(0, limit)
      .map(
        (r, i) =>
          `${i + 1}. ${r.name} — ${metric === "mean_bid" ? money(r.value) : money(r.value)} | ${metric === "lots" ? `${num(r.value)} lots` : `vol ${money(r.volume)}`} | mean bid ${money(r.meanBid)} | ${r.months} month(s)`
      )
      .join("\n")
  )
}

/** Mean winning bid over time for one auction, or for the whole market. */
export async function marketTrend(args: { auction?: string; points?: number }): Promise<string> {
  const points = Math.min(Math.max(Number(args.points) || 12, 1), 40)
  const slug = (args.auction ?? "").trim()
  const all = await allRecords()
  const list = all.filter((a) => bySlug(a, slug || undefined))
  if (!list.length) return `No auction data for "${slug}".`

  const byMonth = new Map<string, number[]>()
  for (const a of list) {
    const bid = Number(a.winning_bid_mean)
    if (!a.dt || !Number.isFinite(bid)) continue
    byMonth.set(a.dt, [...(byMonth.get(a.dt) ?? []), bid])
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-points)
  if (!months.length) return "No dated records for that selection."
  return (
    `Mean winning bid by month — ${slug || "all whisky auctions"}:\n` +
    months.map(([dt, bids]) => `${dt} | ${money(bids.reduce((s, x) => s + x, 0) / bids.length)} (${bids.length} auction(s))`).join("\n")
  )
}

/** Mean winning bid and volume for each calendar month, averaged over all years. */
export async function seasonality(args: { auction?: string }): Promise<string> {
  const slug = (args.auction ?? "").trim()
  const all = await allRecords()
  const list = all.filter((a) => bySlug(a, slug || undefined))
  if (!list.length) return `No auction data for "${slug}".`

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const bids = new Map<number, number[]>()
  const volumes = new Map<number, number[]>()
  const lots = new Map<number, number[]>()
  let dated = 0

  for (const a of list) {
    const month = Number(String(a.dt ?? "").slice(5, 7))
    if (!Number.isInteger(month) || month < 1 || month > 12) continue
    dated += 1
    const bid = Number(a.winning_bid_mean)
    if (Number.isFinite(bid)) bids.set(month, [...(bids.get(month) ?? []), bid])
    const volume = Number(a.auction_trading_volume)
    if (Number.isFinite(volume)) volumes.set(month, [...(volumes.get(month) ?? []), volume])
    const lot = Number(a.auction_lots_count)
    if (Number.isFinite(lot)) lots.set(month, [...(lots.get(month) ?? []), lot])
  }

  if (!dated) return "No dated records for that selection."

  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN)
  const ranked = MONTHS.map((label, i) => ({
    label,
    month: i + 1,
    months: bids.get(i + 1)?.length ?? 0,
    bid: mean(bids.get(i + 1) ?? []),
    volume: mean(volumes.get(i + 1) ?? []),
    lots: mean(lots.get(i + 1) ?? []),
  })).filter((row) => row.months > 0)

  const byMonth = MONTHS.map((label, i) => {
    const row = ranked.find((r) => r.month === i + 1)
    if (!row) return ""
    return `  ${label}: mean bid ${money(row.bid)} | avg volume ${money(row.volume)} | avg ${num(row.lots)} lot(s) over ${row.months} month(s)`
  }).filter(Boolean)

  const best = [...ranked].sort((a, b) => b.bid - a.bid)
  return [
    `Whisky auction seasonality${slug ? ` — ${slug}` : " — all auctions"} (${dated} dated record(s)):`,
    ...byMonth,
    "",
    `Strongest month by mean winning bid: ${best[0].label} at ${money(best[0].bid)}`,
    best.length > 1 ? `Weakest month: ${best[best.length - 1].label} at ${money(best[best.length - 1].bid)}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Side by side comparison of two or more auctions over the same period. */
export async function auctionCompare(args: { auctions: string; limit?: number }): Promise<string> {
  const wanted = String(args.auctions ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (wanted.length < 2) return "Provide at least two comma separated auction slugs, e.g. 'whiskyauctioneer,scotchwhiskyauctions'."
  const limit = Math.min(Math.max(Number(args.limit) || 12, 2), 30)
  const all = await allRecords()

  const blocks: string[] = []
  const missing: string[] = []
  for (const slug of wanted) {
    const list = all.filter((a) => bySlug(a, slug))
    if (!list.length) {
      missing.push(slug)
      continue
    }
    const bids = list.map((a) => Number(a.winning_bid_mean)).filter(Number.isFinite)
    const volumes = list.map((a) => Number(a.auction_trading_volume)).filter(Number.isFinite)
    const lots = list.map((a) => Number(a.auction_lots_count)).filter(Number.isFinite)
    const dates = list.map((a) => String(a.dt ?? "")).filter(Boolean).sort()
    const recent = [...list].sort((a, b) => String(b.dt ?? "").localeCompare(String(a.dt ?? ""))).slice(0, limit)
    const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN)
    blocks.push(
      `${list[0]?.auction_name ?? slug} (${slug})` +
        `\n   Records: ${list.length} | Range: ${dates[0] ?? "?"} to ${dates[dates.length - 1] ?? "?"}` +
        `\n   Mean winning bid: ${money(mean(bids))} | Highest: ${money(Math.max(...bids))}` +
        `\n   Total volume: ${money(volumes.reduce((s, x) => s + x, 0))} | Avg volume/month: ${money(mean(volumes))}` +
        `\n   Lots sold: ${num(lots.reduce((s, x) => s + x, 0))}` +
        `\n   Latest months:\n` +
        recent.map((r) => `      ${r.dt ?? "?"} | ${money(r.winning_bid_mean)} mean bid | ${money(r.auction_trading_volume)} volume`).join("\n")
    )
  }

  if (!blocks.length) {
    const slugs = [...new Set(all.map((a) => a.auction_slug))].filter(Boolean).slice(0, 12)
    return `No auction data for any of those slugs. Known slugs include: ${slugs.join(", ")}`
  }

  return [
    `Comparing ${blocks.length} whisky auction(s):`,
    "",
    blocks.join("\n\n"),
    missing.length ? `\nNo data for: ${missing.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
// ---- batch-5 tools: market momentum, monthly leaderboard, head to head (2026-09-27) ----

type MomentumMetric = "volume" | "mean_bid" | "lots"

const metricOf = (records: AuctionRecord[], metric: MomentumMetric): number => {
  const values = records.map((r) =>
    metric === "volume" ? Number(r.auction_trading_volume) : metric === "lots" ? Number(r.auction_lots_count) : Number(r.winning_bid_mean)
  ).filter(Number.isFinite)
  if (!values.length) return NaN
  // Volume and lots are totals for the month; the winning bid is an average.
  return metric === "mean_bid" ? values.reduce((s, x) => s + x, 0) / values.length : values.reduce((s, x) => s + x, 0)
}

const metricLabel: Record<MomentumMetric, string> = {
  volume: "trading volume",
  mean_bid: "mean winning bid",
  lots: "lots sold",
}

const pctChange = (previous: number, recent: number): string => {
  if (!Number.isFinite(previous) || !Number.isFinite(recent)) return "n/a"
  if (previous === 0) return recent === 0 ? "0%" : "new activity"
  const pct = ((recent - previous) / previous) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

/**
 * Compares the most recent months against the months immediately before them,
 * so a direction ("the market is cooling") comes with a number behind it.
 */
export async function marketMomentum(args: { auction?: string; months?: number }): Promise<string> {
  const slug = (args.auction ?? "").trim()
  const months = Math.min(Math.max(Math.trunc(Number(args.months) || 6), 1), 24)
  const all = await allRecords()
  const list = all.filter((a) => bySlug(a, slug || undefined))
  if (!list.length) {
    return slug ? `No auction data for "${slug}".` : "No auction data returned."
  }
  const byMonth = new Map<string, AuctionRecord[]>()
  for (const record of list) {
    const dt = String(record.dt ?? "")
    if (!/^\d{4}-\d{2}/.test(dt)) continue
    byMonth.set(dt, [...(byMonth.get(dt) ?? []), record])
  }
  const dates = [...byMonth.keys()].sort()
  if (!dates.length) return "No dated records for that selection."

  const recentDates = dates.slice(-months)
  const priorDates = dates.slice(-months * 2, -months)
  const gather = (keys: string[]) => keys.flatMap((key) => byMonth.get(key) ?? [])
  const recent = gather(recentDates)
  const prior = gather(priorDates)

  const metricOn = (metric: MomentumMetric, records: AuctionRecord[]) => metricOf(records, metric)
  const lines = (["mean_bid", "volume", "lots"] as MomentumMetric[]).map((metric) => {
    const now = metricOn(metric, recent)
    const before = prior.length ? metricOn(metric, prior) : NaN
    const direction = !Number.isFinite(before)
      ? "no earlier window to compare"
      : now > before
        ? "up"
        : now < before
          ? "down"
          : "flat"
    return `  ${metricLabel[metric]}: ${metric === "lots" ? num(now) : money(now)} vs ${Number.isFinite(before) ? (metric === "lots" ? num(before) : money(before)) : "—"} → ${pctChange(before, now)} (${direction})`
  })

  const label = slug || "all whisky auctions"
  return [
    `Whisky market momentum — ${label}`,
    `Recent window: ${recentDates[0]} to ${recentDates[recentDates.length - 1]} (${recentDates.length} month(s))`,
    priorDates.length
      ? `Compare window: ${priorDates[0]} to ${priorDates[priorDates.length - 1]} (${priorDates.length} month(s))`
      : "Compare window: not enough earlier records in the dataset",
    "",
    ...lines,
    "",
    priorDates.length
      ? "Each metric is the recent window against the window before it, so the direction is a change in the market, not a single month's noise."
      : "Only one window of records exists for this selection, so no change can be measured yet.",
  ].join("\n")
}

/**
 * Who led the market in the last few months, on volume, lots or winning bid,
 * with each house's share of the volume traded in that window.
 */
export async function auctionLeaderboard(args: {
  months?: number
  metric?: MomentumMetric
  limit?: number
}): Promise<string> {
  const months = Math.min(Math.max(Math.trunc(Number(args.months) || 3), 1), 12)
  const metric: MomentumMetric = args.metric === "lots" || args.metric === "mean_bid" ? args.metric : "volume"
  const limit = Math.min(Math.max(Math.trunc(Number(args.limit) || 10), 1), 31)
  const all = await allRecords()
  if (!all.length) return "No auction data returned."

  const dates = [...new Set(all.map((a) => String(a.dt ?? "")).filter((dt) => /^\d{4}-\d{2}/.test(dt)))].sort()
  if (!dates.length) return "No dated records in the dataset."
  const window = new Set(dates.slice(-months))
  const inWindow = all.filter((a) => window.has(String(a.dt ?? "")))
  if (!inWindow.length) return `No records in the last ${months} recorded month(s).`

  const groups = new Map<string, AuctionRecord[]>()
  for (const record of inWindow) {
    const key = record.auction_slug ?? record.auction_name ?? "?"
    groups.set(key, [...(groups.get(key) ?? []), record])
  }
  const rows = [...groups.entries()].map(([slug, records]) => ({
    slug,
    name: records[0]?.auction_name ?? slug,
    value: metricOf(records, metric),
    volume: metricOf(records, "volume"),
    lots: metricOf(records, "lots"),
    months: new Set(records.map((r) => String(r.dt ?? ""))).size,
  }))
  rows.sort((a, b) => (Number.isFinite(b.value) ? b.value : -Infinity) - (Number.isFinite(a.value) ? a.value : -Infinity))
  const totalVolume = rows.reduce((sum, row) => sum + (Number.isFinite(row.volume) ? row.volume : 0), 0)

  return [
    `Whisky auction leaderboard — last ${window.size} recorded month(s) (${[...window].sort()[0]} to ${[...window].sort().pop()}), ranked by ${metricLabel[metric]}`,
    "",
    ...rows.slice(0, limit).map((row, i) => {
      const share = totalVolume > 0 && Number.isFinite(row.volume) ? ` | ${Math.round((row.volume / totalVolume) * 100)}% of volume` : ""
      const value = metric === "lots" ? `${num(row.value)} lot(s)` : money(row.value)
      return `  ${i + 1}. ${row.name} (${row.slug}) — ${value} | volume ${money(row.volume)}${share} | ${row.months} month(s) in window`
    }),
    "",
    `${rows.length} auction house(s) traded in this window; combined volume ${money(totalVolume)}.`,
    rows.length > limit ? `Showing the top ${limit}.` : "",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

/**
 * Two auction houses, month by month: who took more volume, more lots or the
 * higher winning bid, and the running tally.
 */
export async function slugHeadToHead(args: {
  a: string
  b: string
  months?: number
  metric?: MomentumMetric
}): Promise<string> {
  const first = (args.a ?? "").trim()
  const second = (args.b ?? "").trim()
  if (!first || !second) return "Provide two auction slugs, e.g. a='whiskyauctioneer', b='scotchwhiskyauctions'."
  if (first.toLowerCase() === second.toLowerCase()) return "Give two different auction slugs to compare."
  const months = Math.min(Math.max(Math.trunc(Number(args.months) || 12), 1), 40)
  const metric: MomentumMetric = args.metric === "lots" || args.metric === "mean_bid" ? args.metric : "volume"
  const all = await allRecords()
  const left = all.filter((a) => bySlug(a, first))
  const right = all.filter((a) => bySlug(a, second))
  if (!left.length || !right.length) {
    const known = [...new Set(all.map((a) => a.auction_slug))].filter(Boolean).slice(0, 12)
    const missing = !left.length ? first : second
    return `No auction data for "${missing}". Known slugs include: ${known.join(", ")}`
  }

  const common = [...new Set([...left, ...right].map((r) => String(r.dt ?? "")))]
    .filter((dt) => /^\d{4}-\d{2}/.test(dt))
    .sort()
    .slice(-months)

  let leftWins = 0
  let rightWins = 0
  let ties = 0
  const lines: string[] = []
  for (const dt of common) {
    const leftValue = metricOf(left.filter((r) => String(r.dt ?? "") === dt), metric)
    const rightValue = metricOf(right.filter((r) => String(r.dt ?? "") === dt), metric)
    const show = (value: number) => (Number.isFinite(value) ? (metric === "lots" ? num(value) : money(value)) : "—")
    let verdict = "tie"
    if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
      if (leftValue > rightValue) {
        leftWins += 1
        verdict = first
      } else if (rightValue > leftValue) {
        rightWins += 1
        verdict = second
      } else {
        ties += 1
      }
    } else {
      ties += 1
    }
    lines.push(`  ${dt} | ${first} ${show(leftValue)} | ${second} ${show(rightValue)} → ${verdict}`)
  }

  const total = (records: AuctionRecord[]) => metricOf(records, metric)
  const leftTotal = total(left)
  const rightTotal = total(right)
  const overall = !Number.isFinite(leftTotal) || !Number.isFinite(rightTotal)
    ? "not comparable"
    : leftTotal > rightTotal
      ? first
      : rightTotal > leftTotal
        ? second
        : "tie"
  const showTotal = (value: number) => (Number.isFinite(value) ? (metric === "lots" ? num(value) : money(value)) : "—")

  return [
    `Head to head on ${metricLabel[metric]} — ${first} vs ${second}`,
    `Months compared: ${common.length}${common.length ? ` (${common[0]} to ${common[common.length - 1]})` : ""}`,
    "",
    ...lines,
    "",
    `Monthly wins: ${first} ${leftWins}, ${second} ${rightWins}, ties ${ties}.`,
    `All-time totals in the dataset: ${first} ${showTotal(leftTotal)} vs ${second} ${showTotal(rightTotal)} → ${overall}.`,
  ].join("\n")
}

// ---- muxH tools:
// The ten tools above work on price: trends, momentum, seasonality, a leaderboard
// and head-to-heads between houses. These two work on the other half of an auction,
// which is liquidity. A house can hold the highest mean hammer and still sell fewer
// lots than a warehouse, and only one of those facts is about value.

/** One house's row, with the derived liquidity figures the price tools do not carry. */
interface WhHouse {
  name: string
  slug: string
  months: number
  lots: number
  volume: number
  meanHammer: number
  marketShare: number
  valuePerLot: number
  volumePerLot: number
  latest: number
  first: number
  change: number
}

const whIntl = (n: number): string => n.toLocaleString(undefined, { maximumFractionDigits: 0 })
const whMoney = (n: number): string => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

/**
 * The market as a whole rather than any one house: how many lots and how much
 * value moved each year, what the market's own average hammer did, and how much of
 * each year the top five houses took. House-level trends cannot show this, because
 * a house can grow while the market it sells into shrinks.
 */
export async function marketStructure(args: { years?: number }): Promise<string> {
  const years = Math.min(Math.max(Number(args?.years ?? 12) || 12, 3), 24)
  const records = await allRecords()
  if (!records.length) throw new WhiskyhunterError("WhiskyHunter returned no auction records to structure.")

  const allDates = records.map((r) => String(r.dt ?? "")).filter(Boolean).sort()
  const fromYear = new Date().getUTCFullYear() - years
  const window = records.filter((r) => Number(String(r.dt ?? "").slice(0, 4)) >= fromYear);
  if (!window.length) {
    const last = allDates[allDates.length - 1] ?? "not reported";
    return `No records fall in the last ${years} years. The dataset's most recent record is ${last}, so a window that recent is empty rather than missing.`;
  }

  interface Year { year: string; lots: number; volume: number; hammerSum: number; months: number; houseLots: Map<string, number> }
  const byYear = new Map<string, Year>();
  for (const r of window) {
    const year = String(r.dt ?? "").slice(0, 4);
    if (!/^\d{4}$/.test(year)) continue;
    const entry = byYear.get(year) ?? { year, lots: 0, volume: 0, hammerSum: 0, months: 0, houseLots: new Map<string, number>() };
    const lots = Number(r.auction_lots_count ?? 0);
    entry.lots += lots;
    entry.volume += Number(r.auction_trading_volume ?? 0);
    entry.hammerSum += Number(r.winning_bid_mean ?? 0);
    entry.months += 1;
    const slug = String(r.auction_slug ?? "unknown");
    entry.houseLots.set(slug, (entry.houseLots.get(slug) ?? 0) + lots);
    byYear.set(year, entry);
  }
  const series = [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year));
  if (!series.length) throw new WhiskyhunterError("No usable year values in the records.");

  const first = series[0];
  const last = series[series.length - 1];
  const maxLots = Math.max(...series.map((y) => y.lots));
  const concentration = series.map((y) => {
    const top5 = [...y.houseLots.values()].sort((a, b) => b - a).slice(0, 5).reduce((s, n) => s + n, 0);
    return { year: y.year, share: top5 / (y.lots || 1), houses: y.houseLots.size };
  });

  return [
    `Whisky auction market structure, ${first.year} to ${last.year}`,
    `  ${series.length} year(s) in the window, ${first.year} saw ${whIntl(first.lots)} lots and ${last.year} saw ${whIntl(last.lots)}`,
    `  lots ${last.lots >= first.lots ? "grew" : "fell"} ${Math.abs(((last.lots - first.lots) / (first.lots || 1)) * 100).toFixed(0)}% across the window; traded value ${last.volume >= first.volume ? "grew" : "fell"} ${Math.abs(((last.volume - first.volume) / (first.volume || 1)) * 100).toFixed(0)}%`,
    `  houses reporting in ${first.year}: ${concentration[0]?.houses ?? "?"} | in ${last.year}: ${concentration[concentration.length - 1]?.houses ?? "?"}`,
    "",
    "By year:",
    ...series.map((y) => {
      const mean = y.months ? y.hammerSum / y.months : 0;
      const conc = concentration.find((c) => c.year === y.year);
      return (
        `  ${y.year}  ${whIntl(y.lots).padStart(9)} lots  ${whMoney(y.volume).padStart(14)}  mean hammer ${whMoney(mean).padStart(8)}  ` +
        `${String(y.months).padStart(2)} month(s) reported  top five ${((conc?.share ?? 0) * 100).toFixed(0).padStart(3)}%  ${"#".repeat(Math.max(0, Math.round((y.lots / maxLots) * 26)))}`
      );
    }),
    "",
    "Concentration of lots in the five largest houses, by year:",
    ...concentration.map((c) => `  ${c.year}  ${(c.share * 100).toFixed(0).padStart(3)}%  ${"#".repeat(Math.round(c.share * 40))}`),
    "",
    "Read as: a market whose top five take a rising share is one where scale is being lost to consolidation, and a falling share means smaller houses are taking volume. The mean hammer here averages each house's monthly mean rather than weighting by lots, so a small house selling one expensive cask moves it as much as a large one selling hundreds, which is why it should be read beside the lots column and not on its own. Months reported differs year to year, so a year with fewer months is a thinner record rather than a quieter market.",
  ].join("\n");
}
