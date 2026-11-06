/**
 * WHO GHO — Search World Health Organization indicators from the Global Health Observatory. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against ghoapi.azureedge.net.
 */
const API = "https://ghoapi.azureedge.net/api"

export class WhoGhoError extends Error {}

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
      headers: { "user-agent": "who-gho-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new WhoGhoError(`WHO GHO returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof WhoGhoError) throw e
    if ((e as Error).name === "AbortError") throw new WhoGhoError("WHO GHO request timed out")
    throw new WhoGhoError(`WHO GHO request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function indicators(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new WhoGhoError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const filter = encodeURIComponent(`contains(IndicatorName,'${q.replace(/'/g, "''")}')`)
  const body = await get<unknown>(`${API}/Indicator?$filter=${filter}&$top=${size}`)
  const items = rows(at(body, "value"))
  if (items.length === 0) return `WHO has no indicators matching "${q}".`
  const lines = items.map((r, i) => {
    const name = val(at(r, "IndicatorName"))
    const code = val(at(r, "IndicatorCode"))
    return `${i + 1}. ${name}${code === "" ? "" : ` — ${code}`}`
  })
  return [`WHO indicators matching "${q}" — showing ${items.length}`, "", ...lines].join("\n")
}
