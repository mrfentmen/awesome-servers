/**
 * NWS Weather — Seven day forecasts for US locations from the National Weather Service. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.weather.gov.
 */
const API = "https://api.weather.gov"

export class NwsWeatherError extends Error {}

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
      headers: { "user-agent": "nws-weather-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new NwsWeatherError(`NWS Weather returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NwsWeatherError) throw e
    if ((e as Error).name === "AbortError") throw new NwsWeatherError("NWS Weather request timed out")
    throw new NwsWeatherError(`NWS Weather request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function forecast(latitude = 39.7456, longitude = -97.0892, periods = 5): Promise<string> {
  const point = await get<unknown>(`${API}/points/${latitude},${longitude}`)
  const url = val(at(point, "properties.forecast"))
  if (url === "") throw new NwsWeatherError(`no forecast office for ${latitude},${longitude}`)
  const body = await get<unknown>(url)
  const items = rows(at(body, "properties.periods")).slice(0, Math.max(1, periods))
  if (items.length === 0) throw new NwsWeatherError("forecast returned no periods")
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "name"))}: ${val(at(r, "temperature"))} ${val(at(r, "temperatureUnit"))} — ${val(at(r, "shortForecast"))}`)
  return [`NWS forecast for ${latitude},${longitude}`, "", ...lines].join("\n")
}
