/**
 * Kitsu — Anime and manga catalogue with ratings and episode counts. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against kitsu.io.
 */
const API = "https://kitsu.io/api/edge"

export class KitsuError extends Error {}

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
      headers: { "user-agent": "kitsu-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new KitsuError(`Kitsu returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof KitsuError) throw e
    if ((e as Error).name === "AbortError") throw new KitsuError("Kitsu request timed out")
    throw new KitsuError(`Kitsu request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchAnime(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new KitsuError("query must not be empty")
  const size = Math.min(20, Math.max(1, limit))
  const body = await get<unknown>(`${API}/anime?filter[text]=${encodeURIComponent(q)}&page[limit]=${size}`, {
    headers: { accept: "application/vnd.api+json" },
  })
  const items = rows(at(body, "data"))
  if (items.length === 0) return `Kitsu found no anime for "${q}".`
  const total = val(at(body, "meta.count"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "attributes.canonicalTitle"))
    const rating = val(at(r, "attributes.averageRating"))
    const episodes = val(at(r, "attributes.episodeCount"))
    const bits = [rating === "" ? "" : `${rating}/100`, episodes === "" ? "" : `${episodes} eps`].filter((b) => b !== "").join(" · ")
    return `${i + 1}. ${title}${bits === "" ? "" : ` — ${bits}`}`
  })
  return [`Kitsu anime for "${q}"${total === "" ? "" : ` — ${total} total`}, showing ${items.length}`, "", ...lines].join("\n")
}
