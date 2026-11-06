/**
 * ip-api — Look up where an IP address is: country, city, ISP and timezone. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against ip-api.com.
 */
const API = "http://ip-api.com"

export class IpApiError extends Error {}

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
      headers: { "user-agent": "ip-api-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new IpApiError(`ip-api returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof IpApiError) throw e
    if ((e as Error).name === "AbortError") throw new IpApiError("ip-api request timed out")
    throw new IpApiError(`ip-api request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function lookup(ip: string): Promise<string> {
  const target = ip.trim()
  if (target === "") throw new IpApiError("ip must not be empty")
  const body = await get<unknown>(`${API}/json/${encodeURIComponent(target)}?fields=status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as`)
  if (val(at(body, "status")) === "fail") throw new IpApiError(val(at(body, "message")) || "ip-api could not look up that address")
  const fields: Array<[string, string]> = [
    ["IP", "query"], ["Country", "country"], ["Region", "regionName"], ["City", "city"], ["ZIP", "zip"],
    ["Latitude", "lat"], ["Longitude", "lon"], ["Timezone", "timezone"],
    ["ISP", "isp"], ["Organisation", "org"], ["ASN", "as"],
  ]
  return [val(at(body, "query")), "", ...fields.filter(([, k]) => val(at(body, k)) !== "").map(([label, k]) => `${label}: ${val(at(body, k))}`)].join("\n")
}
