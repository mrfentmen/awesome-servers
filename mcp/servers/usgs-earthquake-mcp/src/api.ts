/**
 * USGS Earthquakes — Recent earthquakes worldwide from the US Geological Survey feed. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against earthquake.usgs.gov.
 */
const API = "https://earthquake.usgs.gov/fdsnws/event/1"

export class UsgsEarthquakeError extends Error {}

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
      headers: { "user-agent": "usgs-earthquake-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new UsgsEarthquakeError(`USGS Earthquakes returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof UsgsEarthquakeError) throw e
    if ((e as Error).name === "AbortError") throw new UsgsEarthquakeError("USGS Earthquakes request timed out")
    throw new UsgsEarthquakeError(`USGS Earthquakes request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function recentEarthquakes(minMagnitude = 2.5, limit = 10): Promise<string> {
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/query?format=geojson&limit=${size}&minmagnitude=${minMagnitude}&orderby=time`)
  const items = rows(at(body, "features"))
  if (items.length === 0) return `USGS reports no quakes above magnitude ${minMagnitude} right now.`
  const lines = items.map((r, i) => {
    const when = at(r, "properties.time")
    const stamp = typeof when === "number" ? new Date(when).toISOString().slice(0, 16).replace("T", " ") : "n/a"
    return `${i + 1}. M${val(at(r, "properties.mag"))} — ${val(at(r, "properties.place"))} (${stamp} UTC)`
  })
  return [`USGS earthquakes above M${minMagnitude} — ${items.length} shown`, "", ...lines].join("\n")
}
