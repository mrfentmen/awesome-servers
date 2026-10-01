/**
 * Finnhub API client. Needs FINNHUB_API_KEY (free at https://finnhub.io/).
 * Docs: https://finnhub.io/docs/api
 */
const BASE = "https://finnhub.io/api/v1"

export class FinnhubError extends Error {}

function apiKey(): string {
  const k = process.env.FINNHUB_API_KEY
  if (!k) throw new FinnhubError("Set FINNHUB_API_KEY first (free at finnhub.io).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${BASE}${path}${sep}token=${encodeURIComponent(apiKey())}`, {
    headers: { "User-Agent": "finnhub-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new FinnhubError("Finnhub refused (401/403). Check API key and plan.")
  if (res.status === 429) throw new FinnhubError("Finnhub rate limit hit (free tier is 60/min). Wait and retry.")
  if (!res.ok) throw new FinnhubError(`Finnhub error ${res.status}`)
  return (await res.json()) as T
}

export async function stockQuote(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new FinnhubError("Symbol is empty.")
  const q = await getJson<Raw>(`/quote?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`)
  if (q.c === undefined) throw new FinnhubError(`No quote for ${symbol.trim().toUpperCase()}.`)
  const chg = Number(q.d ?? 0)
  return [
    `${symbol.trim().toUpperCase()} — $${q.c}`,
    `Prev close $${q.pc ?? "?"} · Change ${chg >= 0 ? "+" : ""}${chg} (${q.dp ?? "?"}%)`,
    `Day high $${q.h ?? "?"} · low $${q.l ?? "?"} · open $${q.o ?? "?"}`,
  ].join("\n")
}

export async function companyNews(symbol: string, days = 7): Promise<string[]> {
  if (!symbol.trim()) throw new FinnhubError("Symbol is empty.")
  const to = new Date()
  const from = new Date(Date.now() - Math.min(Math.max(days, 1), 365) * 86400000)
  const fmt = (d: Date): string => d.toISOString().slice(0, 10)
  const rows = await getJson<Raw[]>(`/company-news?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}&from=${fmt(from)}&to=${fmt(to)}`)
  return rows.slice(0, 8).map((n) => `${String(n.datetime ? new Date(Number(n.datetime) * 1000).toISOString().slice(0, 10) : "?")} — ${String(n.headline ?? "(untitled)").slice(0, 120)} (${String(n.source ?? "?")})${n.url ? `\n   ${n.url}` : ""}`)
}

export async function earningsCalendar(days = 14): Promise<string[]> {
  const to = new Date(Date.now() + Math.min(Math.max(days, 1), 365) * 86400000)
  const fmt = (d: Date): string => d.toISOString().slice(0, 10)
  const data = await getJson<Raw>(`/calendar/earnings?from=${fmt(new Date())}&to=${fmt(to)}`)
  const rows: Raw[] = Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
  return rows.slice(0, 15).map((e) => `${String(e.date ?? "?").slice(0, 10)} — ${String(e.symbol ?? "?")} (${String(e.hour ?? "?")}): EPS est $${e.epsEstimate ?? "?"}`)
}
