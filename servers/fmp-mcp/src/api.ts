/**
 * Financial Modeling Prep API client. Needs FMP_API_KEY
 * (free at https://site.financialmodelingprep.com/developer/docs).
 * Docs: https://site.financialmodelingprep.com/developer/docs
 */
const BASE = "https://financialmodelingprep.com/stable"

export class FmpError extends Error {}

function apiKey(): string {
  const k = process.env.FMP_API_KEY
  if (!k) throw new FmpError("Set FMP_API_KEY first (free at site.financialmodelingprep.com).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...extra, apikey: apiKey() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "fmp-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new FmpError("FMP refused (401/403). Check FMP_API_KEY and plan limits.")
  if (res.status === 429) throw new FmpError("FMP rate limit hit; wait and retry.")
  if (!res.ok) throw new FmpError(`FMP error ${res.status}`)
  return (await res.json()) as T
}

export async function stockQuote(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new FmpError("Symbol is empty.")
  const rows = await getJson<Raw[]>(`/quote?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`)
  const q = rows[0]
  if (!q) throw new FmpError(`No quote for ${symbol.trim().toUpperCase()}.`)
  return [
    `${q.symbol} — $${q.price ?? "?"}`,
    `${q.name ?? ""}${q.exchange ? ` (${q.exchange})` : ""}`,
    `Change: ${q.change ?? "?"} (${q.changesPercentage ?? "?"}%) · Day range ${q.dayLow ?? "?"}-${q.dayHigh ?? "?"} · Mkt cap $${Number(q.marketCap ?? 0).toLocaleString()}`,
  ].filter(Boolean).join("\n")
}

export async function companyProfile(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new FmpError("Symbol is empty.")
  const rows = await getJson<Raw[]>(`/profile?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`)
  const c = rows[0]
  if (!c) throw new FmpError(`No profile for ${symbol.trim().toUpperCase()}.`)
  return [
    `${c.companyName ?? symbol.trim().toUpperCase()} (${c.symbol ?? "?"})`,
    c.industry ? `${c.industry} · ${c.sector ?? ""}`.trim() : "",
    c.ceo ? `CEO: ${c.ceo}` : "",
    c.website ? `${c.website}` : "",
    c.description ? `${String(c.description).slice(0, 300)}` : "",
  ].filter(Boolean).join("\n")
}

export async function incomeStatement(symbol: string, limit = 4): Promise<string> {
  if (!symbol.trim()) throw new FmpError("Symbol is empty.")
  const rows = await getJson<Raw[]>(`/income-statement?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}&limit=${Math.min(Math.max(limit, 1), 10)}`)
  if (rows.length === 0) return `No financials for ${symbol.trim().toUpperCase()}.`
  return rows.map((r) => {
    const rev = Number(r.revenue ?? 0)
    const net = Number(r.netIncome ?? 0)
    return `${String(r.fiscalYear ?? r.date ?? "?").slice(0, 10)}: revenue $${(rev / 1e9).toFixed(2)}B, net $${(net / 1e9).toFixed(2)}B`
  }).join("\n")
}

// ---- muxG tools:
const FX_BASE = "https://api.frankfurter.app"
const YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart"

const FX_CODES = new Set([
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF",
  "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN",
  "RON", "RUB", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
])

const RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "ytd", "max"]
const INTERVALS = ["1m", "5m", "15m", "30m", "60m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "fmp-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new FmpError(`Nothing at ${url}`)
  if (res.status === 429) throw new FmpError("Rate limited by the upstream service; wait and retry.")
  if (!res.ok) throw new FmpError(`Upstream service returned ${res.status}`)
  const body = await res.text()
  if (!body.trim()) throw new FmpError("Upstream service returned an empty body.")
  return JSON.parse(body) as T
}

export interface FxRatesArgs {
  base: string
  symbols: string[]
}

export async function currencyRates(args: FxRatesArgs): Promise<string> {
  const base = (args.base || "USD").trim().toUpperCase()
  if (!FX_CODES.has(base)) throw new FmpError(`${base} is not an ECB reference currency.`)
  const wanted = (args.symbols ?? []).map((s) => String(s).trim().toUpperCase()).filter(Boolean)
  if (!wanted.length) throw new FmpError("Pass at least one currency code, for example EUR and JPY.")
  const codes = Array.from(new Set(wanted)).slice(0, 10)
  const bad = codes.filter((c) => !FX_CODES.has(c))
  if (bad.length) throw new FmpError(`Not ECB reference currencies: ${bad.join(", ")}`)

  const data = await fetchJson<{ amount: number; base: string; date: string; rates: Raw }>(
    `${FX_BASE}/latest?base=${encodeURIComponent(base)}&symbols=${codes.join(",")}`,
  )
  if (!data?.rates || typeof data.rates !== "object") throw new FmpError("The rate service returned no rates object.")
  const lines = [`1 ${data.base ?? base} in ${codes.length} currenc${codes.length === 1 ? "y" : "ies"} — ECB reference rate, ${data.date ?? "date not reported"}`]
  for (const code of codes) {
    const rate = data.rates[code]
    if (typeof rate !== "number") {
      lines.push(`  ${code}: not reported`)
      continue
    }
    const inverse = 1 / rate
    lines.push(`  1 ${data.base ?? base} = ${rate} ${code}   (1 ${code} = ${inverse.toFixed(4)} ${data.base ?? base})`)
  }
  return lines.join("\n")
}

export interface FxHistoryArgs {
  pair: string
  start: string
  end: string
  limit: number
}

export async function fxHistory(args: FxHistoryArgs): Promise<string> {
  const pair = (args.pair || "EURUSD").trim().toUpperCase()
  if (!/^[A-Z]{6}$/.test(pair)) throw new FmpError("Pair must be two 3-letter currency codes, for example EURUSD.")
  const from = pair.slice(0, 3)
  const to = pair.slice(3)
  if (!FX_CODES.has(from) || !FX_CODES.has(to)) throw new FmpError(`${pair} is not a pair of ECB reference currencies.`)
  const iso = /^\d{4}-\d{2}-\d{2}$/
  if (!iso.test(args.start ?? "") || !iso.test(args.end ?? "")) throw new FmpError("Start and end must be YYYY-MM-DD dates.")
  if (args.start >= args.end) throw new FmpError("Start must be before end.")

  const data = await fetchJson<{ start_date: string; end_date: string; rates: Record<string, Raw> }>(
    `${FX_BASE}/${encodeURIComponent(args.start)}..${encodeURIComponent(args.end)}?base=${from}&symbols=${to}`,
  )
  const series = data?.rates ?? {}
  const days = Object.keys(series).sort()
  if (!days.length) throw new FmpError(`No ${pair} rates published for ${args.start} to ${args.end}.`)

  const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 10) || 10, 30))
  const shown = days.slice(-limit)
  const lines = [`${from} to ${to}, ${data.start_date ?? args.start} to ${data.end_date ?? args.end} — ${days.length} rate day${days.length === 1 ? "" : "s"} published, showing the last ${shown.length}`]
  let first: number | null = null
  let last = 0
  let high = -Infinity
  let low = Infinity
  for (const day of days) {
    const value = series[day]?.[to]
    if (typeof value !== "number") continue
    if (first === null) first = value
    last = value
    if (value > high) high = value
    if (value < low) low = value
  }
  for (const day of shown) {
    const value = series[day]?.[to]
    lines.push(`  ${day}: ${typeof value === "number" ? value : "not reported"}`)
  }
  if (first !== null && days.length > 1) {
    const pct = ((last - first) / first) * 100
    lines.push("")
    lines.push(`Period: ${first} → ${last} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%) · high ${high} · low ${low}`)
  }
  return lines.join("\n")
}

export interface PriceHistoryArgs {
  symbol: string
  range: string
  interval: string
  limit: number
}

export async function priceHistory(args: PriceHistoryArgs): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!/^[A-Z0-9.\-]{1,15}$/.test(symbol)) throw new FmpError("Symbol must be a ticker such as AAPL or BRK-B.")
  const range = RANGES.includes(args.range ?? "") ? (args.range as string) : "1mo"
  const interval = INTERVALS.includes(args.interval ?? "") ? (args.interval as string) : "1d"
  const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 10) || 10, 30))

  const data = await fetchJson<{ chart: { result: Raw[] | null; error: Raw | null } }>(
    `${YF_CHART}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
  )
  if (data?.chart?.error) throw new FmpError(`Chart service refused ${symbol}: ${data.chart.error.description ?? data.chart.error.code ?? "unknown reason"}`)
  const result = data?.chart?.result?.[0]
  if (!result) throw new FmpError(`No price history for ${symbol}.`)
  const meta = (result.meta ?? {}) as Raw
  const stamps: number[] = Array.isArray(result.timestamp) ? result.timestamp : []
  const quote = (result.indicators?.quote?.[0] ?? {}) as Raw
  if (!stamps.length) throw new FmpError(`No price history for ${symbol} over ${range}.`)

  const rows: string[] = []
  for (let i = Math.max(0, stamps.length - limit); i < stamps.length; i += 1) {
    const open = quote.open?.[i]
    const high = quote.high?.[i]
    const low = quote.low?.[i]
    const close = quote.close?.[i]
    const volume = quote.volume?.[i]
    const when = new Date(stamps[i] * 1000).toISOString().slice(0, 16).replace("T", " ")
    const num = (v: unknown, digits = 2) => (typeof v === "number" ? v.toFixed(digits) : "not reported")
    rows.push(`  ${when} UTC  O ${num(open)}  H ${num(high)}  L ${num(low)}  C ${num(close)}  vol ${typeof volume === "number" ? volume.toLocaleString() : "not reported"}`)
  }

  const price = typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : null
  const high52 = typeof meta.fiftyTwoWeekHigh === "number" ? meta.fiftyTwoWeekHigh : null
  const low52 = typeof meta.fiftyTwoWeekLow === "number" ? meta.fiftyTwoWeekLow : null
  return [
    `${meta.longName ?? meta.shortName ?? symbol} (${meta.symbol ?? symbol}) — ${meta.fullExchangeName ?? meta.exchangeName ?? "exchange not reported"}`,
    `${meta.instrumentType ?? "type not reported"} in ${meta.currency ?? "currency not reported"} · range ${range} · interval ${interval} · ${stamps.length} bar${stamps.length === 1 ? "" : "s"}, showing the last ${rows.length}`,
    typeof price === "number" ? `Last price: ${price}${high52 !== null && low52 !== null ? ` · 52-week range ${low52} - ${high52}` : ""}` : "Last price: not reported",
    ...rows,
  ].join("\n")
}
