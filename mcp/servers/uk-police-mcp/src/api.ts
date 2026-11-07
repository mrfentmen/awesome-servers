/**
 * UK Police Data — Street level crime reports for England, Wales and Northern Ireland. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against data.police.uk.
 */
const API = "https://data.police.uk/api"

export class UkPoliceError extends Error {}

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
      headers: { "user-agent": "uk-police-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new UkPoliceError(`UK Police Data returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof UkPoliceError) throw e
    if ((e as Error).name === "AbortError") throw new UkPoliceError("UK Police Data request timed out")
    throw new UkPoliceError(`UK Police Data request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function crimesNear(latitude = 52.629729, longitude = -1.131592, date = "2024-01"): Promise<string> {
  if (!/^\d{4}-\d{2}$/.test(date)) throw new UkPoliceError("date must be YYYY-MM")
  const body = await get<unknown>(`${API}/crimes-at-location?lat=${latitude}&lng=${longitude}&date=${date}`)
  const items = rows(body)
  if (items.length === 0) return `No crimes recorded near ${latitude},${longitude} in ${date}.`
  const counts = new Map<string, number>()
  for (const r of items) {
    const cat = val(at(r, "category")) || "other"
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }
  const lines = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([cat, n]) => `${cat}: ${n}`)
  return [`UK police crimes near ${latitude},${longitude} in ${date} — ${items.length} reports`, "", ...lines].join("\n")
}
