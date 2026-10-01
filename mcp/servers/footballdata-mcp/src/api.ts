/**
 * football-data.org API v4 client. Needs FOOTBALLDATA_API_KEY
 * (free at https://www.football-data.org/client/register).
 * Docs: https://www.football-data.org/documentation/quickstart
 */
const BASE = "https://api.football-data.org/v4"

export class FootballDataError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.FOOTBALLDATA_API_KEY
  if (!key) throw new FootballDataError("Set FOOTBALLDATA_API_KEY first (free at football-data.org/client/register).")
  return { "User-Agent": "footballdata-mcp/1.0", Accept: "application/json", "X-Auth-Token": key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 400 && (await res.clone().text()).includes("API_TOKEN")) {
    throw new FootballDataError("football-data.org refused: bad or missing token.")
  }
  if (res.status === 403) throw new FootballDataError("Plan limit: this endpoint needs a paid tier.")
  if (res.status === 404) throw new FootballDataError("Not found.")
  if (res.status === 429) throw new FootballDataError("Rate limit hit (free tier is 10/min). Wait and retry.")
  if (!res.ok) throw new FootballDataError(`football-data.org error ${res.status}`)
  return (await res.json()) as T
}

export interface Competition {
  id: number
  name?: string
  code?: string
  area?: string
}

export async function listCompetitions(): Promise<Competition[]> {
  const data = await getJson<Raw>("/competitions")
  const rows: Raw[] = Array.isArray(data.competitions) ? data.competitions : []
  return rows.map((c) => ({ id: Number(c.id), name: c.name, code: c.code, area: c.area?.name }))
}

const score = (m: Raw): string => {
  const ft = m.score?.fullTime
  if (ft && (ft.home !== null || ft.away !== null)) return `${ft.home ?? "?"}-${ft.away ?? "?"} FT`;
  const ht = m.score?.halfTime
  if (ht && (ht.home !== null || ht.away !== null)) return `${ht.home ?? "?"}-${ht.away ?? "?"} HT`;
  return m.status ?? "?";
};

export async function teamMatches(teamId: string, limit = 5): Promise<string[]> {
  if (!/^\d+$/.test(teamId.trim())) throw new FootballDataError(`Team id must be numeric, got "${teamId}".`)
  const data = await getJson<Raw>(`/teams/${teamId.trim()}/matches?limit=${Math.min(Math.max(limit, 1), 20)}`)
  const rows: Raw[] = Array.isArray(data.matches) ? data.matches : []
  return rows.slice(0, limit).map((m) => {
    const comp = (m.competition ?? {}) as Raw
    return `${String(m.utcDate ?? "?").slice(0, 10)} — ${m.homeTeam?.shortName ?? m.homeTeam?.name ?? "?"} vs ${m.awayTeam?.shortName ?? m.awayTeam?.name ?? "?"}: ${score(m)} [${comp.code ?? comp.name ?? "?"}]`
  })
}

export function formatCompetition(c: Competition, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${c.id}] ${c.name ?? "(unnamed)"}${c.code ? ` (${c.code})` : ""}${c.area ? ` — ${c.area}` : ""}`
}
