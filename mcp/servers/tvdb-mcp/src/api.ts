/**
 * TheTVDB API v4 client. Needs TVDB_API_KEY
 * (free at https://thetvdb.com/dashboard/account/apikey).
 * Docs: https://thetvdb.github.io/v4-api/
 */
const BASE = "https://api4.thetvdb.com/v4"

export class TvdbError extends Error {}

let cached: { token: string; exp: number } | null = null

async function bearer(): Promise<string> {
  const key = process.env.TVDB_API_KEY
  if (!key) throw new TvdbError("Set TVDB_API_KEY first (free at thetvdb.com/dashboard/account/apikey).")
  if (cached && cached.exp > Date.now() + 60000) return cached.token
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "User-Agent": "tvdb-mcp/1.0", Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: key }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new TvdbError(`TheTVDB login failed (${res.status}). Check API key.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.data?.token) throw new TvdbError("TheTVDB returned no token.")
  cached = { token: data.data.token, exp: Date.now() + 23 * 3600 * 1000 }
  return cached.token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "tvdb-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${await bearer()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) {
    cached = null
    throw new TvdbError("TheTVDB refused (401/403). Check API key.")
  }
  if (res.status === 404) throw new TvdbError("Not found.")
  if (!res.ok) throw new TvdbError(`TheTVDB error ${res.status}`)
  return (await res.json()) as T
}

export interface Series {
  id?: string
  name?: string
  year?: string
  network?: string
  status?: string
}

export async function searchSeries(query: string, limit = 5): Promise<Series[]> {
  if (!query.trim()) throw new TvdbError("Query is empty.")
  const data = await getJson<Raw>(`/search?query=${encodeURIComponent(query.trim())}&type=series&limit=${Math.min(Math.max(limit, 1), 50)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((s) => ({
    id: s.tvdb_id ? String(s.tvdb_id) : s.id ? String(s.id) : "?",
    name: s.name,
    year: s.year,
    network: s.network,
    status: s.status?.name,
  }))
}

export async function getSeries(id: string): Promise<string> {
  if (!id.trim()) throw new TvdbError("Series id is empty.")
  const data = await getJson<Raw>(`/series/${encodeURIComponent(id.trim())}/extended?meta=translations`)
  const s: Raw = data.data ?? {}
  const lines = [
    `[${s.id ?? id}] ${s.name ?? "(unnamed)"}${s.firstAired ? ` (${String(s.firstAired).slice(0, 4)})` : ""}`,
    s.originalNetwork ? `Network: ${s.originalNetwork.name ?? s.originalNetwork}` : "",
    s.status?.name ? `Status: ${s.status.name}` : "",
    s.overview ? `${String(s.overview).slice(0, 300)}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatSeries(s: Series, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${s.id ?? "?"}] ${s.name ?? "(unnamed)"}${s.year ? ` (${s.year})` : ""}${s.network ? ` — ${s.network}` : ""}${s.status ? ` [${s.status}]` : ""}`
}
