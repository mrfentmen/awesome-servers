/**
 * OpenStreetMap Nominatim — keyless public API client.
 */
const BASE = "https://nominatim.openstreetmap.org"
const SOURCE = "OpenStreetMap Nominatim"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "nominatim-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function common(r: any): string {
  const lat = Number(r.lat)
  const lon = Number(r.lon)
  return [
    `${clean(r.display_name)}`,
    `  ${clean(r.type) || "?"} · ${clean(r.category) || clean(r.class) || "?"}${r.addresstype ? ` · ${clean(r.addresstype)}` : ""}${Number.isFinite(lat) && Number.isFinite(lon) ? ` · ${lat.toFixed(5)}, ${lon.toFixed(5)}` : ""}`,
    r.osm_type && r.osm_id ? `  ${clean(r.osm_type)[0].toUpperCase()}${r.osm_id}` : "",
  ].filter(Boolean).join("\n")
}

export async function searchPlaces(a: { query: string; limit?: number; countryCode?: string }): Promise<string> {
  const q = clean(a.query)
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new SourceError("limit must be between 1 and 10")
  const country = a.countryCode ? clean(a.countryCode).toLowerCase() : ""
  if (a.countryCode && !/^[a-z]{2}$/i.test(a.countryCode)) throw new SourceError("countryCode must be two letters")
  const d = await getJson(`/search?q=${encodeURIComponent(q)}${country ? `&countrycodes=${country}` : ""}&format=jsonv2&addressdetails=1&limit=${limit}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `OpenStreetMap has no place matching "${q}"${country ? ` in ${country.toUpperCase()}` : ""}.`
  return [
    `${rows.length} match(es) for "${q}"${country ? ` in ${country.toUpperCase()}` : ""}:`,
    "",
    ...rows.map(common),
  ].join("\n")
}

export async function reverseGeocode(a: { latitude: number; longitude: number }): Promise<string> {
  if (!Number.isFinite(a.latitude) || a.latitude < -90 || a.latitude > 90) throw new SourceError("latitude must be between -90 and 90")
  if (!Number.isFinite(a.longitude) || a.longitude < -180 || a.longitude > 180) throw new SourceError("longitude must be between -180 and 180")
  const d = await getJson(`/reverse?lat=${a.latitude}&lon=${a.longitude}&format=jsonv2&addressdetails=1`)
  if (!d || d.error) throw new SourceError(clean(d?.error) || "Nominatim found no address for those coordinates")
  const addr = d.address ?? {}
  const parts = ["house_number", "road", "suburb", "city", "town", "village", "county", "state", "postcode", "country"]
    .map((k) => (addr[k] ? `${k.replace(/_/g, " ")}: ${clean(addr[k])}` : ""))
    .filter(Boolean)
  return [
    `Address at ${a.latitude}, ${a.longitude}:`,
    clean(d.display_name) || "(no display name)",
    "",
    parts.length ? parts.join("\n") : "No structured address fields returned.",
    d.osm_type && d.osm_id ? `\nOpenStreetMap element: ${clean(d.osm_type)[0].toUpperCase()}${d.osm_id}` : "",
  ].join("\n")
}

export async function lookupOsmIds(a: { osmIds: string[] }): Promise<string> {
  const ids = (a.osmIds ?? []).map((i) => clean(i).toUpperCase())
  if (!ids.length || ids.length > 5) throw new SourceError("osmIds must list between 1 and 5 ids")
  for (const id of ids) {
    if (!/^[NWR]\d+$/.test(id)) throw new SourceError(`${id} is not a valid OSM id; use W123, N123 or R123`)
  }
  const d = await getJson(`/lookup?osm_ids=${ids.join(",")}&format=jsonv2&addressdetails=1`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `OpenStreetMap has no element for ${ids.join(", ")}.`
  return [
    `${rows.length} element(s) found:`,
    "",
    ...rows.map(common),
  ].join("\n")
}
