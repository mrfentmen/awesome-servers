/**
 * Kiwi.com Tequila API client. Needs KIWI_API_KEY
 * (free at https://tequila.kiwi.com/portal).
 * Docs: https://tequila.kiwi.com/portal/docs/tequila_api
 */
const BASE = "https://api.tequila.kiwi.com"

export class KiwiError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.KIWI_API_KEY
  if (!key) throw new KiwiError("Set KIWI_API_KEY first (free at tequila.kiwi.com/portal).")
  return { "User-Agent": "kiwi-mcp/1.0", Accept: "application/json", apikey: key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new KiwiError("Kiwi refused (401/403). Check API key.")
  if (res.status === 422) throw new KiwiError("Kiwi: bad request (check airport codes and dates).")
  if (!res.ok) throw new KiwiError(`Kiwi error ${res.status}`)
  return (await res.json()) as T
}

export async function findLocations(query: string, limit = 5): Promise<string[]> {
  if (!query.trim()) throw new KiwiError("Query is empty.")
  const data = await getJson<Raw>(`/locations/query?term=${encodeURIComponent(query.trim())}&locale=en-US&location_types=airport&limit=${Math.min(Math.max(limit, 1), 50)}&active_only=true`)
  const rows: Raw[] = Array.isArray(data.locations) ? data.locations : []
  return rows.slice(0, limit).map((l) => `[${String(l.code ?? "?")}] ${String(l.name ?? "?")} (${String(l.city?.name ?? l.city?.country?.name ?? "?")})`)
}

export interface Flight {
  price?: number
  currency?: string
  from?: string
  to?: string
  departure?: string
  arrival?: string
  duration?: string
  airlines: string[]
  link?: string
}

export async function searchFlights(from: string, to: string, dateFrom: string, dateTo: string, limit = 5): Promise<Flight[]> {
  for (const [label, v] of [["from", from], ["to", to], ["date_from", dateFrom], ["date_to", dateTo]] as const) {
    if (!v.trim()) throw new KiwiError(`${label} is empty.`)
  }
  const qs = new URLSearchParams({
    fly_from: from.trim().toUpperCase(),
    fly_to: to.trim().toUpperCase(),
    date_from: dateFrom.trim(),
    date_to: dateTo.trim(),
    curr: "USD",
    limit: String(Math.min(Math.max(limit, 1), 50)),
    sort: "price",
  }).toString()
  const data = await getJson<Raw>(`/v2/search?${qs}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((f) => {
    const secs = Number(f.duration?.total ?? 0)
    return {
      price: f.price,
      currency: "USD",
      from: `${f.cityFrom ?? "?"} (${f.flyFrom ?? "?"})`,
      to: `${f.cityTo ?? "?"} (${f.flyTo ?? "?"})`,
      departure: f.local_departure ? String(f.local_departure).slice(0, 16).replace("T", " ") : undefined,
      arrival: f.local_arrival ? String(f.local_arrival).slice(0, 16).replace("T", " ") : undefined,
      duration: secs ? `${Math.floor(secs / 3600)}h${Math.round((secs % 3600) / 60)}m` : undefined,
      airlines: Array.isArray(f.airlines) ? f.airlines.map(String) : [],
      link: f.deep_link,
    }
  })
}

export function formatFlight(f: Flight, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${f.from ?? "?"} → ${f.to ?? "?"}${f.price !== undefined ? ` — $${f.price}` : ""}`,
    [f.departure ? `dep ${f.departure}` : "", f.arrival ? `arr ${f.arrival}` : "", f.duration ?? ""].filter(Boolean).join(" · "),
    f.airlines.length ? `Airlines: ${f.airlines.join(", ")}` : "",
    f.link ? `${f.link}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
