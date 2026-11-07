/**
 * Art Institute of Chicago — Artworks from the Art Institute of Chicago public collection API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.artic.edu.
 */
const API = "https://api.artic.edu/api/v1"

export class ArtInstituteError extends Error {}

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
      headers: { "user-agent": "art-institute-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ArtInstituteError(`Art Institute of Chicago returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ArtInstituteError) throw e
    if ((e as Error).name === "AbortError") throw new ArtInstituteError("Art Institute of Chicago request timed out")
    throw new ArtInstituteError(`Art Institute of Chicago request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchArtworks(query: string, limit = 5): Promise<string> {
  const q = query.trim()
  if (q === "") throw new ArtInstituteError("query must not be empty")
  const size = Math.min(25, Math.max(1, limit))
  const fields = "id,title,artist_display,date_display,medium_display"
  const body = await get<unknown>(`${API}/artworks/search?q=${encodeURIComponent(q)}&limit=${size}&fields=${fields}`)
  const items = rows(at(body, "data"))
  if (items.length === 0) return `The Art Institute has nothing for "${q}".`
  const total = val(at(body, "pagination.total"))
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "title"))} — ${val(at(r, "artist_display")).split("\n")[0]} (${val(at(r, "date_display"))})`)
  return [`Art Institute of Chicago "${q}" — ${total} works, ${items.length} shown`, "", ...lines].join("\n")
}
