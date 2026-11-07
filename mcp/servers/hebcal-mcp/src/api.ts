/**
 * Hebcal — Jewish holidays, Torah readings and Hebrew calendar data from Hebcal. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against www.hebcal.com.
 */
const API = "https://www.hebcal.com"

export class HebcalError extends Error {}

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
      headers: { "user-agent": "hebcal-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new HebcalError(`Hebcal returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof HebcalError) throw e
    if ((e as Error).name === "AbortError") throw new HebcalError("Hebcal request timed out")
    throw new HebcalError(`Hebcal request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function holidays(year = 2026, month = 11): Promise<string> {
  if (month < 1 || month > 12) throw new HebcalError("month must be 1 to 12")
  const url = `${API}/hebcal?v=1&cfg=json&maj=on&min=on&year=${year}&month=${month}`
  const body = await get<unknown>(url)
  const items = rows(at(body, "items"))
  if (items.length === 0) return `Hebcal lists nothing for ${year}-${String(month).padStart(2, "0")}.`
  const lines = items.slice(0, 20).map((r, i) => `${i + 1}. ${val(at(r, "date"))} — ${val(at(r, "title"))}`)
  return [`Hebcal ${year}-${String(month).padStart(2, "0")} — ${items.length} entries`, "", ...lines].join("\n")
}
