/**
 * data.gov.sg — Singapore's official two-hour weather forecast by area. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.data.gov.sg.
 */
const API = "https://api.data.gov.sg/v1"

export class DataGovSgError extends Error {}

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
      headers: { "user-agent": "data-gov-sg-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DataGovSgError(`data.gov.sg returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DataGovSgError) throw e
    if ((e as Error).name === "AbortError") throw new DataGovSgError("data.gov.sg request timed out")
    throw new DataGovSgError(`data.gov.sg request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function forecast(limit = 15): Promise<string> {
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/environment/2-hour-weather-forecast`)
  const items = rows(at(body, "items.0.forecasts"))
  if (items.length === 0) return "data.gov.sg returned no forecast."
  const valid = val(at(body, "items.0.valid_period.text"))
  const lines = items.slice(0, size).map((r, i) => `${i + 1}. ${val(at(r, "area"))} — ${val(at(r, "forecast"))}`)
  return [`Singapore 2-hour forecast${valid === "" ? "" : ` (${valid})`} — showing ${lines.length} of ${items.length} areas`, "", ...lines].join("\n")
}
