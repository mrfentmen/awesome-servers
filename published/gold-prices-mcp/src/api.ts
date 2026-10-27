const BASE = "https://api.gold-api.com"
const UA = "mrfentmen-gold-prices-mcp/1.0"

export class GoldError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GoldError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** Precious metals returned by the `all` tool. */
const PRECIOUS: Record<string, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  XPD: "Palladium",
}

/** Names a caller might pass instead of a ticker. */
const ALIASES: Record<string, string> = {
  gold: "XAU",
  silver: "XAG",
  platinum: "XPT",
  palladium: "XPD",
  copper: "HG",
  bitcoin: "BTC",
  btc: "BTC",
  ethereum: "ETH",
  eth: "ETH",
}

/** Yahoo Finance futures tickers, used when the spot API is unreachable from this host. */
const YAHOO_SYMBOLS: Record<string, string> = {
  XAU: "GC=F",
  XAG: "SI=F",
  XPT: "PL=F",
  XPD: "PA=F",
}

interface Quote {
  symbol: string
  name: string
  price: number
  source: string
  updated: string
}

const usd = (value: number) =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: value < 10 ? 4 : 2 })}`

export function normalizeSymbol(input: string): string {
  const value = input.trim()
  if (!value) return "XAU"
  const alias = ALIASES[value.toLowerCase()]
  return alias ?? value.toUpperCase()
}

async function getJson<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new GoldError(`Network error: ${errorMessage(e)}`)
  }
  if (res.status === 429) throw new GoldError("Gold API rate limit hit, wait and retry")
  if (res.status === 404) throw new GoldError(`Gold API does not track that symbol — see the symbols tool`)
  if (!res.ok) throw new GoldError(`Gold API error ${res.status}`)
  return (await res.json()) as T
}

interface SymbolRow {
  name?: string
  symbol?: string
}

async function symbolRows(): Promise<{ symbol: string; name: string }[]> {
  const rows = await getJson<unknown>("/symbols")
  if (!Array.isArray(rows)) throw new GoldError("Gold API returned an unexpected symbol list")
  return (rows as SymbolRow[])
    .filter((row): row is { symbol: string; name?: string } => typeof row.symbol === "string")
    .map((row) => ({ symbol: row.symbol, name: row.name ?? row.symbol }))
}

async function fromSpot(symbol: string): Promise<Quote> {
  const data = await getJson<{
    price?: number
    name?: string
    symbol?: string
    updatedAtReadable?: string
    updatedAt?: string
  }>(`/price/${encodeURIComponent(symbol)}`)
  if (typeof data.price !== "number") {
    throw new GoldError(`Gold API has no price for ${symbol} — see the symbols tool`)
  }
  return {
    symbol: data.symbol ?? symbol,
    name: data.name ?? symbol,
    price: data.price,
    source: "Gold API spot",
    updated: data.updatedAtReadable ?? data.updatedAt ?? "n/a",
  }
}

async function fromYahoo(symbol: string): Promise<Quote> {
  const ticker = YAHOO_SYMBOLS[symbol]
  if (!ticker) throw new GoldError(`No fallback quote source for ${symbol}`)
  let res: Response
  try {
    res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`,
      { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) }
    )
  } catch (e) {
    throw new GoldError(`Yahoo Finance network error: ${errorMessage(e)}`)
  }
  if (res.status === 429) throw new GoldError("Yahoo Finance rate limit hit, wait and retry")
  if (!res.ok) throw new GoldError(`Yahoo Finance error ${res.status}`)
  const data = (await res.json()) as {
    chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; regularMarketTime?: number } }> }
  }
  const meta = data.chart?.result?.[0]?.meta
  if (typeof meta?.regularMarketPrice !== "number") {
    throw new GoldError(`Yahoo Finance returned no price for ${ticker}`)
  }
  return {
    symbol,
    name: PRECIOUS[symbol] ?? symbol,
    price: meta.regularMarketPrice,
    source: `Yahoo Finance ${ticker} futures`,
    updated: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : "n/a",
  }
}

const SOURCES = [fromSpot, fromYahoo]

async function fetchQuote(symbol: string): Promise<Quote> {
  const failures: string[] = []
  for (const source of SOURCES) {
    try {
      return await source(symbol)
    } catch (e) {
      failures.push(errorMessage(e))
    }
  }
  throw new GoldError(`All price sources failed for ${symbol}: ${failures.join("; ")}`)
}

async function quoteLines(symbols: string[]): Promise<string[]> {
  const lines: string[] = []
  for (const symbol of symbols) {
    try {
      const quote = await fetchQuote(symbol)
      lines.push(`${quote.name} (${quote.symbol}): ${usd(quote.price)} — ${quote.source}`)
    } catch (e) {
      lines.push(`${PRECIOUS[symbol] ?? symbol} (${symbol}): unavailable (${errorMessage(e)})`)
    }
  }
  return lines
}

const numbered = (lines: string[]) => lines.map((line, i) => `${i + 1}. ${line}`).join("\n")

export interface PriceArgs {
  metal?: string
}

export async function price(args: PriceArgs = {}): Promise<string> {
  const symbol = normalizeSymbol(args.metal ?? "XAU")
  const quote = await fetchQuote(symbol)
  return `${quote.name} (${quote.symbol}): ${usd(quote.price)} USD\nSource: ${quote.source}\nUpdated: ${quote.updated}`
}

export async function all(): Promise<string> {
  const lines = await quoteLines(Object.keys(PRECIOUS))
  return `Precious metals spot prices (USD):\n${numbered(lines)}`
}

export async function marketOverview(): Promise<string> {
  const rows = await symbolRows()
  const lines = await quoteLines(rows.map((row) => row.symbol))
  return `Live prices for all ${rows.length} assets gold-api tracks (USD):\n${numbered(lines)}\nUse price or convert for a single asset.`
}

export async function symbols(): Promise<string> {
  const rows = await symbolRows()
  return (
    `Gold API tracks ${rows.length} symbols:\n` +
    rows.map((row) => `${row.symbol} = ${row.name}`).join("\n") +
    "\nUse any symbol with price, convert, or market_overview."
  )
}

export interface ConvertArgs {
  amount: number
  from: string
  to?: string
}

export async function convert(args: ConvertArgs): Promise<string> {
  const amount = Number(args.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new GoldError("amount must be a positive number")
  }
  const from = normalizeSymbol(args.from)
  const target = (args.to ?? "USD").trim()
  const fromQuote = await fetchQuote(from)

  if (target.toUpperCase() === "USD") {
    return (
      `${amount} ${fromQuote.symbol} (${fromQuote.name}) = ${usd(amount * fromQuote.price)} USD\n` +
      `Rate: ${usd(fromQuote.price)} per ${fromQuote.symbol}\n` +
      `Source: ${fromQuote.source} | Updated: ${fromQuote.updated}`
    )
  }

  const toSymbol = normalizeSymbol(target)
  const toQuote = await fetchQuote(toSymbol)
  if (toQuote.price <= 0) throw new GoldError(`${toQuote.symbol} has a non-positive price, cannot convert`)
  const result = (amount * fromQuote.price) / toQuote.price
  return (
    `${amount} ${fromQuote.symbol} (${fromQuote.name}) = ${result.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${toQuote.symbol} (${toQuote.name})\n` +
    `Rates: ${usd(fromQuote.price)} per ${fromQuote.symbol}, ${usd(toQuote.price)} per ${toQuote.symbol}\n` +
    `Sources: ${fromQuote.source} (${fromQuote.updated}), ${toQuote.source} (${toQuote.updated})`
  )
}

export interface PortfolioArgs {
  holdings: string
}

export async function portfolioValue(args: PortfolioArgs): Promise<string> {
  const raw = String(args?.holdings ?? "").trim()
  if (!raw) {
    throw new GoldError('holdings is required, for example "XAU:2, XAG:100, BTC:0.5".')
  }
  const entries: { symbol: string; amount: number }[] = []
  for (const part of raw.split(",").map((piece) => piece.trim()).filter(Boolean)) {
    const [rawSymbol, rawAmount] = part.split(":")
    const symbol = normalizeSymbol(rawSymbol ?? "")
    const amount = Number(rawAmount)
    if (!rawSymbol || !Number.isFinite(amount) || amount <= 0) {
      throw new GoldError(`Could not read "${part}" — use SYMBOL:AMOUNT, for example XAU:2.`)
    }
    entries.push({ symbol, amount })
  }

  const priced: { symbol: string; name: string; amount: number; value: number }[] = []
  const problems: string[] = []
  for (const entry of entries) {
    try {
      const quote = await fetchQuote(entry.symbol)
      priced.push({
        symbol: quote.symbol,
        name: quote.name,
        amount: entry.amount,
        value: entry.amount * quote.price,
      })
    } catch (e) {
      problems.push(`${entry.symbol}: ${errorMessage(e)}`)
    }
  }

  if (!priced.length) {
    throw new GoldError(`No holding could be priced. ${problems.join("; ")}`)
  }

  const total = priced.reduce((sum, row) => sum + row.value, 0)
  const lines = priced.map((row) => {
    const share = total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0"
    return `${usd(row.value)} — ${row.amount} ${row.symbol} (${row.name}), ${share}% of total`
  })
  const footer = problems.length ? `\nSkipped: ${problems.join("; ")}` : ""
  return (
    `Portfolio value (${priced.length} holding${priced.length === 1 ? "" : "s"}) in USD:\n` +
    `${numbered(lines)}\nTotal: ${usd(total)}${footer}`
  )
}

/** Live ratios that traders watch between two tracked assets. */
const RATIO_PAIRS: Array<[string, string, string]> = [
  ["XAU", "XAG", "Gold/Silver"],
  ["XAU", "XPT", "Gold/Platinum"],
  ["XAU", "XPD", "Gold/Palladium"],
  ["XAU", "HG", "Gold/Copper"],
  ["BTC", "XAU", "Bitcoin/Gold"],
]

export async function metalRatios(): Promise<string> {
  const lines: string[] = []
  const problems: string[] = []
  for (const [a, b, label] of RATIO_PAIRS) {
    try {
      const [first, second] = [await fetchQuote(a), await fetchQuote(b)]
      if (second.price <= 0) throw new GoldError(`${second.symbol} has a non-positive price`)
      const ratio = first.price / second.price
      lines.push(
        `${label} ratio: ${ratio.toLocaleString("en-US", { maximumFractionDigits: 4 })}` +
        ` (${first.symbol} ${usd(first.price)} / ${second.symbol} ${usd(second.price)})`
      )
    } catch (e) {
      problems.push(`${label}: ${errorMessage(e)}`)
    }
  }
  if (!lines.length) throw new GoldError(`No ratio could be computed. ${problems.join("; ")}`)
  const footer = problems.length ? `\nUnavailable: ${problems.join("; ")}` : ""
  return `Live asset ratios (both sides quoted at the same moment):\n${numbered(lines)}${footer}`
}
// ---- batch-4 tools: bullion maths and price trend (2026-09-27) ----
/** Weights bullion is quoted in, expressed in grams. */
const GRAMS_PER: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  oz: 31.1034768, ozt: 31.1034768, ounce: 31.1034768, ounces: 31.1034768, troy_oz: 31.1034768,
  dwt: 1.55517384, pennyweight: 1.55517384, pennyweights: 1.55517384,
  tola: 11.6638038,
  grain: 0.06479891, grains: 0.06479891,
  kg: 1000, kilo: 1000, kilos: 1000, kilogram: 1000, kilograms: 1000,
  lb: 453.59237, pound: 453.59237, pounds: 453.59237,
}

function gramsOf(weight: number, unit: string): number {
  const key = String(unit ?? "g").trim().toLowerCase().replace(/\s+/g, "_")
  const factor = GRAMS_PER[key]
  if (!factor) {
    throw new GoldError(`Unknown weight unit "${unit}". Use one of: ${Object.keys(GRAMS_PER).join(", ")}.`)
  }
  return weight * factor
}

/** Karat ("24k", "18k"), a decimal ("0.999") or a fineness ("999", "99.9%") to a 0-1 factor. */
function purityFactor(purity?: string): number {
  const raw = String(purity ?? "pure").trim().toLowerCase()
  if (!raw || raw === "pure" || raw === "24k") return 1
  const karat = raw.match(/^(\d{1,2}(?:\.\d+)?)\s*k(?:t|arat)?$/)
  if (karat) {
    const k = Number(karat[1])
    if (!Number.isFinite(k) || k <= 0 || k > 24) throw new GoldError(`Karat must be between 1 and 24, got "${purity}".`)
    return k / 24
  }
  const plain = raw.replace(/[^0-9.]/g, "")
  const n = Number(plain)
  if (!Number.isFinite(n) || n <= 0) throw new GoldError(`Could not read purity "${purity}". Use 24k, 18k, 0.999 or 999.`)
  if (n <= 1) return n
  if (n <= 100) return n / 100
  if (n <= 1000) return n / 1000
  throw new GoldError(`Purity "${purity}" is out of range.`)
}

function metalArg(metal?: string): string {
  return normalizeSymbol(String(metal ?? "XAU"))
}

export interface MeltArgs {
  weight: number
  unit?: string
  metal?: string
  purity?: string
}

export async function meltValue(args: MeltArgs): Promise<string> {
  const weight = Number(args?.weight)
  if (!Number.isFinite(weight) || weight <= 0) throw new GoldError("weight must be a positive number.")
  const unit = String(args?.unit ?? "g")
  const factor = purityFactor(args?.purity)
  const symbol = metalArg(args?.metal)
  const grams = gramsOf(weight, unit)
  const fineGrams = grams * factor
  const quote = await fetchQuote(symbol)
  const perGram = quote.price / 31.1034768
  const value = fineGrams * perGram
  return [
    `${quote.name} (${quote.symbol}) melt value`,
    "",
    `  weight        ${weight} ${unit} = ${grams.toFixed(3)} g`,
    `  purity        ${(factor * 100).toFixed(2)}% fine`,
    `  fine metal    ${fineGrams.toFixed(3)} g`,
    `  spot          ${usd(quote.price)} per troy ounce (${usd(perGram)} per gram)`,
    `  melt value    ${usd(value)}`,
    "",
    `Source: ${quote.source} | Updated: ${quote.updated}`,
    "Melt value is metal content only - it ignores fabrication, brand and collector premiums.",
  ].join("\n")
}

export interface PremiumArgs extends MeltArgs {
  paid: number
  quantity?: number
  label?: string
}

export async function premiumCheck(args: PremiumArgs): Promise<string> {
  const weight = Number(args?.weight)
  if (!Number.isFinite(weight) || weight <= 0) throw new GoldError("weight must be a positive number.")
  const paid = Number(args?.paid)
  if (!Number.isFinite(paid) || paid <= 0) throw new GoldError("paid must be the positive total you paid, in USD.")
  const quantity = Math.min(Math.max(Math.round(Number(args?.quantity ?? 1)) || 1, 1), 10000)
  const factor = purityFactor(args?.purity)
  const symbol = metalArg(args?.metal)
  const grams = gramsOf(weight, String(args?.unit ?? "g")) * quantity
  const fineGrams = grams * factor
  const quote = await fetchQuote(symbol)
  const melt = (fineGrams / 31.1034768) * quote.price
  const premium = paid - melt
  const premiumPct = (premium / melt) * 100
  const grade =
    premiumPct <= 0 ? "at or below melt - unusual for retail, check the weight and purity"
      : premiumPct < 10 ? "thin premium"
      : premiumPct < 30 ? "normal retail premium for bullion"
      : premiumPct < 75 ? "high premium - typical of coins, small bars and jewellery"
      : "very high premium - collectible or fabrication-heavy, not a metal play"
  return [
    `Premium check${args?.label ? `: ${args.label}` : ""}, ${quantity} item(s)`,
    "",
    `  weight        ${weight} ${String(args?.unit ?? "g")} each = ${grams.toFixed(3)} g total`,
    `  purity        ${(factor * 100).toFixed(2)}% fine -> ${fineGrams.toFixed(3)} g fine metal`,
    `  melt value    ${usd(melt)} at ${usd(quote.price)}/ozt`,
    `  paid          ${usd(paid)} (${usd(paid / quantity)} per item)`,
    `  premium       ${premium >= 0 ? "+" : ""}${usd(premium)} (${premiumPct >= 0 ? "+" : ""}${premiumPct.toFixed(1)}% over melt)`,
    "",
    `Reading: ${grade}.`,
    `Source: ${quote.source} | Updated: ${quote.updated}`,
  ].join("\n")
}

const TREND_RANGES: Record<string, string> = {
  "5d": "5d", "1w": "5d", "1mo": "1mo", "1m": "1mo", "30d": "1mo",
  "3mo": "3mo", "3m": "3mo", "90d": "3mo", "6mo": "6mo", "6m": "6mo",
  "1y": "1y", "12mo": "1y", ytd: "ytd",
}

export async function priceTrend(args: { metal?: string; range?: string }): Promise<string> {
  const symbol = metalArg(args?.metal)
  const ticker = YAHOO_SYMBOLS[symbol]
  if (!ticker) {
    throw new GoldError(
      `${symbol} has no daily chart on Yahoo Finance. Trends are available for ${Object.keys(YAHOO_SYMBOLS).join(", ")}.`
    )
  }
  const key = String(args?.range ?? "1mo").trim().toLowerCase()
  const range = TREND_RANGES[key]
  if (!range) {
    throw new GoldError(`Range "${args?.range}" is not supported. Use one of: ${[...new Set(Object.values(TREND_RANGES))].join(", ")}.`)
  }
  let res: Response
  try {
    res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=1d`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new GoldError(`Yahoo Finance network error: ${errorMessage(e)}`)
  }
  if (res.status === 429) throw new GoldError("Yahoo Finance rate limit hit, wait and retry")
  if (!res.ok) throw new GoldError(`Yahoo Finance error ${res.status}`)
  const data = (await res.json()) as {
    chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null> }> } }> }
  }
  const result = data.chart?.result?.[0]
  const quote = result?.indicators?.quote?.[0]
  const stamps = result?.timestamp ?? []
  const closes = (quote?.close ?? []).map((c, i) => ({ at: stamps[i], close: c }))
    .filter((row): row is { at: number; close: number } => typeof row.close === "number" && typeof row.at === "number")
  if (!closes.length) throw new GoldError(`Yahoo Finance returned no daily closes for ${ticker}.`)
  const highs = (quote?.high ?? []).filter((v): v is number => typeof v === "number")
  const lows = (quote?.low ?? []).filter((v): v is number => typeof v === "number")
  const first = closes[0]
  const last = closes[closes.length - 1]
  const change = last.close - first.close
  const changePct = (change / first.close) * 100
  const tail = closes.slice(-10).map((row) => `  ${new Date(row.at * 1000).toISOString().slice(0, 10)}  ${usd(row.close)}`)
  return [
    `${PRECIOUS[symbol] ?? symbol} (${symbol}) daily closes over ${range} via Yahoo Finance ${ticker}`,
    "",
    `  first   ${usd(first.close)} on ${new Date(first.at * 1000).toISOString().slice(0, 10)}`,
    `  last    ${usd(last.close)} on ${new Date(last.at * 1000).toISOString().slice(0, 10)}`,
    `  change  ${change >= 0 ? "+" : "-"}${usd(Math.abs(change))} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`,
    highs.length ? `  range   ${usd(Math.min(...lows))} low to ${usd(Math.max(...highs))} high` : "",
    `  samples ${closes.length} daily close(s)`,
    "",
    "Last closes:",
    ...tail,
    "",
    "Futures prices track spot but settle separately, so they differ slightly from the price tool.",
  ].filter((line) => line !== "").join("\n")
}

// ---- muxG tools:
const CG_PRICE = "https://api.coingecko.com/api/v3/simple/price"
const CG_COIN = "https://api.coingecko.com/api/v3/coins"

const METAL_TOKENS: Array<{ id: string; ticker: string; metal: string; label: string }> = [
  { id: "pax-gold", ticker: "PAXG", metal: "XAU", label: "PAX Gold" },
  { id: "tether-gold", ticker: "XAUT", metal: "XAU", label: "Tether Gold" },
]

const FUTURES: Array<{ yahoo: string; metal: string; label: string; unit: string }> = [
  { yahoo: "GC=F", metal: "XAU", label: "Gold", unit: "troy ounce" },
  { yahoo: "SI=F", metal: "XAG", label: "Silver", unit: "troy ounce" },
  { yahoo: "PL=F", metal: "XPT", label: "Platinum", unit: "troy ounce" },
  { yahoo: "PA=F", metal: "XPD", label: "Palladium", unit: "troy ounce" },
  { yahoo: "HG=F", metal: "HG", label: "Copper", unit: "pound" },
]

const money = (value: number | null | undefined, digits = 2): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `$${value.toLocaleString("en-US", { maximumFractionDigits: digits })}`
    : "not reported"

const pct = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "not reported"

async function cgJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new GoldError("CoinGecko rate limit hit, wait and retry.")
  if (!res.ok) throw new GoldError(`CoinGecko returned ${res.status}`)
  const body = await res.text()
  if (!body.trim()) throw new GoldError("CoinGecko returned an empty body.")
  return JSON.parse(body) as T
}

/**
 * Tokens that claim to be one metal bar each, priced against the metal they
 * track, so a premium or discount to the underlying is visible.
 */
export async function tokenisedMetal(args: { metal?: string }): Promise<string> {
  const wanted = normalizeSymbol(args.metal ?? "XAU")
  const tracked = METAL_TOKENS.filter((t) => t.metal === wanted)
  if (!tracked.length) {
    return `Only ${Array.from(new Set(METAL_TOKENS.map((t) => t.metal))).join(" and ")} have metal-backed tokens in this list.`
  }

  const ids = tracked.map((t) => t.id).join(",")
  const simple = await cgJson<Record<string, { usd?: number; usd_24h_change?: number; usd_market_cap?: number }>>(
    `${CG_PRICE}?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
  )

  let spot: { price?: number; updatedAt?: string } | null = null
  try {
    spot = await getJson<{ price?: number; updatedAt?: string }>(`/price/${encodeURIComponent(wanted)}`)
  } catch (e) {
    spot = null
    void e
  }
  const spotPrice = typeof spot?.price === "number" ? spot.price : null
  const lines = [
    `Metal-backed tokens against ${wanted} spot${spotPrice !== null ? ` at ${money(spotPrice)}` : " (spot unavailable)"}`,
  ]

  for (const token of tracked) {
    const row = simple[token.id]
    const price = typeof row?.usd === "number" ? row.usd : null
    if (price === null) {
      lines.push(`  ${token.label} (${token.ticker}): CoinGecko reported no USD price`)
      continue
    }
    const cap = typeof row?.usd_market_cap === "number" ? `$${(row.usd_market_cap / 1e6).toFixed(0)}M` : "not reported"
    lines.push(`  ${token.label} (${token.ticker}): ${money(price)} · 24h ${pct(row?.usd_24h_change)} · market cap ${cap}`)
    if (spotPrice) {
      const gap = ((price - spotPrice) / spotPrice) * 100
      const perGram = price / 31.1034768
      lines.push(
        `     against ${wanted} spot: ${gap >= 0 ? "+" : ""}${gap.toFixed(2)}% · ${money(perGram, 2)} per gram (one token claims one troy ounce)`,
      )
    }
  }
  return lines.join("\n")
}

/** Front-month futures against spot, which is how contango and backwardation show up. */
export async function futuresCurve(args: { metals?: string; limit?: number }): Promise<string> {
  const asked = String(args.metals ?? "")
    .split(/[,\s]+/)
    .map((m) => normalizeSymbol(m))
    .filter(Boolean)
  const rows = asked.length ? FUTURES.filter((f) => asked.includes(f.metal)) : FUTURES
  if (!rows.length) {
    return `Futures are tracked for ${FUTURES.map((f) => f.metal).join(", ")}; "${args.metals}" matched none.`
  }
  const n = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), FUTURES.length)

  const lines = ["Front-month metals futures against spot — a positive basis is contango, a negative one backwardation."]
  for (const row of rows.slice(0, n)) {
    let future: { price?: number; name?: string; previousClose?: number } | null = null
    try {
      const data = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(row.yahoo)}?range=1d&interval=1d`,
        { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) },
      )
      if (data.ok) {
        const body = (await data.json()) as { chart?: { result?: Array<{ meta?: Record<string, unknown> }> | null } }
        const meta = body.chart?.result?.[0]?.meta
        if (meta) {
          future = {
            price: typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : undefined,
            name: typeof meta.shortName === "string" ? meta.shortName : undefined,
            previousClose: typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : undefined,
          }
        }
      }
    } catch {
      future = null
    }
    if (!future || typeof future.price !== "number") {
      lines.push(`  ${row.label} (${row.metal}, ${row.yahoo}): futures quote unavailable`)
      continue
    }
    let spotText = "spot not available"
    let basis = "not reported"
    try {
      const spot = await getJson<{ price?: number }>(`/price/${encodeURIComponent(row.metal)}`)
      if (typeof spot.price === "number" && spot.price !== 0) {
        const gap = ((future.price - spot.price) / spot.price) * 100
        spotText = `spot ${money(spot.price)} per ${row.unit}`
        basis = `${gap >= 0 ? "+" : ""}${gap.toFixed(2)}%`
      }
    } catch {
      spotText = "spot not available"
    }
    lines.push(`  ${row.label} (${row.metal}): ${future.name ?? row.yahoo} at ${money(future.price)} per ${row.unit} vs ${spotText} — basis ${basis}`)
    if (typeof future.previousClose === "number") {
      const day = ((future.price - future.previousClose) / future.previousClose) * 100
      lines.push(`     previous close ${money(future.previousClose)} (${pct(day)} on the day)`)
    }
  }
  return lines.join("\n")
}
