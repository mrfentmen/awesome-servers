/**
 * INSPIRE-HEP — High energy physics papers, authors and citations from INSPIRE-HEP. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against inspirehep.net.
 */
const API = "https://inspirehep.net/api"

export class InspireHepError extends Error {}

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
      headers: { "user-agent": "inspirehep-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new InspireHepError(`INSPIRE-HEP returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof InspireHepError) throw e
    if ((e as Error).name === "AbortError") throw new InspireHepError("INSPIRE-HEP request timed out")
    throw new InspireHepError(`INSPIRE-HEP request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchLiterature(query: string, limit = 5): Promise<string> {
  const q = query.trim()
  if (q === "") throw new InspireHepError("query must not be empty")
  const size = Math.min(25, Math.max(1, limit))
  const body = await get<unknown>(`${API}/literature?q=${encodeURIComponent(q)}&size=${size}&sort=mostrecent`)
  const items = rows(at(body, "hits.hits"))
  if (items.length === 0) return `INSPIRE-HEP found nothing for "${q}".`
  const total = val(at(body, "hits.total"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "metadata.titles"))
    const arxiv = val(at(r, "metadata.arxiv_eprints"))
    return `${i + 1}. ${title}${arxiv === "" ? "" : ` — arXiv:${arxiv}`}`
  })
  return [`INSPIRE-HEP "${q}" — ${total} total, ${items.length} shown`, "", ...lines].join("\n")
}
