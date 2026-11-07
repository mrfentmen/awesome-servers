/**
 * VAT Comply — Foreign exchange rates and EU VAT rates from VAT Comply. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.vatcomply.com.
 */
const API = "https://api.vatcomply.com"

export class VatComplyError extends Error {}

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
      headers: { "user-agent": "vatcomply-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new VatComplyError(`VAT Comply returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof VatComplyError) throw e
    if ((e as Error).name === "AbortError") throw new VatComplyError("VAT Comply request timed out")
    throw new VatComplyError(`VAT Comply request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function exchangeRates(base = "USD"): Promise<string> {
  const code = base.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) throw new VatComplyError("base must be a three letter currency code")
  const body = await get<unknown>(`${API}/rates?base=${encodeURIComponent(code)}`)
  const rates = at(body, "rates")
  if (!rates || typeof rates !== "object") throw new VatComplyError("VAT Comply returned no rates")
  const entries = Object.entries(rates as Record<string, unknown>).slice(0, 12)
  const lines = entries.map(([c, v]) => `1 ${code} = ${val(v)} ${c}`)
  return [`VAT Comply rates for ${code} — ${val(at(body, "date"))}`, "", ...lines].join("\n")
}

export async function vatRates(): Promise<string> {
  const body = await get<unknown>(`${API}/vat_rates`)
  const items = rows(body)
  if (items.length === 0) throw new VatComplyError("VAT Comply returned no VAT rates")
  const lines = items.map((r) => `${val(at(r, "country_name"))}: ${val(at(r, "rates.standard"))}% standard`)
  return [`EU VAT rates — ${items.length} countries`, "", ...lines.slice(0, 15)].join("\n")
}
