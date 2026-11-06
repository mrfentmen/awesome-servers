/**
 * EU Open Data — Search the European Union open data portal. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against data.europa.eu.
 */
const API = "https://data.europa.eu/api/hub/search"

export class EuropeDataError extends Error {}

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
      headers: { "user-agent": "europe-data-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new EuropeDataError(`EU Open Data returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof EuropeDataError) throw e
    if ((e as Error).name === "AbortError") throw new EuropeDataError("EU Open Data request timed out")
    throw new EuropeDataError(`EU Open Data request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function datasets(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new EuropeDataError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/search?q=${encodeURIComponent(q)}&limit=${size}`)
  const items = rows(at(body, "result.results"))
  if (items.length === 0) return `EU Open Data found nothing for "${q}".`
  const total = val(at(body, "result.count"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "title"))
    const publisher = val(at(r, "publisher.name")) || val(at(r, "catalog.title"))
    return `${i + 1}. ${title}${publisher === "" ? "" : ` — ${publisher}`}`
  })
  return [`EU datasets for "${q}" — ${total} total, showing ${items.length}`, "", ...lines].join("\n")
}
