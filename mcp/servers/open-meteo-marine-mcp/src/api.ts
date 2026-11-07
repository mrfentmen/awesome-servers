/**
 * Open-Meteo Marine — Wave height, period and sea temperature from the Open-Meteo marine API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against marine-api.open-meteo.com.
 */
const API = "https://marine-api.open-meteo.com/v1"

export class OpenMeteoMarineError extends Error {}

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
      headers: { "user-agent": "open-meteo-marine-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenMeteoMarineError(`Open-Meteo Marine returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenMeteoMarineError) throw e
    if ((e as Error).name === "AbortError") throw new OpenMeteoMarineError("Open-Meteo Marine request timed out")
    throw new OpenMeteoMarineError(`Open-Meteo Marine request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function marineConditions(latitude = 54, longitude = 10): Promise<string> {
  const query = `?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=UTC`
  const body = await get<unknown>(`${API}/marine${query}`)
  const current = at(body, "current")
  if (!current) throw new OpenMeteoMarineError("no marine data for these coordinates")
  return [
    `Sea conditions at ${latitude},${longitude}`,
    "",
    `Wave height: ${val(at(current, "wave_height"))} m`,
    `Wave period: ${val(at(current, "wave_period"))} s`,
    `Wave direction: ${val(at(current, "wave_direction"))} deg`,
    `Sea temperature: ${val(at(current, "sea_surface_temperature"))} C`,
    `Time: ${val(at(current, "time"))} UTC`,
  ].join("\n")
}
