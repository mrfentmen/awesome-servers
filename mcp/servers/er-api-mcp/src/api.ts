/**
 * ExchangeRate-API — Daily exchange rates for 160+ currencies, no key needed. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against open.er-api.com.
 */
const API = "https://open.er-api.com/v6"

export class ExchangeRateError extends Error {}

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
      headers: { "user-agent": "er-api-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ExchangeRateError(`ExchangeRate-API returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ExchangeRateError) throw e
    if ((e as Error).name === "AbortError") throw new ExchangeRateError("ExchangeRate-API request timed out")
    throw new ExchangeRateError(`ExchangeRate-API request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function convert(base: string, target: string): Promise<string> {
  const from = base.trim().toUpperCase()
  const to = target.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) throw new ExchangeRateError("base and target must be 3-letter currency codes")
  const body = await get<unknown>(`${API}/latest/${from}`)
  if (val(at(body, "result")) !== "success") throw new ExchangeRateError(val(at(body, "error-type")) || "exchange rate lookup failed")
  const rate = at(body, `rates.${to}`)
  if (typeof rate !== "number") throw new ExchangeRateError(`ExchangeRate-API has no rate for ${to}`)
  const updated = val(at(body, "time_last_update_utc"))
  return [
    `1 ${from} = ${rate} ${to}`,
    "",
    `Currencies available: ${Object.keys((at(body, "rates") as Row | undefined) ?? {}).length}`,
    updated === "" ? "" : `Updated: ${updated}`,
    `Source: ${val(at(body, "provider"))}`,
  ]
    .filter((line) => line !== "")
    .join("\n")
}
