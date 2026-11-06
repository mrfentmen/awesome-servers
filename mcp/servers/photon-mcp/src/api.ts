/**
 * Photon — OpenStreetMap geocoder by Komoot. Keyless.
 *
 * Verified live: GET /api/?q=&limit=&lang= returns a GeoJSON FeatureCollection
 * with `properties.name`, `city`, `state`, `country`, `osm_key`/`osm_value` and
 * `geometry.coordinates` as [lon, lat].
 */
const API = "https://photon.komoot.io/api/"

export class PhotonError extends Error {}

interface Props {
  name?: string
  street?: string
  housenumber?: string
  postcode?: string
  city?: string
  district?: string
  state?: string
  country?: string
  countrycode?: string
  osm_key?: string
  osm_value?: string
  type?: string
}

interface Feature {
  properties?: Props
  geometry?: { type?: string; coordinates?: number[] }
}

interface Collection {
  features?: Feature[]
}

async function get(params: URLSearchParams, timeoutMs = 25000): Promise<Collection> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "photon-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new PhotonError(`Photon responded ${res.status}`)
    return (await res.json()) as Collection
  } catch (e) {
    if (e instanceof PhotonError) throw e
    if ((e as Error).name === "AbortError") throw new PhotonError("Photon request timed out")
    throw new PhotonError(`Photon request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

function describe(p: Props): string {
  const street = [p.street, p.housenumber].filter(Boolean).join(" ")
  const where = [p.district, p.city, p.state, p.country].filter((v): v is string => typeof v === "string" && v !== "")
  const kind = [p.osm_key, p.osm_value].filter(Boolean).join("=")
  return [street, where.join(", ")].filter((v) => v !== "").join(", ") || kind || "no address parts"
}

export async function geocode(query: string, limit = 5, lang?: string): Promise<string> {
  const q = query.trim()
  if (q === "") throw new PhotonError("query must not be empty")

  const params = new URLSearchParams({ q, limit: String(clamp(limit, 1, 50)) })
  if (lang !== undefined && lang !== "") params.set("lang", lang.trim().toLowerCase())

  const body = await get(params)
  const rows = body.features ?? []
  if (rows.length === 0) return `Photon found nothing for "${q}".`

  const lines = rows.flatMap((f, i) => {
    const p = f.properties ?? {}
    const coords = f.geometry?.coordinates ?? []
    const lon = typeof coords[0] === "number" ? coords[0] : undefined
    const lat = typeof coords[1] === "number" ? coords[1] : undefined
    const head = `${i + 1}. ${p.name ?? "unnamed"} — ${p.type ?? p.osm_value ?? "place"}`
    const place = describe(p)
    const point = lat !== undefined && lon !== undefined ? `   at ${lat.toFixed(5)}, ${lon.toFixed(5)}` : ""
    return [head, `   ${place}`, point].filter((l) => l !== "")
  })

  return [`"${q}" — ${rows.length} places`, "", ...lines].join("\n")
}
