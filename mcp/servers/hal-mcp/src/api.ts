/**
 * HAL — Search HAL, the French national open archive of academic papers. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.archives-ouvertes.fr.
 */
const API = "https://api.archives-ouvertes.fr"

export class HalError extends Error {}

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
      headers: { "user-agent": "hal-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new HalError(`HAL returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof HalError) throw e
    if ((e as Error).name === "AbortError") throw new HalError("HAL request timed out")
    throw new HalError(`HAL request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new HalError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/search/?q=${encodeURIComponent(q)}&rows=${size}&fl=title_s,producedDateY_i,uri_s&wt=json`)
  const items = rows(at(body, "response.docs"))
  if (items.length === 0) return `HAL found nothing for "${q}".`
  const total = val(at(body, "response.numFound"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "title_s"))
    const year = val(at(r, "producedDateY_i"))
    const uri = val(at(r, "uri_s"))
    return `${i + 1}. ${title}${year === "" ? "" : ` (${year})`}${uri === "" ? "" : ` — ${uri}`}`
  })
  return [`HAL papers for "${q}" — ${total} total, showing ${items.length}`, "", ...lines].join("\n")
}
