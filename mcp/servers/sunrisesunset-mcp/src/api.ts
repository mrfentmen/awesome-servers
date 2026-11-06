/**
 * SunriseSunset — Sunrise, sunset, dawn, dusk and daylight length for any place and date. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.sunrisesunset.io.
 */
const API = "https://api.sunrisesunset.io"

export class SunriseSunsetError extends Error {}

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
      headers: { "user-agent": "sunrisesunset-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new SunriseSunsetError(`SunriseSunset returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof SunriseSunsetError) throw e
    if ((e as Error).name === "AbortError") throw new SunriseSunsetError("SunriseSunset request timed out")
    throw new SunriseSunsetError(`SunriseSunset request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function times(lat = 51.5072, lng = -0.1276, date = ""): Promise<string> {
  const day = date.trim()
  if (day !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new SunriseSunsetError("date must be YYYY-MM-DD or empty")
  const suffix = day === "" ? "" : `&date=${day}`
  const body = await get<unknown>(`${API}/json?lat=${lat}&lng=${lng}${suffix}`)
  const r = at(body, "results")
  if (!r) throw new SunriseSunsetError("no sun times returned for those coordinates")
  const fields: Array<[string, string]> = [
    ["Sunrise", "sunrise"], ["Sunset", "sunset"], ["Dawn", "dawn"], ["Dusk", "dusk"],
    ["Solar noon", "solar_noon"], ["Day length", "day_length"],
  ]
  return [
    `${val(at(body, "results.date"))} at ${lat}, ${lng}`,
    "",
    ...fields.map(([label, key]) => `${label}: ${val(at(r, key))}`),
    `Timezone: ${val(at(r, "timezone"))}`,
  ].join("\n")
}
