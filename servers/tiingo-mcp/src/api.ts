/**
 * Tiingo API client. Needs TIINGO_API_TOKEN (free at https://www.tiingo.com/).
 * Docs: https://www.tiingo.com/documentation/
 */
const BASE = "https://api.tiingo.com"

export class TiingoError extends Error {}

function headers(): Record<string, string> {
  const token = process.env.TIINGO_API_TOKEN
  if (!token) throw new TiingoError("Set TIINGO_API_TOKEN first (free at tiingo.com).")
  return { "User-Agent": "tiingo-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", Authorization: `Token ${token}` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new TiingoError("Tiingo refused (401/403). Check API token.")
  if (res.status === 404) throw new TiingoError("Not found.")
  if (!res.ok) throw new TiingoError(`Tiingo error ${res.status}`)
  return (await res.json()) as T
}

export async function stockMeta(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new TiingoError("Symbol is empty.")
  const m = await getJson<Raw>(`/tiingo/daily/${encodeURIComponent(symbol.trim().toUpperCase())}`)
  return [
    `${m.ticker ?? symbol.trim().toUpperCase()} — ${m.name ?? "(unnamed)"}`,
    m.exchangeCode ? `Exchange: ${m.exchangeCode}` : "",
    m.startDate || m.endDate ? `Data: ${String(m.startDate ?? "?").slice(0, 10)} to ${String(m.endDate ?? "?").slice(0, 10)}` : "",
  ].filter(Boolean).join("\n")
}

export async function stockPrices(symbol: string, days = 5): Promise<string> {
  if (!symbol.trim()) throw new TiingoError("Symbol is empty.")
  const rows = await getJson<Raw[]>(`/tiingo/daily/${encodeURIComponent(symbol.trim().toUpperCase())}/prices?resampleFreq=daily`)
  const last = rows.slice(-Math.min(Math.max(days, 1), 30)).reverse()
  if (last.length === 0) return `No prices for ${symbol.trim().toUpperCase()}.`
  return last.map((p) => `${String(p.date).slice(0, 10)}: close $${p.close} (o ${p.open} h ${p.high} l ${p.low} v ${Number(p.volume ?? 0).toLocaleString()})`).join("\n")
}

export async function cryptoMeta(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new TiingoError("Symbol is empty.")
  const rows = await getJson<Raw[]>("/tiingo/crypto?tickers=" + encodeURIComponent(symbol.trim().toLowerCase()))
  const c = rows[0]
  if (!c) throw new TiingoError(`No crypto ${symbol.trim()}.`)
  return `${c.ticker?.toUpperCase() ?? symbol.trim().toUpperCase()} — ${c.name ?? "(unnamed)"}`
}
