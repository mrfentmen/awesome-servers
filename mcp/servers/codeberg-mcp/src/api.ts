/**
 * Codeberg — Search public repositories hosted on Codeberg. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against codeberg.org.
 */
const API = "https://codeberg.org/api/v1"

export class CodebergError extends Error {}

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
      headers: { "user-agent": "codeberg-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new CodebergError(`Codeberg returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof CodebergError) throw e
    if ((e as Error).name === "AbortError") throw new CodebergError("Codeberg request timed out")
    throw new CodebergError(`Codeberg request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function repos(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new CodebergError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/repos/search?q=${encodeURIComponent(q)}&limit=${size}`)
  const items = rows(at(body, "data"))
  if (items.length === 0) return `Codeberg found no repositories for "${q}".`
  const lines = items.map((r, i) => {
    const name = val(at(r, "full_name"))
    const stars = at(r, "stars_count")
    const desc = val(at(r, "description"))
    const bits = [typeof stars === "number" ? `${stars} stars` : "", desc].filter((b) => b !== "").join(" · ")
    return `${i + 1}. ${name}${bits === "" ? "" : ` — ${bits}`}`
  })
  return [`Codeberg repositories for "${q}" — showing ${items.length}`, "", ...lines].join("\n")
}
