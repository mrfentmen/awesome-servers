/**
 * NOAA Space Weather — Planetary K-index and solar wind readings from NOAA SWPC. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against services.swpc.noaa.gov.
 */
const API = "https://services.swpc.noaa.gov"

export class NoaaSpaceWeatherError extends Error {}

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
      headers: { "user-agent": "noaa-space-weather-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new NoaaSpaceWeatherError(`NOAA Space Weather returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NoaaSpaceWeatherError) throw e
    if ((e as Error).name === "AbortError") throw new NoaaSpaceWeatherError("NOAA Space Weather request timed out")
    throw new NoaaSpaceWeatherError(`NOAA Space Weather request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function kpIndex(): Promise<string> {
  const body = await get<unknown>(`${API}/json/planetary_k_index_1m.json`)
  const items = rows(body)
  if (items.length === 0) throw new NoaaSpaceWeatherError("NOAA returned no Kp readings")
  const latest = items[items.length - 1]
  const kp = Number(val(at(latest, "kp_index")))
  const storm = Number.isFinite(kp) && kp >= 5 ? "geomagnetic storm" : "below storm level"
  const lines = items.slice(-5).map((r) => `${val(at(r, "time_tag"))} — Kp ${val(at(r, "kp_index"))}`)
  return [`NOAA Kp index — latest ${val(at(latest, "kp_index"))} (${storm})`, "", ...lines].join("\n")
}
