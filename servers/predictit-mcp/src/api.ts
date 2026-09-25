const BASE = "https://www.predictit.org/api/marketdata"
const UA = "mrfentmen-predictit-mcp/1.0 (https://github.com/mrfentmen)"

export class PredictitError extends Error {}

interface Contract {
  id?: number
  dateEnd?: string
  name?: string
  shortName?: string
  status?: string
  lastTradePrice?: number
  bestBuyYesCost?: number | null
  bestBuyNoCost?: number | null
  bestSellYesCost?: number | null
  bestSellNoCost?: number | null
  lastClosePrice?: number
}

interface Market {
  id?: number
  name?: string
  shortName?: string
  url?: string
  status?: string
  timeStamp?: string
  contracts?: Contract[]
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 404) throw new PredictitError(`Not found (404): ${url}`)
  if (!res.ok) throw new PredictitError(`PredictIt returned HTTP ${res.status}`)
  return (await res.json()) as T
}

let cache: { at: number; markets: Market[] } | null = null

/** The all-markets feed is ~200 markets; cache it briefly so one session is not re-fetching it. */
async function allMarkets(): Promise<Market[]> {
  if (cache && Date.now() - cache.at < 60000) return cache.markets
  const d = await getJson<{ markets?: Market[] }>(`${BASE}/all/`)
  const markets = Array.isArray(d.markets) ? d.markets : []
  cache = { at: Date.now(), markets }
  return markets
}

const cents = (price: number | null | undefined): string => {
  if (typeof price !== "number" || !Number.isFinite(price)) return "—"
  return `${Math.round(price * 100)}¢`
}

const pct = (price: number | null | undefined): string => {
  if (typeof price !== "number" || !Number.isFinite(price)) return "—"
  return `${Math.round(price * 100)}%`
}

function contractLine(c: Contract, i?: number): string {
  const pre = i === undefined ? "" : `   ${i + 1}. `
  const buyYes = c.bestBuyYesCost ?? null
  const sellYes = c.bestSellYesCost ?? null
  return (
    `${pre}${c.shortName ?? c.name ?? "?"} — yes ${cents(buyYes)} (last ${cents(c.lastTradePrice)})${
      sellYes !== null ? `, sell yes ${cents(sellYes)}` : ""
    } | no ${cents(c.bestBuyNoCost)}` + (c.status && c.status !== "Open" ? ` [${c.status}]` : "")
  )
}

const leader = (m: Market): Contract | null => {
  const open = (m.contracts ?? []).filter((c) => typeof c.lastTradePrice === "number")
  if (!open.length) return null
  return open.reduce((best, c) => ((c.lastTradePrice ?? 0) > (best.lastTradePrice ?? 0) ? c : best), open[0])
}

export async function markets(args: { limit?: number; status?: string }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 40)
  const status = (args.status ?? "Open").toLowerCase()
  const all = await allMarkets()
  const list = status === "all" ? all : all.filter((m) => (m.status ?? "").toLowerCase() === status)
  if (!list.length) return `No ${status} PredictIt markets.`
  const ranked = [...list].sort((a, b) => (leader(b)?.lastTradePrice ?? -1) - (leader(a)?.lastTradePrice ?? -1))
  return (
    `PredictIt markets (${ranked.length} ${status}, ${all.length} total, showing ${Math.min(limit, ranked.length)}):\n\n` +
    ranked
      .slice(0, limit)
      .map((m, i) => {
        const top = leader(m)
        return `${i + 1}. ${m.shortName ?? m.name ?? "?"}${top ? ` — leading: ${top.shortName ?? top.name} ${pct(top.lastTradePrice)}` : ""}\n   id ${m.id ?? "?"} | ${(m.contracts ?? []).length} contract(s)\n   ${m.url ?? ""}`
      })
      .join("\n\n")
  )
}

export async function searchMarkets(args: { query: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim().toLowerCase()
  if (!q) return "Provide a search query, e.g. 'election', 'Fed', 'bitcoin'."
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 40)
  const hits = (await allMarkets()).filter(
    (m) => (m.name ?? "").toLowerCase().includes(q) || (m.shortName ?? "").toLowerCase().includes(q)
  )
  if (!hits.length) return `No PredictIt markets match "${args.query}".`
  return (
    `PredictIt markets matching "${args.query}" (${hits.length}):\n\n` +
    hits
      .slice(0, limit)
      .map((m, i) => {
        const top = leader(m)
        return `${i + 1}. ${m.name ?? "?"}${top ? ` — leading: ${top.shortName ?? top.name} ${pct(top.lastTradePrice)}` : ""}\n   id ${m.id ?? "?"} | status ${m.status ?? "?"}`
      })
      .join("\n\n")
  )
}

export async function marketDetail(args: { market_id: string }): Promise<string> {
  const id = String(args.market_id ?? "").trim()
  if (!/^\d+$/.test(id)) return "Provide a numeric market id (see markets)."
  const m = await getJson<Market>(`${BASE}/markets/${id}`)
  if (!m?.name) return `No PredictIt market with id ${id}.`
  const contracts = (m.contracts ?? []).slice().sort((a, b) => (b.lastTradePrice ?? -1) - (a.lastTradePrice ?? -1))
  const lines = [
    m.name,
    `${m.status ?? "?"} | ${contracts.length} contract(s) | ${m.url ?? ""}`,
    m.timeStamp ? `Quote time: ${m.timeStamp.slice(0, 19).replace("T", " ")} UTC` : "",
  ].filter(Boolean)
  if (contracts.length) {
    lines.push("", "Contracts (yes price = implied probability):")
    for (const c of contracts) lines.push(contractLine(c))
  }
  return lines.join("\n")
}

export async function contractPrice(args: { market_id: string; contract: string }): Promise<string> {
  const id = String(args.market_id ?? "").trim()
  const want = (args.contract ?? "").trim().toLowerCase()
  if (!/^\d+$/.test(id)) return "Provide a numeric market id (see markets)."
  if (!want) return "Provide a contract name or short name, e.g. 'Democrats sweep'."
  const m = await getJson<Market>(`${BASE}/markets/${id}`)
  const contracts = m?.contracts ?? []
  if (!contracts.length) return `No contracts found for market ${id}.`
  const hit =
    contracts.find((c) => (c.shortName ?? "").toLowerCase() === want || (c.name ?? "").toLowerCase() === want) ??
    contracts.find((c) => (c.shortName ?? "").toLowerCase().includes(want) || (c.name ?? "").toLowerCase().includes(want))
  if (!hit) {
    return `No contract matching "${args.contract}" in "${m.name ?? id}". Available: ${contracts
      .map((c) => c.shortName ?? c.name)
      .join(", ")}`
  }
  return [
    `${m.name ?? id}`,
    hit.name ?? hit.shortName ?? "?",
    `Buy YES: ${cents(hit.bestBuyYesCost)} | Sell YES: ${cents(hit.bestSellYesCost)}`,
    `Buy NO:  ${cents(hit.bestBuyNoCost)} | Sell NO:  ${cents(hit.bestSellNoCost)}`,
    `Last trade: ${cents(hit.lastTradePrice)} | Last close: ${cents(hit.lastClosePrice)}`,
    `Implied probability of YES: ${pct(hit.bestBuyYesCost ?? hit.lastTradePrice)}`,
    hit.status ? `Status: ${hit.status}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Largest contract price moves versus the previous close, across every market. */
export async function biggestMovers(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25)
  const all = await allMarkets()
  const moves: Array<{ market: string; contract: string; last: number; close: number; delta: number; id?: number }> = []
  for (const m of all) {
    for (const c of m.contracts ?? []) {
      const last = c.lastTradePrice
      const close = c.lastClosePrice
      if (typeof last !== "number" || typeof close !== "number" || !Number.isFinite(last) || !Number.isFinite(close)) continue
      if (last === 0 && close === 0) continue
      moves.push({
        market: m.shortName ?? m.name ?? "?",
        contract: c.shortName ?? c.name ?? "?",
        last,
        close,
        delta: last - close,
        id: m.id,
      })
    }
  }
  if (!moves.length) return "No contract price movement data right now."
  const byAbs = [...moves].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, limit)
  return (
    `Biggest PredictIt moves vs last close (of ${moves.length} contracts):\n\n` +
    byAbs
      .map(
        (m, i) =>
          `${i + 1}. ${m.market} → ${m.contract} ${m.delta >= 0 ? "▲" : "▼"} ${Math.round(Math.abs(m.delta) * 100)}¢ to ${pct(m.last)} (close ${pct(m.close)}) [market ${m.id}]`
      )
      .join("\n")
  )
}
