/**
 * Radio Browser client — 40,000+ internet radio stations.
 * Docs: https://www.radio-browser.info/gui/#/api — keyless, several mirrors.
 * We hit the DE mirror; any mirror serves the same data.
 */
const BASE = "https://de1.api.radio-browser.info/json"

export class RadioError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "radio-browser-mcp/1.0" },
  })
  if (!res.ok) throw new RadioError(`Radio Browser error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Station {
  stationuuid: string
  name: string
  url_resolved?: string
  homepage?: string
  favicon?: string
  tags?: string
  country?: string
  countrycode?: string
  language?: string
  codec?: string
  bitrate?: number
  votes?: number
  clickcount?: number
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchStations(name: string, limit = 8): Promise<Station[]> {
  const data = await getJson<Station[]>(
    `/stations/search?name=${encodeURIComponent(name)}&hidebroken=true&order=clickcount&reverse=true&limit=${limit}`
  )
  return data
}

export async function stationsByTag(tag: string, limit = 8): Promise<Station[]> {
  const data = await getJson<Station[]>(
    `/stations/bytag/${encodeURIComponent(tag)}?hidebroken=true&order=clickcount&reverse=true&limit=${limit}`
  )
  return data
}

export async function stationsByCountry(country: string, limit = 8): Promise<Station[]> {
  const data = await getJson<Station[]>(
    `/stations/bycountry/${encodeURIComponent(country)}?hidebroken=true&order=clickcount&reverse=true&limit=${limit}`
  )
  return data
}

export async function topVoted(limit = 10): Promise<Station[]> {
  const data = await getJson<Station[]>(`/stations/topvote/${limit}`)
  return data
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatStation(s: Station, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${s.name}`
  const meta = [
    s.country,
    s.language,
    s.tags ? s.tags.split(",").slice(0, 5).join(", ") : "",
    s.codec && s.bitrate ? `${s.codec} ${s.bitrate}kbps` : "",
    s.votes ? `${s.votes} votes` : "",
  ]
    .filter(Boolean)
    .join(" · ")
  const lines = [head, meta, s.url_resolved ?? s.homepage ?? ""].filter(Boolean)
  return lines.join("\n")
}

// ---- muxB tools:
async function rbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "radio-browser-mcp/1.0" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new RadioError(`Radio Browser error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

type TagRow = { name?: string; stationcount?: number }

export async function listTags(args: { prefix?: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 30) || 30), 200))
  const prefix = (args.prefix ?? "").trim().toLowerCase()
  const data = await rbGet<TagRow[]>("/tags")
  if (!Array.isArray(data) || !data.length) throw new RadioError("Radio Browser returned no tags.")
  const filtered = prefix
    ? data.filter((t) => String(t.name ?? "").toLowerCase().includes(prefix))
    : [...data].sort((a, b) => (b.stationcount ?? 0) - (a.stationcount ?? 0))
  if (!filtered.length) return `No Radio Browser tag contains "${prefix}".`
  const rows = filtered.slice(0, limit).map((t, i) => `${i + 1}. ${t.name ?? 'untitled'} - ${t.stationcount ?? 0} stations`)
  const scope = prefix ? `matching "${prefix}"` : "most used, by station count"
  return `Radio Browser tags (${data.length} total, showing ${Math.min(limit, filtered.length)} ${scope}):\n${rows.join("\n")}`
}

type CountryRow = { iso_3166_1?: string; name?: string; stationcount?: number }

export async function listCountries(args: { limit?: number; prefix?: string }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 30) || 30), 200))
  const prefix = (args.prefix ?? "").trim().toLowerCase()
  const data = await rbGet<CountryRow[]>("/countries")
  if (!Array.isArray(data) || !data.length) throw new RadioError("Radio Browser returned no countries.")
  const filtered = prefix
    ? data.filter((c) => String(c.name ?? "").toLowerCase().includes(prefix) || String(c.iso_3166_1 ?? "").toLowerCase() === prefix)
    : [...data].sort((a, b) => (b.stationcount ?? 0) - (a.stationcount ?? 0))
  if (!filtered.length) return `No Radio Browser country matches "${prefix}".`
  const rows = filtered.slice(0, limit).map((c, i) => `${i + 1}. [${c.iso_3166_1 ?? "??"}] ${c.name ?? "unnamed"} - ${c.stationcount ?? 0} stations`)
  const scope = prefix ? `matching "${prefix}"` : "most stations first"
  return `Radio Browser countries (${data.length} total, showing ${Math.min(limit, filtered.length)} ${scope}):\n${rows.join("\n")}`
}

export async function stationsByLanguage(args: { language: string; limit?: number }): Promise<string> {
  const language = (args.language ?? "").trim()
  if (!language) return "Provide a language name or code, for example english or german."
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 8) || 8), 25))
  const stations = await rbGet<Station[]>(
    `/stations/bylanguage/${encodeURIComponent(language)}?hidebroken=true&order=clickcount&reverse=true&limit=${limit}`
  )
  if (!Array.isArray(stations) || !stations.length) return `No Radio Browser station broadcasts in "${language}".`
  const rows = stations.map((s, i) => formatStation(s, i))
  return `Stations broadcasting in ${language} (${stations.length} shown):\n${rows.join("\n")}`
}
