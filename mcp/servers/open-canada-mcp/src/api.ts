/**
 * Open Government Canada — Search Canadian federal open datasets on open.canada.ca. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against open.canada.ca.
 */
const API = "https://open.canada.ca/data/api/3/action"

export class OpenCanadaError extends Error {}

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
      headers: { "user-agent": "open-canada-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenCanadaError(`Open Government Canada returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenCanadaError) throw e
    if ((e as Error).name === "AbortError") throw new OpenCanadaError("Open Government Canada request timed out")
    throw new OpenCanadaError(`Open Government Canada request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchDatasets(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new OpenCanadaError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/package_search?q=${encodeURIComponent(q)}&rows=${size}`)
  const items = rows(at(body, "result.results"))
  if (items.length === 0) return `open.canada.ca found nothing for "${q}".`
  const total = val(at(body, "result.count"))
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "title"))} — ${val(at(r, "organization.title"))}`)
  return [`open.canada.ca "${q}" — ${total} datasets, ${items.length} shown`, "", ...lines].join("\n")
}
