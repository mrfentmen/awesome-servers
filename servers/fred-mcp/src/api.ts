/**
 * FRED (Federal Reserve Economic Data) API client. Needs FRED_API_KEY
 * (free at https://fredaccount.stlouisfed.org/apikeys).
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */
const BASE = "https://api.stlouisfed.org/fred"

export class FredError extends Error {}

function apiKey(): string {
  const k = process.env.FRED_API_KEY
  if (!k) throw new FredError("Set FRED_API_KEY first (free at fredaccount.stlouisfed.org/apikeys).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ api_key: apiKey(), file_type: "json", ...extra }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "fred-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 400) {
    const msg = await res.text().catch(() => "")
    throw new FredError(`FRED rejected the request (400): ${msg.slice(0, 160)}`)
  }
  if (!res.ok) throw new FredError(`FRED error ${res.status}`)
  return (await res.json()) as T
}

export interface SeriesHit {
  id: string
  title?: string
  frequency?: string
  units?: string
  updated?: string
}

export async function searchSeries(query: string, limit = 5): Promise<SeriesHit[]> {
  if (!query.trim()) throw new FredError("Query is empty.")
  const data = await getJson<Raw>("/series/search", { search_text: query.trim(), limit: String(Math.min(Math.max(limit, 1), 100)) })
  const rows: Raw[] = Array.isArray(data.seriess) ? data.seriess : []
  return rows.slice(0, limit).map((s) => ({
    id: String(s.id),
    title: s.title,
    frequency: s.frequency,
    units: s.units,
    updated: s.last_updated ? String(s.last_updated).slice(0, 10) : undefined,
  }))
}

export async function seriesObservations(id: string, limit = 12): Promise<string> {
  if (!id.trim()) throw new FredError("Series id is empty.")
  const data = await getJson<Raw>(`/series/observations`, { series_id: id.trim().toUpperCase(), limit: String(Math.min(Math.max(limit, 1), 100)), sort_order: "desc" })
  const rows: Raw[] = Array.isArray(data.observations) ? data.observations : []
  if (rows.length === 0) return `No observations for ${id.trim().toUpperCase()}.`
  const lines = rows.slice(0, limit).map((o) => `${String(o.date).slice(0, 10)}: ${o.value === "." ? "(missing)" : o.value}`).join("\n")
  return `Latest ${id.trim().toUpperCase()} observations (newest first):\n${lines}`
}

export function formatSeries(s: SeriesHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${s.id}] ${s.title ?? "(untitled)"}${s.frequency ? ` (${s.frequency}${s.units ? `, ${s.units}` : ""})` : ""}${s.updated ? ` — updated ${s.updated}` : ""}`
}

export async function seriesInfo(id: string): Promise<string> {
  if (!id.trim()) throw new FredError("Series id is empty.")
  const data = await getJson<Raw>("/series", { series_id: id.trim().toUpperCase() })
  const rows: Raw[] = Array.isArray(data.seriess) ? data.seriess : []
  const s = rows[0]
  if (!s) return `No FRED series ${id.trim().toUpperCase()}.`
  return [`[${s.id}] ${s.title ?? "(untitled)"}`, `Frequency: ${s.frequency ?? "?"}`, `Units: ${s.units ?? "?"}`, `Seasonal adjustment: ${s.seasonal_adjustment ?? "?"}`, `Range: ${s.observation_start ?? "?"} to ${s.observation_end ?? "?"}`, `Notes: ${typeof s.notes === "string" ? s.notes.slice(0, 400) : "(none)"}`].join("\n")
}

export async function seriesVintages(id: string, limit = 5): Promise<string> {
  if (!id.trim()) throw new FredError("Series id is empty.")
  const data = await getJson<Raw>("/series/vintagedates", { series_id: id.trim().toUpperCase(), limit: String(limit), sort_order: "desc" })
  const rows: Raw[] = Array.isArray(data.vintage_dates) ? data.vintage_dates : []
  if (rows.length === 0) return `No vintage dates for ${id.trim().toUpperCase()}.`
  return `Vintage dates for ${id.trim().toUpperCase()} (newest first):\n${rows.slice(0, limit).map(String).join("\n")}`
}

export async function releaseTables(releaseId: string): Promise<string> {
  if (!releaseId.trim()) throw new FredError("Release id is empty.")
  const data = await getJson<Raw>("/release/tables", { release_id: releaseId.trim() })
  const txt = JSON.stringify(data).slice(0, 3000)
  return `Tables for release ${releaseId.trim()}:\n${txt}`
}

export async function tagList(limit = 20): Promise<string> {
  const data = await getJson<Raw>("/tags", { limit: String(Math.min(Math.max(limit, 1), 100)), sort_order: "asc" })
  const rows: Raw[] = Array.isArray(data.tags) ? data.tags : []
  return `FRED tags:\n${rows.slice(0, limit).map((t) => `${t.name ?? "?"} (created ${t.created ?? "?"})`).join("\n")}`
}

export async function geoData(id: string, date?: string): Promise<string> {
  if (!id.trim()) throw new FredError("Series id is empty.")
  const qs = new URLSearchParams({ api_key: apiKey(), file_type: "json", series_id: id.trim().toUpperCase(), date: date?.trim() || "2024-01-01" }).toString()
  const res = await fetch(`https://api.stlouisfed.org/geofred/series/data?${qs}`, {
    headers: { "User-Agent": "fred-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new FredError(`FRED error ${res.status}`)
  const data = (await res.json()) as Raw
  const txt = JSON.stringify(data).slice(0, 3000)
  return `GeoFRED regional data for ${id.trim().toUpperCase()}:\n${txt}`
}

export async function releasesList(limit = 10): Promise<string> {
  const data = await getJson<Raw>("/releases", { limit: String(Math.min(Math.max(limit, 1), 100)) })
  const rows: Raw[] = Array.isArray(data.releases) ? data.releases : []
  return `FRED releases:\n${rows.slice(0, limit).map((r) => `[${r.id}] ${r.name ?? "(untitled)"}`).join("\n")}`
}

export async function sourcesList(limit = 10): Promise<string> {
  const data = await getJson<Raw>("/sources", { limit: String(Math.min(Math.max(limit, 1), 100)) })
  const rows: Raw[] = Array.isArray(data.sources) ? data.sources : []
  return `FRED sources:\n${rows.slice(0, limit).map((r) => `[${r.id}] ${r.name ?? "(untitled)"}`).join("\n")}`
}
