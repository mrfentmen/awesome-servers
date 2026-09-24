/**
 * Amadeus for Developers API client (test environment). Needs
 * AMADEUS_API_KEY + AMADEUS_API_SECRET (free at https://developers.amadeus.com/).
 * Uses client-credentials grant against test.api.amadeus.com; token cached.
 * Docs: https://developers.amadeus.com/self-service
 */
const BASE = "https://test.api.amadeus.com"

export class AmadeusError extends Error {}

let cached: { token: string; exp: number } | null = null

async function appToken(): Promise<string> {
  const id = process.env.AMADEUS_API_KEY
  const secret = process.env.AMADEUS_API_SECRET
  if (!id || !secret) {
    throw new AmadeusError("Set AMADEUS_API_KEY and AMADEUS_API_SECRET (free at developers.amadeus.com).")
  }
  if (cached && cached.exp > Date.now() + 60000) return cached.token
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret })
  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "User-Agent": "amadeus-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new AmadeusError(`Amadeus OAuth failed (${res.status}). Check key/secret.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.access_token) throw new AmadeusError("Amadeus OAuth returned no token.")
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 1799) * 1000 }
  return cached.token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "amadeus-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${await appToken()}` },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) {
    cached = null
    throw new AmadeusError("Amadeus refused (401/403). Check key/secret.")
  }
  if (res.status === 429) throw new AmadeusError("Amadeus rate limit hit; wait and retry.")
  if (!res.ok) throw new AmadeusError(`Amadeus error ${res.status}`)
  return (await res.json()) as T
}

export async function searchAirports(keyword: string, limit = 5): Promise<string[]> {
  if (!keyword.trim()) throw new AmadeusError("Keyword is empty.")
  const data = await getJson<Raw>(`/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword.trim())}&page%5Blimit%5D=${Math.min(Math.max(limit, 1), 50)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((a) => `[${String(a.iataCode ?? "?")}] ${String(a.name ?? "?")} (${String(a.address?.cityName ?? "?")}, ${String(a.address?.countryName ?? "?")})`)
}

export interface FlightOffer {
  price?: string
  currency?: string
  legs: string[]
}

export async function searchFlights(origin: string, destination: string, date: string, adults = 1, limit = 5): Promise<FlightOffer[]> {
  for (const [label, v] of [["origin", origin], ["destination", destination], ["date", date]] as const) {
    if (!v.trim()) throw new AmadeusError(`${label} is empty.`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) throw new AmadeusError("Date must be YYYY-MM-DD.")
  const qs = new URLSearchParams({
    originLocationCode: origin.trim().toUpperCase(),
    destinationLocationCode: destination.trim().toUpperCase(),
    departureDate: date.trim(),
    adults: String(Math.min(Math.max(adults, 1), 9)),
    max: String(Math.min(Math.max(limit, 1), 50)),
    currencyCode: "USD",
  }).toString()
  const data = await getJson<Raw>(`/v2/shopping/flight-offers?${qs}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((o) => {
    const legs: string[] = []
    for (const it of ((o.itineraries ?? []) as Raw[]).slice(0, 1)) {
      for (const seg of ((it.segments ?? []) as Raw[])) {
        legs.push(`${seg.departure?.iataCode ?? "?"}→${seg.arrival?.iataCode ?? "?"} ${seg.carrierCode ?? ""}${seg.number ?? ""}`.trim())
      }
    }
    return {
      price: o.price?.total,
      currency: o.price?.currency,
      legs,
    }
  })
}

export function formatOffer(o: FlightOffer, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${o.price !== undefined ? `$${o.price} ${o.currency ?? ""}`.trim() : "price n/a"}\n   ${o.legs.join(" + ") || "(no legs)"}`
}
