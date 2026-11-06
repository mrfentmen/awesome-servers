/**
 * Figshare — Search open research outputs published on Figshare, with DOIs and links. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.figshare.com.
 */
const API = "https://api.figshare.com/v2"

export class FigshareError extends Error {}

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
      headers: { "user-agent": "figshare-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new FigshareError(`Figshare returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof FigshareError) throw e
    if ((e as Error).name === "AbortError") throw new FigshareError("Figshare request timed out")
    throw new FigshareError(`Figshare request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new FigshareError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/articles/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ search_for: q, page_size: size, order: "published_date", order_direction: "desc" }),
  })
  const items = rows(body)
  if (items.length === 0) return `Figshare found nothing for "${q}".`
  const lines = items.map((r, i) => {
    const title = val(at(r, "title"))
    const doi = val(at(r, "doi"))
    return `${i + 1}. ${title}${doi === "" ? "" : ` — ${doi}`}`
  })
  return [`Figshare items for "${q}" — ${items.length} shown`, "", ...lines].join("\n")
}
