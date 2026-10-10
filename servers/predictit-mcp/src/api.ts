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

/** Totals across the whole exchange: how many markets and contracts trade right now. */
export async function marketSummary(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25)
  const all = await allMarkets()
  if (!all.length) return "PredictIt returned no markets."
  const open = all.filter((m) => (m.status ?? "").toLowerCase() === "open")
  const contracts = all.flatMap((m) => m.contracts ?? [])
  const priced = contracts.filter((c) => typeof c.lastTradePrice === "number")
  const times = all.map((m) => m.timeStamp ?? "").filter(Boolean).sort()

  const ranked = [...open]
    .map((m) => ({ m, picks: (m.contracts ?? []).filter((c) => typeof c.lastTradePrice === "number") }))
    .filter((row) => row.picks.length > 1)
    .sort((a, b) => b.picks.length - a.picks.length)

  return [
    `PredictIt exchange summary (${all.length} markets, ${open.length} open):`,
    `Contracts: ${contracts.length} total, ${priced.length} with a traded price`,
    times.length ? `Quote timestamp: ${times[times.length - 1].slice(0, 19).replace("T", " ")} UTC` : "",
    "",
    `Most contested open markets (by number of priced contracts):`,
    ...ranked.slice(0, limit).map((row, i) => {
      const top = leader(row.m)
      return `  ${i + 1}. ${row.m.shortName ?? row.m.name ?? "?"} — ${row.picks.length} contracts` +
        `${top ? `, leading ${top.shortName ?? top.name} ${pct(top.lastTradePrice)}` : ""} [market ${row.m.id ?? "?"}]`
    }),
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * For a market whose outcomes are mutually exclusive and cover every possibility,
 * the YES prices should add up to about $1, and a total well under $1 means the
 * whole field can be bought for less than the $1 payout. Many PredictIt markets
 * are NOT like that — threshold, range and approval markets can have several
 * contracts true at once, so a total above $1 is normal there and is not an
 * arbitrage. Only the under-priced side is reported as a signal.
 */
export async function arbitrageCheck(args: { limit?: number; threshold?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25)
  const threshold = Math.min(Math.max(Number(args.threshold) || 0.97, 0.5), 1)
  const all = await allMarkets()
  const rows: Array<{ name: string; id?: number; total: number; legs: number; cheapest: number }> = []

  for (const m of all) {
    if ((m.status ?? "").toLowerCase() !== "open") continue
    const legs = (m.contracts ?? [])
      .map((c) => c.bestBuyYesCost ?? c.lastTradePrice)
      .filter((p): p is number => typeof p === "number" && Number.isFinite(p) && p > 0)
    if (legs.length < 2) continue
    const total = legs.reduce((sum, price) => sum + price, 0)
    rows.push({
      name: m.shortName ?? m.name ?? "?",
      id: m.id,
      total: Math.round(total * 1000) / 1000,
      legs: legs.length,
      cheapest: Math.min(...legs),
    })
  }

  if (!rows.length) return "No open PredictIt market has two or more priced contracts right now."

  const under = rows.filter((r) => r.total < threshold).sort((a, b) => a.total - b.total)
  const over = rows.filter((r) => r.total > 1.03)
  const lines = [
    `Checked ${rows.length} open PredictIt market(s) with at least two priced contracts.`,
    `For a market where exactly one outcome wins, buying every YES costs the total below and the winner pays $1.00.`,
    "",
  ]

  if (under.length) {
    lines.push(`Fields priced below $${threshold.toFixed(2)} — ${under.length} found:`)
    for (const [i, row] of under.slice(0, limit).entries()) {
      const profit = Math.round((1 - row.total) * 1000) / 10
      lines.push(
        `  ${i + 1}. ${row.name} — total ${row.total.toFixed(3)} for ${row.legs} contract(s), ` +
        `gross margin if one outcome wins ${profit}% [market ${row.id ?? "?"}]`
      )
    }
  } else {
    lines.push(`No market is currently priced below $${threshold.toFixed(2)}.`)
  }

  lines.push(
    "",
    `${over.length} of the ${rows.length} markets total more than $1.03. That is expected rather than exploitable: ` +
      "threshold, range and approval markets can pay out on several contracts at once, and some fields do not list every runner.",
    "Before acting on any market above, open it with market_detail and confirm its outcomes really are mutually exclusive and complete.",
    "Fees, spread, and contracts added after you buy are not accounted for."
  )
  return lines.join("\n")
}
// ---- batch-5 tools: market compare, contract search, long shots (2026-09-27) ----

const money = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? cents(value) : "—")

function findMarket(markets: Market[], key: string): Market | null {
  const wanted = (key ?? "").trim().toLowerCase()
  if (!wanted) return null
  return (
    markets.find((m) => String(m.id) === wanted) ??
    markets.find((m) => (m.shortName ?? "").toLowerCase() === wanted) ??
    markets.find((m) => (m.name ?? "").toLowerCase().includes(wanted)) ??
    null
  )
}

/** How far a contract has moved since its last close, which the feed does publish. */
function change(contract: Contract): number | null {
  const now = contract.lastTradePrice
  const close = contract.lastClosePrice
  if (typeof now !== "number" || typeof close !== "number") return null
  return now - close
}

/**
 * Two or more markets side by side, contract by contract. Comparing one market
 * in detail is market_detail; the question here is which of several similar
 * markets is priced further from even.
 */
export async function compareMarkets(args: { markets: string[] }): Promise<string> {
  const keys = (args.markets ?? []).map((m) => String(m).trim()).filter(Boolean)
  if (keys.length < 2) throw new PredictitError("Give at least two market ids or name fragments to compare.")
  if (keys.length > 5) throw new PredictitError("Compare at most five markets at a time.")
  const all = await allMarkets()
  const chosen = keys.map((key) => ({ key, market: findMarket(all, key) }))
  const missing = chosen.filter((c) => !c.market).map((c) => c.key)
  if (missing.length) throw new PredictitError(`No open market matches: ${missing.join(", ")}.`)

  const lines: string[] = [`Comparing ${chosen.length} markets`]
  const confidence: { name: string; top: number; spread: number }[] = []
  for (const { market } of chosen) {
    const contracts = market?.contracts ?? []
    const yes = contracts.map((c) => c.bestBuyYesCost).filter((v): v is number => typeof v === "number")
    const top = yes.length ? Math.max(...yes) : 0
    const spread = yes.length ? Math.max(...yes) - Math.min(...yes) : 0
    confidence.push({ name: market?.shortName ?? market?.name ?? "?", top, spread })
    lines.push(
      "",
      `${market?.name ?? "?"} (id ${market?.id ?? "?"}, ${contracts.length} contract(s), status ${market?.status ?? "?"})`,
      ...contracts.slice(0, 12).map((c) => {
        const delta = change(c)
        return `  ${(c.name ?? "?").slice(0, 40).padEnd(42)} yes ${money(c.bestBuyYesCost)} | no ${money(c.bestBuyNoCost)} | last ${money(c.lastTradePrice)}${delta !== null && Math.abs(delta) >= 0.005 ? ` (${delta > 0 ? "+" : ""}${Math.round(delta * 100)}¢ today)` : ""}`
      }),
      contracts.length > 12 ? `  ... ${contracts.length - 12} more contract(s)` : "",
      `  most likely outcome priced at ${money(top)}, widest spread between contracts ${Math.round(spread * 100)}¢`
    )
  }
  const deepest = [...confidence].sort((a, b) => b.top - a.top)[0]
  const widest = [...confidence].sort((a, b) => b.spread - a.spread)[0]
  lines.push(
    "",
    `Most decided: ${deepest.name} (top contract ${money(deepest.top)}). Most open question: ${widest.name} (contracts span ${Math.round(widest.spread * 100)}¢).`,
    "Prices are the cost to buy the contract, so they read as the market's implied probability in cents."
  )
  return lines.filter((line) => line !== "").join("\n")
}

/**
 * Search the tradeable contracts themselves, not the market titles, so a
 * specific outcome can be found across every market that names it.
 */
export async function searchContracts(args: { query: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "").trim().toLowerCase()
  if (query.length < 2) throw new PredictitError("Give at least two characters to search for.")
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 50)
  const all = await allMarkets()
  const hits: { contract: Contract; market: Market }[] = []
  for (const market of all) {
    for (const contract of market.contracts ?? []) {
      if ((contract.name ?? "").toLowerCase().includes(query) || (contract.shortName ?? "").toLowerCase().includes(query)) {
        hits.push({ contract, market })
      }
    }
  }
  if (!hits.length) return `No contract name contains "${args.query}".`
  hits.sort((a, b) => (b.contract.bestBuyYesCost ?? 0) - (a.contract.bestBuyYesCost ?? 0))
  return [
    `Contracts matching "${args.query}": ${hits.length} across ${new Set(hits.map((h) => h.market.id)).size} market(s)`,
    "",
    ...hits.slice(0, limit).map((h) => {
      const delta = change(h.contract)
      return `  ${(h.contract.name ?? "?").slice(0, 44).padEnd(46)} yes ${money(h.contract.bestBuyYesCost)} | last ${money(h.contract.lastTradePrice)}${delta !== null && Math.abs(delta) >= 0.005 ? ` (${delta > 0 ? "+" : ""}${Math.round(delta * 100)}¢)` : ""}\n    in: ${h.market.name ?? "?"} (id ${h.market.id ?? "?"})`
    }),
    hits.length > limit ? `\nShowing ${limit} of ${hits.length}.` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * Contracts the market prices as unlikely, with the return on winning them.
 * A cheap contract is not a good one, but this is how a long-shot list starts.
 */
export async function longShots(args: { maxPrice?: number; limit?: number }): Promise<string> {
  const maxPrice = Math.min(Math.max(typeof args.maxPrice === "number" ? args.maxPrice : 0.1, 0.01), 0.5)
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 50)
  const all = await allMarkets()
  const rows: { contract: Contract; market: Market }[] = []
  for (const market of all) {
    if ((market.status ?? "").toLowerCase() !== "open") continue
    for (const contract of market.contracts ?? []) {
      const yes = contract.bestBuyYesCost
      if (typeof yes === "number" && yes > 0 && yes <= maxPrice) rows.push({ contract, market })
    }
  }
  if (!rows.length) throw new PredictitError(`No open contract is priced at or below ${Math.round(maxPrice * 100)}¢.`)
  rows.sort((a, b) => (a.contract.bestBuyYesCost ?? 0) - (b.contract.bestBuyYesCost ?? 0))
  return [
    `Long shots: ${rows.length} open contract(s) at ${Math.round(maxPrice * 100)}¢ or less`,
    "",
    ...rows.slice(0, limit).map(({ contract, market }) => {
      const yes = contract.bestBuyYesCost ?? 0
      const multiple = yes > 0 ? (1 - yes) / yes : 0
      return `  ${(contract.name ?? "?").slice(0, 40).padEnd(42)} ${money(yes)} — wins ×${multiple.toFixed(1)} ($${(1 / yes).toFixed(2)} back per $1)\n    ${market.name ?? "?"} (id ${market.id ?? "?"})`
    }),
    "",
    `A contract at ${Math.round(maxPrice * 100)}¢ pays $1 if it happens, so the market calls it about a ${Math.round(maxPrice * 100)}% chance; the payout multiple is why they are tempting and the percentage is why most of them lose.`,
    rows.length > limit ? `Showing ${limit} of ${rows.length} contracts.` : "",
  ].filter((line) => line !== "").join("\n")
}

// ---- muxH tools:
// Every tool above reads prices. These two read the two things the all-markets
// feed also carries and nothing else exposes: when a contract actually settles,
// and how deep the book behind a price really is.

