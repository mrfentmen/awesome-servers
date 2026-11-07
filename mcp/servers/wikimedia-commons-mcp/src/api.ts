/**
 * Wikimedia Commons — Search free images, audio and video on Wikimedia Commons. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against commons.wikimedia.org.
 */
const API = "https://commons.wikimedia.org/w/api.php"

export class WikimediaCommonsError extends Error {}

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
      headers: { "user-agent": "wikimedia-commons-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new WikimediaCommonsError(`Wikimedia Commons returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof WikimediaCommonsError) throw e
    if ((e as Error).name === "AbortError") throw new WikimediaCommonsError("Wikimedia Commons request timed out")
    throw new WikimediaCommonsError(`Wikimedia Commons request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


const strip = (s: string): string => s.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&")

export async function searchMedia(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new WikimediaCommonsError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const url = `${API}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=${size}&format=json&origin=*`
  const body = await get<unknown>(url)
  const items = rows(at(body, "query.search"))
  if (items.length === 0) return `Commons has no media for "${q}".`
  const total = val(at(body, "query.searchinfo.totalhits"))
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "title"))} — ${strip(val(at(r, "snippet"))).slice(0, 90)}`)
  return [`Wikimedia Commons "${q}" — ${total} files, ${items.length} shown`, "", ...lines].join("\n")
}
