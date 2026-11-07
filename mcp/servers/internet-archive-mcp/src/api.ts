/**
 * Internet Archive — Search books, audio and web items archived by the Internet Archive. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against archive.org.
 */
const API = "https://archive.org"

export class InternetArchiveError extends Error {}

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
      headers: { "user-agent": "internet-archive-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new InternetArchiveError(`Internet Archive returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof InternetArchiveError) throw e
    if ((e as Error).name === "AbortError") throw new InternetArchiveError("Internet Archive request timed out")
    throw new InternetArchiveError(`Internet Archive request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchItems(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new InternetArchiveError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const fields = "identifier,title,year,mediatype"
  const url = `${API}/advancedsearch.php?q=${encodeURIComponent(q)}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=mediatype&rows=${size}&page=1&output=json`
  const body = await get<unknown>(url)
  const items = rows(at(body, "response.docs"))
  if (items.length === 0) return `The Internet Archive has nothing for "${q}".`
  const total = val(at(body, "response.numFound"))
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "title"))} (${val(at(r, "year"))}, ${val(at(r, "mediatype"))}) — ${val(at(r, "identifier"))}`)
  return [`Internet Archive "${q}" — ${total} found, ${items.length} shown`, "", ...lines].join("\n")
}
