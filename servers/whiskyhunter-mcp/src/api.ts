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
