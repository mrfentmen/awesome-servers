/**
 * OSF — Search projects on the Open Science Framework, the free research workspace. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.osf.io.
 */
const API = "https://api.osf.io/v2"

export class OsfError extends Error {}

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
      headers: { "user-agent": "osf-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OsfError(`OSF returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OsfError) throw e
    if ((e as Error).name === "AbortError") throw new OsfError("OSF request timed out")
    throw new OsfError(`OSF request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new OsfError("query must not be empty")
  const size = Math.min(100, Math.max(1, limit))
  const body = await get<unknown>(`${API}/nodes/?filter[title]=${encodeURIComponent(q)}&page[size]=${size}`)
  const items = rows(at(body, "data"))
  if (items.length === 0) return `OSF found no projects for "${q}".`
  const total = val(at(body, "links.meta.total"))
  const lines = items.map((r, i) => {
    const title = val(at(r, "attributes.title"))
    const created = val(at(r, "attributes.date_created")).slice(0, 10)
    return `${i + 1}. ${title}${created === "" ? "" : ` — created ${created}`}`
  })
  const head = `OSF projects for "${q}"${total === "" ? "" : ` — ${total} total`}, showing ${items.length}`
  return [head, "", ...lines].join("\n")
}
