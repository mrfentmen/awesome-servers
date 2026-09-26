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
