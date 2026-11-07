/**
 * Open-Meteo Geocoding — Turn a place name into coordinates with the Open-Meteo geocoder. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against geocoding-api.open-meteo.com.
 */
const API = "https://geocoding-api.open-meteo.com/v1"

export class OpenMeteoGeocodingError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "open-meteo-geocoding-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenMeteoGeocodingError(`Open-Meteo Geocoding returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenMeteoGeocodingError) throw e
    if ((e as Error).name === "AbortError") throw new OpenMeteoGeocodingError("Open-Meteo Geocoding request timed out")
    throw new OpenMeteoGeocodingError(`Open-Meteo Geocoding request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchPlaces(name: string, count = 5): Promise<string> {
  const q = name.trim()
  if (q === "") throw new OpenMeteoGeocodingError("name must not be empty")
  const size = Math.min(20, Math.max(1, count))
  const body = await get<unknown>(`${API}/search?name=${encodeURIComponent(q)}&count=${size}&language=en&format=json`)
  const items = rows(at(body, "results"))
  if (items.length === 0) return `Open-Meteo found no place called "${q}".`
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "name"))}, ${val(at(r, "country"))} — ${val(at(r, "latitude"))}, ${val(at(r, "longitude"))} (${val(at(r, "timezone"))})`)
  return [`Open-Meteo places for "${q}" — ${items.length} shown`, "", ...lines].join("\n")
}
