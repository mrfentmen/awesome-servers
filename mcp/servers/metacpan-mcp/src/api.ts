/**
 * MetaCPAN — Search CPAN Perl module releases. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against fastapi.metacpan.org.
 */
const API = "https://fastapi.metacpan.org/v1"

export class MetaCpanError extends Error {}

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
      headers: { "user-agent": "metacpan-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new MetaCpanError(`MetaCPAN returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof MetaCpanError) throw e
    if ((e as Error).name === "AbortError") throw new MetaCpanError("MetaCPAN request timed out")
    throw new MetaCpanError(`MetaCPAN request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new MetaCpanError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/release/_search?q=${encodeURIComponent(q)}&size=${size}`)
  const items = rows(at(body, "hits.hits"))
  if (items.length === 0) return `MetaCPAN found nothing for "${q}".`
  const total = val(at(body, "hits.total.value"))
  const lines = items.map((r, i) => {
    const name = val(at(r, "_source.name"))
    const abstract = val(at(r, "_source.abstract"))
    return `${i + 1}. ${name}${abstract === "" ? "" : ` — ${abstract}`}`
  })
  return [`MetaCPAN releases for "${q}" — ${total} total, showing ${items.length}`, "", ...lines].join("\n")
}
