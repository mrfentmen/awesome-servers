/**
 * postcodes.io — UK postcode lookup and reverse geocoding. Keyless.
 *
 * Verified live: GET /postcodes/{postcode} returns `result` with country,
 * region, district, ward, constituency, lat/lon and grid references.
 * GET /postcodes?lon=&lat=&limit= returns the nearest postcodes.
 */
const API = "https://api.postcodes.io"

export class PostcodesError extends Error {}

interface Place {
  postcode?: string
  country?: string
  region?: string | null
  admin_district?: string | null
  admin_ward?: string | null
  parliamentary_constituency?: string | null
  latitude?: number
  longitude?: number
  eastings?: number
  northings?: number
  quality?: number
  distance?: number
}

interface OneBody {
  status?: number
  result?: Place
  error?: string
}

interface ManyBody {
  status?: number
  result?: Array<Place | null>
}

const NORMAL = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/

function normalise(input: string): string {
  const v = input.trim().toUpperCase()
  if (!NORMAL.test(v)) throw new PostcodesError(`"${input}" is not a UK postcode`)
  return v.replace(/\s+/g, "")
}

async function get<T>(path: string, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "postcodes-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new PostcodesError("postcodes.io has no such postcode")
    if (!res.ok) throw new PostcodesError(`postcodes.io responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof PostcodesError) throw e
    if ((e as Error).name === "AbortError") throw new PostcodesError("postcodes.io request timed out")
    throw new PostcodesError(`postcodes.io request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function describe(p: Place): string {
  const where = [p.admin_ward, p.admin_district, p.region, p.country].filter((v) => v !== undefined && v !== null && v !== "")
  const lines = [
    p.postcode ?? "unknown postcode",
    where.length > 0 ? where.join(", ") : "",
    p.parliamentary_constituency ? `Constituency: ${p.parliamentary_constituency}` : "",
    p.latitude !== undefined && p.longitude !== undefined ? `Location: ${p.latitude}, ${p.longitude}` : "",
    p.eastings !== undefined && p.northings !== undefined ? `Grid: ${p.eastings}E ${p.northings}N` : "",
    p.distance !== undefined ? `Distance: ${Math.round(p.distance)} m` : "",
  ]
  return lines.filter((l) => l !== "").join("\n")
}

export async function lookup(postcode: string): Promise<string> {
  const clean = normalise(postcode)
  const body = await get<OneBody>(`/postcodes/${encodeURIComponent(clean)}`)
  if (!body.result) throw new PostcodesError(`postcodes.io has no record for ${postcode}`)
  return describe(body.result)
}

export async function reverse(lat: number, lon: number, limit = 3): Promise<string> {
  if (!Number.isFinite(lat) || lat < 49 || lat > 61) throw new PostcodesError("latitude must be between 49 and 61 for the UK")
  if (!Number.isFinite(lon) || lon < -9 || lon > 2) throw new PostcodesError("longitude must be between -9 and 2 for the UK")
  const size = Number.isInteger(limit) ? Math.min(20, Math.max(1, limit)) : 3

  const body = await get<ManyBody>(`/postcodes?lon=${lon}&lat=${lat}&limit=${size}`)
  const places = (body.result ?? []).filter((p): p is Place => p !== null && p !== undefined)
  if (places.length === 0) return `No UK postcodes near ${lat}, ${lon}.`

  return [
    `Nearest postcodes to ${lat}, ${lon}`,
    "",
    ...places.map((p, i) => `${i + 1}. ${describe(p).split("\n").join("\n   ")}`),
  ].join("\n")
}
