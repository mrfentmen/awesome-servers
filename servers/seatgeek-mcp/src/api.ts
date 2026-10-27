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
