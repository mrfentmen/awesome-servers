/**
 * Openverse — Search openly licensed images and audio from Creative Commons. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.openverse.org.
 */
const API = "https://api.openverse.org/v1"

export class OpenverseError extends Error {}

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
      headers: { "user-agent": "openverse-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenverseError(`Openverse returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenverseError) throw e
    if ((e as Error).name === "AbortError") throw new OpenverseError("Openverse request timed out")
    throw new OpenverseError(`Openverse request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function images(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new OpenverseError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/images/?q=${encodeURIComponent(q)}&page_size=${size}`)
  const items = rows(at(body, "results"))
  if (items.length === 0) return `Openverse found no images for "${q}".`
  const total = val(at(body, "result_count"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "title")) || "(untitled)"
    const creator = val(at(r, "creator"))
    const licence = val(at(r, "license"))
    const bits = [creator, licence.toUpperCase()].filter((b) => b !== "").join(" · ")
    return `${i + 1}. ${title}${bits === "" ? "" : ` — ${bits}`}`
  })
  return [`Openverse images for "${q}" — ${total} total, showing ${items.length}`, "", ...lines].join("\n")
}
