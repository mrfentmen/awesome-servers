/**
 * NWS Alerts — Active severe weather alerts for US states from the National Weather Service. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.weather.gov.
 */
const API = "https://api.weather.gov"

export class NwsAlertsError extends Error {}

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
      headers: { "user-agent": "nws-alerts-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new NwsAlertsError(`NWS Alerts returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NwsAlertsError) throw e
    if ((e as Error).name === "AbortError") throw new NwsAlertsError("NWS Alerts request timed out")
    throw new NwsAlertsError(`NWS Alerts request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function activeAlerts(area = ""): Promise<string> {
  const code = area.trim().toUpperCase()
  const suffix = code === "" ? "" : `?area=${encodeURIComponent(code)}`
  const body = await get<unknown>(`${API}/alerts/active${suffix}`)
  const items = rows(at(body, "features"))
  if (items.length === 0) return `NWS has no active alerts${code === "" ? "" : ` for ${code}`}.`
  const lines = items.slice(0, 15).map((r, i) => `${i + 1}. ${val(at(r, "properties.event"))} — ${val(at(r, "properties.areaDesc"))} (${val(at(r, "properties.severity"))})`)
  return [`NWS active alerts${code === "" ? "" : ` for ${code}`} — ${items.length} total`, "", ...lines].join("\n")
}
