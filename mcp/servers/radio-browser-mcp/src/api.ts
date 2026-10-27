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
