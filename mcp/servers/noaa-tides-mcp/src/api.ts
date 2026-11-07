/**
 * NOAA Tides — Water levels and tide observations from NOAA tide gauges. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.tidesandcurrents.noaa.gov.
 */
const API = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"

export class NoaaTidesError extends Error {}

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
      headers: { "user-agent": "noaa-tides-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new NoaaTidesError(`NOAA Tides returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NoaaTidesError) throw e
    if ((e as Error).name === "AbortError") throw new NoaaTidesError("NOAA Tides request timed out")
    throw new NoaaTidesError(`NOAA Tides request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function waterLevel(station = "8454000", units = "english"): Promise<string> {
  const id = station.trim()
  if (!/^\d{7}$/.test(id)) throw new NoaaTidesError("station must be seven digits, e.g. 8454000")
  const query = `?product=water_level&application=research&format=json&datum=MSL&date=latest&time_zone=gmt&units=${units}&station=${id}`
  const body = await get<unknown>(`${API}${query}`)
  const reading = rows(at(body, "data"))[0]
  if (!reading) return `NOAA has no recent reading for station ${id}.`
  const feet = units === "english" ? "ft" : "m"
  return [
    `${val(at(body, "metadata.name"))} (${id})`,
    "",
    `Water level: ${val(at(reading, "v"))} ${feet}`,
    `Time: ${val(at(reading, "t"))} GMT`,
    `Datum: ${val(at(reading, "s")) === "" ? "MSL" : val(at(reading, "s"))}`,
  ].join("\n")
}
