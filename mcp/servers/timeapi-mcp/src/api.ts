/**
 * TimeAPI — Current time and date in any IANA timezone. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against timeapi.io.
 */
const API = "https://timeapi.io/api"

export class TimeApiError extends Error {}

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
      headers: { "user-agent": "timeapi-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new TimeApiError(`TimeAPI returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof TimeApiError) throw e
    if ((e as Error).name === "AbortError") throw new TimeApiError("TimeAPI request timed out")
    throw new TimeApiError(`TimeAPI request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function currentTime(timezone = "Europe/London"): Promise<string> {
  const zone = timezone.trim()
  if (!zone.includes("/")) throw new TimeApiError("timezone must be an IANA name, e.g. Europe/London")
  const body = await get<unknown>(`${API}/Time/current/zone?timeZone=${encodeURIComponent(zone)}`)
  const pad = (v: unknown): string => val(v).padStart(2, "0")
  return [
    `${zone} — ${val(at(body, "dayOfWeek"))}`,
    "",
    `Date: ${val(at(body, "year"))}-${pad(at(body, "month"))}-${pad(at(body, "day"))}`,
    `Time: ${pad(at(body, "hour"))}:${pad(at(body, "minute"))}:${pad(at(body, "seconds"))}`,
    `DST: ${val(at(body, "dstActive")) === "true" ? "yes" : "no"}`,
  ].join("\n")
}
