/**
 * IMF DataMapper — IMF economic indicators such as GDP and inflation by country and year. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against www.imf.org.
 */
const API = "https://www.imf.org/external/datamapper/api/v1"

export class ImfError extends Error {}

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
      headers: { "user-agent": "imf-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ImfError(`IMF DataMapper returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ImfError) throw e
    if ((e as Error).name === "AbortError") throw new ImfError("IMF DataMapper request timed out")
    throw new ImfError(`IMF DataMapper request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getIndicator(indicatorCode = "NGDPD", country = "USA"): Promise<string> {
  const code = indicatorCode.trim().toUpperCase()
  const iso = country.trim().toUpperCase()
  if (code === "") throw new ImfError("indicator code must not be empty")
  const body = await get<unknown>(`${API}/${encodeURIComponent(code)}`)
  const series = at(body, `values.${code}.${iso}`)
  if (!series || typeof series !== "object") return `The IMF has no ${code} series for ${iso}.`
  const years = Object.keys(series as Record<string, unknown>).sort()
  const recent = years.slice(-5)
  const lines = recent.map((y) => `${y}: ${val((series as Record<string, unknown>)[y])}`)
  return [`IMF ${code} for ${iso} — ${years.length} years`, "", ...lines].join("\n")
}
