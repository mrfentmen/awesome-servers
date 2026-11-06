/**
 * Socrata — Search the Socrata catalogue of US city, state and federal datasets. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.us.socrata.com.
 */
const API = "https://api.us.socrata.com/api"

export class SocrataError extends Error {}

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
      headers: { "user-agent": "socrata-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new SocrataError(`Socrata returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof SocrataError) throw e
    if ((e as Error).name === "AbortError") throw new SocrataError("Socrata request timed out")
    throw new SocrataError(`Socrata request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function catalog(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new SocrataError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/catalog/v1?q=${encodeURIComponent(q)}&limit=${size}`)
  const items = rows(at(body, "results"))
  if (items.length === 0) return `Socrata found nothing for "${q}".`
  const lines = items.map((r, i) => {
    const name = val(at(r, "resource.name"))
    const domain = val(at(r, "metadata.domain"))
    const rowsCount = at(r, "resource.rowsUpdatedAt")
    return `${i + 1}. ${name}${domain === "" ? "" : ` — ${domain}`}${typeof rowsCount === "number" ? "" : ""}`
  })
  return [`Socrata datasets for "${q}" — showing ${items.length}`, "", ...lines].join("\n")
}
