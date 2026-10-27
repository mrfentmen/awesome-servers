/**
 * Alpha Vantage API client. Needs ALPHAVANTAGE_API_KEY
 * (free at https://www.alphavantage.co/support/#api-key, rate-limited tier).
 * Docs: https://www.alphavantage.co/documentation/
 */
const BASE = "https://www.alphavantage.co/query"

export class AlphaVantageError extends Error {}

function apiKey(): string {
  const k = process.env.ALPHAVANTAGE_API_KEY
  if (!k) throw new AlphaVantageError("Set ALPHAVANTAGE_API_KEY first (free at alphavantage.co/support/#api-key).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson(params: Record<string, string>): Promise<Raw> {
  const qs = new URLSearchParams({ ...params, apikey: apiKey() }).toString()
  const res = await fetch(`${BASE}?${qs}`, {
    headers: { "User-Agent": "alphavantage-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new AlphaVantageError(`Alpha Vantage error ${res.status}`)
  const data = (await res.json()) as Raw
  if (data.Note) throw new AlphaVantageError("Alpha Vantage rate limit hit (free tier is 25/day). Try later.")
  if (data["Error Message"]) throw new AlphaVantageError(`Alpha Vantage: ${String(data["Error Message"]).slice(0, 160)}`)
  return data
}

export async function stockQuote(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new AlphaVantageError("Symbol is empty.")
  const data = await getJson({ function: "GLOBAL_QUOTE", symbol: symbol.trim().toUpperCase() })
  const q: Raw = data["Global Quote"] ?? {}
  if (!q["05. price"]) throw new AlphaVantageError(`No quote for ${symbol.trim().toUpperCase()}.`)
  return [
    `${symbol.trim().toUpperCase()} — $${q["05. price"]}`,
    `Open ${q["02. open"] ?? "?"} · High ${q["03. high"] ?? "?"} · Low ${q["04. low"] ?? "?"}`,
    `Change: ${q["09. change"] ?? "?"} (${q["10. change percent"] ?? "?"})`,
    `Volume: ${Number(q["06. volume"] ?? 0).toLocaleString()} · Trading day: ${q["07. latest trading day"] ?? "?"}`,
  ].join("\n")
}

export async function fxRate(from: string, to: string): Promise<string> {
  if (!from.trim() || !to.trim()) throw new AlphaVantageError("Currencies are empty.")
  const data = await getJson({ function: "CURRENCY_EXCHANGE_RATE", from_currency: from.trim().toUpperCase(), to_currency: to.trim().toUpperCase() })
  const r: Raw = data["Realtime Currency Exchange Rate"] ?? {}
  if (!r["5. Exchange Rate"]) throw new AlphaVantageError(`No rate for ${from}/${to}.`)
  return `1 ${from.trim().toUpperCase()} = ${r["5. Exchange Rate"]} ${to.trim().toUpperCase()} (as of ${r["6. Last Refreshed"] ?? "?"})`
}

export async function cryptoPrice(symbol: string, market = "USD"): Promise<string> {
  if (!symbol.trim()) throw new AlphaVantageError("Symbol is empty.")
  const data = await getJson({ function: "CURRENCY_EXCHANGE_RATE", from_currency: symbol.trim().toUpperCase(), to_currency: market.trim().toUpperCase() })
  const r: Raw = data["Realtime Currency Exchange Rate"] ?? {}
  if (!r["5. Exchange Rate"]) throw new AlphaVantageError(`No price for ${symbol}.`)
  return `${symbol.trim().toUpperCase()}/${market.trim().toUpperCase()}: ${r["5. Exchange Rate"]}`
}

export async function symbolSearch(keywords: string): Promise<string[]> {
  if (!keywords.trim()) throw new AlphaVantageError("Keywords are empty.")
  const data = await getJson({ function: "SYMBOL_SEARCH", keywords: keywords.trim() })
  const rows: Raw[] = Array.isArray(data.bestMatches) ? data.bestMatches : []
  return rows.slice(0, 8).map((m) => `${m["1. symbol"]} — ${m["2. name"]} (${m["3. type"]}, ${m["4. region"]})`)
}
