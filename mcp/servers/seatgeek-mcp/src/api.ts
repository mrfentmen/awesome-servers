/**
 * SeatGeek API client. Needs SEATGEEK_CLIENT_ID
 * (free at https://seatgeek.com/account/develop).
 * Docs: https://platform.seatgeek.com/
 */
const BASE = "https://api.seatgeek.com/2"

export class SeatGeekError extends Error {}

function clientId(): string {
  const id = process.env.SEATGEEK_CLIENT_ID
  if (!id) throw new SeatGeekError("Set SEATGEEK_CLIENT_ID first (free at seatgeek.com/account/develop).")
  return id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...extra, client_id: clientId() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "seatgeek-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new SeatGeekError("SeatGeek refused (401/403). Check client ID and rate limits.")
  if (res.status === 404) throw new SeatGeekError("Not found.")
  if (!res.ok) throw new SeatGeekError(`SeatGeek error ${res.status}`)
  return (await res.json()) as T
}

export interface SgEvent {
  id: number
  title?: string
  date?: string
  venue?: string
  city?: string
  price?: string
  url?: string
}

export async function searchEvents(query: string, limit = 5): Promise<SgEvent[]> {
  if (!query.trim()) throw new SeatGeekError("Query is empty.")
  const data = await getJson<Raw>("/events", { q: query.trim(), per_page: String(Math.min(Math.max(limit, 1), 100)) })
  const rows: Raw[] = Array.isArray(data.events) ? data.events : []
  return rows.slice(0, limit).map(toEvent)
}

const toEvent = (e: Raw): SgEvent => ({
  id: Number(e.id),
  title: e.title ?? e.short_title,
  date: e.datetime_local ? String(e.datetime_local).slice(0, 16).replace("T", " ") : undefined,
  venue: e.venue?.name,
  city: [e.venue?.city, e.venue?.state].filter(Boolean).join(", ") || undefined,
  price: e.stats?.lowest_price !== undefined && e.stats?.lowest_price !== null
    ? `from $${e.stats.lowest_price}${e.stats?.highest_price ? ` to $${e.stats.highest_price}` : ""}`
    : undefined,
  url: e.url,
});

export async function recommendEvents(lat: number, lon: number, limit = 5): Promise<SgEvent[]> {
  if (!isFinite(lat) || lat < -90 || lat > 90) throw new SeatGeekError("Latitude must be -90..90.")
  if (!isFinite(lon) || lon < -180 || lon > 180) throw new SeatGeekError("Longitude must be -180..180.")
  const data = await getJson<Raw>("/recommendations", { lat: String(lat), lon: String(lon), per_page: String(Math.min(Math.max(limit, 1), 100)) })
  const recs: Raw[] = Array.isArray(data.recommendations) ? data.recommendations : []
  const out: SgEvent[] = []
  for (const r of recs) {
    const e: Raw = r.event ?? {}
    if (e.id === undefined) continue
    out.push(toEvent(e))
    if (out.length >= limit) break
  }
  return out
}

export function formatEvent(e: SgEvent, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const where = [e.venue, e.city].filter(Boolean).join(", ")
  return `${prefix}[${e.id}] ${e.title ?? "(untitled)"}${e.date ? ` — ${e.date}` : ""}${where ? `\n   ${where}` : ""}${e.price ? `\n   Tickets ${e.price}` : ""}${e.url ? `\n   ${e.url}` : ""}`
}

// ---- muxH tools:
// SeatGeek sells seats. Before a promoter can price a booking they need to know
// who the act is and how much of a recorded catalogue they can point at, and
// MusicBrainz publishes both without an account.

const MB = "https://musicbrainz.org/ws/2"
const SG_UA = "seatgeek-mcp/1.1 (https://github.com/mcfentmen/seatgeek-mcp; contact seatgeek-mcp@example.com)"

interface MbLife {
  begin?: string
  end?: string
  ended?: boolean
}

interface MbArtist {
  id?: string
  name?: string
  "sort-name"?: string
  disambiguation?: string
  country?: string
  type?: string
  gender?: string
  "life-span"?: MbLife
  area?: { name?: string }
  "begin-area"?: { name?: string }
  aliases?: Array<{ name?: string; locale?: string | null; type?: string; primary?: boolean | null }>
  tags?: Array<{ name?: string; count?: number }>
  relations?: Array<{ type?: string; direction?: string; begin?: string | null; end?: string | null; artist?: MbArtist; url?: { resource?: string; type?: string } }>
}

interface MbArtistSearch {
  count?: number
  artists?: Array<MbArtist & { score?: number }>
}

interface MbReleaseGroup {
  id?: string
  title?: string
  "primary-type"?: string
  "secondary-types"?: string[]
  "first-release-date"?: string
}

interface MbReleaseGroupSearch {
  count?: number
  "release-groups"?: MbReleaseGroup[]
}

let lastCall = 0
async function mbGet<T>(path: string): Promise<T> {
  // MusicBrainz asks for no more than one request a second, unauthenticated.
  const gap = 1050 - (Date.now() - lastCall)
  if (gap > 0) await new Promise((resolve) => setTimeout(resolve, gap))
  lastCall = Date.now()
  const res = await fetch(`${MB}${path}`, {
    headers: { Accept: "application/json", "User-Agent": SG_UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 400) throw new SeatGeekError(`MusicBrainz rejected the query.`)
  if (res.status === 404) throw new SeatGeekError("MusicBrainz has no record for that artist.")
  if (res.status === 503) throw new SeatGeekError("MusicBrainz is rate-limiting this host. Try again shortly.")
  if (!res.ok) throw new SeatGeekError(`MusicBrainz error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findArtist(input: string): Promise<{ artist: MbArtist; score?: number; exact: boolean }> {
  const name = (input ?? "").trim()
  if (!name) throw new SeatGeekError("Give an artist name or a MusicBrainz id.")
  if (MBID.test(name)) {
    const artist = await mbGet<MbArtist>(`/artist/${name}?inc=aliases&fmt=json`)
    return { artist, exact: true }
  }
  const data = await mbGet<MbArtistSearch>(`/artist?query=${encodeURIComponent(`artist:"${name}"`)}&fmt=json&limit=8`)
  const hits = data.artists ?? []
  if (!hits.length) throw new SeatGeekError(`MusicBrainz has no artist matching "${name}".`)
  const exact = hits.find((a) => (a.name ?? "").toLowerCase() === name.toLowerCase()) ?? hits[0]
  return { artist: exact, score: exact.score, exact: (exact.name ?? "").toLowerCase() === name.toLowerCase() }
}

