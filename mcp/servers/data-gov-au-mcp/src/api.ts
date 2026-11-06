/**
 * data.gov.au — Search Australian government open datasets. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against data.gov.au.
 */
const API = "https://data.gov.au/data/api/3/action"

export class DataGovAuError extends Error {}

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
      headers: { "user-agent": "data-gov-au-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DataGovAuError(`data.gov.au returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DataGovAuError) throw e
    if ((e as Error).name === "AbortError") throw new DataGovAuError("data.gov.au request timed out")
    throw new DataGovAuError(`data.gov.au request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function datasets(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new DataGovAuError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/package_search?q=${encodeURIComponent(q)}&rows=${size}`)
  const items = rows(at(body, "result.results"))
  if (items.length === 0) return `data.gov.au found no datasets for "${q}".`
  const total = val(at(body, "result.count"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "title"))
    const name = val(at(r, "name"))
    const formats = rows(at(r, "resources")).map((x) => val(at(x, "format"))).filter((f) => f !== "")
    const unique = [...new Set(formats)].slice(0, 4).join(", ")
    return `${i + 1}. ${title}${unique === "" ? "" : ` — ${unique}`}${name === "" ? "" : ` (${name})`}`
  })
  return [`Australian datasets for "${q}" — ${total} total, showing ${items.length}`, "", ...lines].join("\n")
}
