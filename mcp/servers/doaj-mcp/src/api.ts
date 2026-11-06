/**
 * DOAJ — Search the Directory of Open Access Journals for free full-text articles. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against doaj.org.
 */
const API = "https://doaj.org/api"

export class DoajError extends Error {}

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
      headers: { "user-agent": "doaj-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DoajError(`DOAJ returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DoajError) throw e
    if ((e as Error).name === "AbortError") throw new DoajError("DOAJ request timed out")
    throw new DoajError(`DOAJ request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new DoajError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/search/articles/${encodeURIComponent(q)}?pageSize=${size}`)
  const items = rows(at(body, "results"))
  if (items.length === 0) return `DOAJ found nothing for "${q}".`
  const total = val(at(body, "total"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "bibjson.title"))
    const year = val(at(r, "bibjson.year"))
    const journal = val(at(r, "bibjson.journal.title"))
    const bits = [year, journal].filter((b) => b !== "").join(" · ")
    return `${i + 1}. ${title}${bits === "" ? "" : ` — ${bits}`}`
  })
  return [`DOAJ articles for "${q}" — ${total} total, showing ${items.length}`, "", ...lines].join("\n")
}
