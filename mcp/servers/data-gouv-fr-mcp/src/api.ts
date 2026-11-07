/**
 * data.gouv.fr — Search French open data datasets on data.gouv.fr. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against www.data.gouv.fr.
 */
const API = "https://www.data.gouv.fr/api/1"

export class DataGouvFrError extends Error {}

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
      headers: { "user-agent": "data-gouv-fr-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DataGouvFrError(`data.gouv.fr returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DataGouvFrError) throw e
    if ((e as Error).name === "AbortError") throw new DataGouvFrError("data.gouv.fr request timed out")
    throw new DataGouvFrError(`data.gouv.fr request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchDatasets(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new DataGouvFrError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/datasets/?q=${encodeURIComponent(q)}&page_size=${size}`)
  const items = rows(at(body, "data"))
  if (items.length === 0) return `data.gouv.fr found nothing for "${q}".`
  const total = val(at(body, "total"))
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "title"))} — ${val(at(r, "organization.name"))} (updated ${val(at(r, "last_update")).slice(0, 10)})`)
  return [`data.gouv.fr "${q}" — ${total} datasets, ${items.length} shown`, "", ...lines].join("\n")
}
