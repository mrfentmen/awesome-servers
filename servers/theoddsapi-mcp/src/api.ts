/**
 * The Odds API v4 client. Needs THEODDS_API_KEY
 * (free at https://the-odds-api.com/, 500 calls/month).
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */
const BASE = "https://api.the-odds-api.com/v4"

export class OddsError extends Error {}

function apiKey(): string {
  const k = process.env.THEODDS_API_KEY
  if (!k) throw new OddsError("Set THEODDS_API_KEY first (free at the-odds-api.com).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...extra, apiKey: apiKey() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "theoddsapi-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new OddsError("Odds API refused (401/403). Check API key.")
  if (res.status === 422) throw new OddsError("Odds API: bad request (check sport key). Quota info in x-requests headers.")
  if (!res.ok) throw new OddsError(`Odds API error ${res.status}`)
  return (await res.json()) as T
}

export interface Sport {
  key: string
  title?: string
  group?: string
}

export async function listSports(): Promise<Sport[]> {
  const rows = await getJson<Raw[]>("/sports")
  return rows.slice(0, 40).map((s) => ({ key: String(s.key), title: s.title, group: s.group }))
}

export interface GameOdds {
  home?: string
  away?: string
  start?: string
  books: string[]
}

export async function gameOdds(sport: string, limit = 5): Promise<GameOdds[]> {
  if (!sport.trim()) throw new OddsError("Sport key is empty (use list_sports).")
  const rows = await getJson<Raw[]>(`/sports/${encodeURIComponent(sport.trim())}/odds?regions=us&markets=h2h&oddsFormat=decimal`)
  return rows.slice(0, limit).map((g) => {
    const books: Raw[] = Array.isArray(g.bookmakers) ? g.bookmakers : []
    return {
      home: g.home_team,
      away: g.away_team,
      start: g.commence_time ? String(g.commence_time).slice(0, 16).replace("T", " ") : undefined,
      books: books.slice(0, 5).map((b) => {
        const mkts: Raw[] = Array.isArray(b.markets) ? b.markets : []
        const outs: Raw[] = Array.isArray(mkts[0]?.outcomes) ? mkts[0].outcomes : []
        const prices = outs.map((o) => `${o.name ?? "?"} ${o.price ?? "?"}`).join(", ")
        return `${b.title ?? b.key ?? "?"}: ${prices || "no lines"}`;
      }),
    }
  })
}

export function formatGame(g: GameOdds, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${g.away ?? "?"} at ${g.home ?? "?"}${g.start ? ` — ${g.start}` : ""}`,
    ...g.books.map((b) => `   ${b}`),
  ]
  return lines.join("\n")
}
