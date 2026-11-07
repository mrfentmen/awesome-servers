/**
 * endoflife.date — Support and end of life dates for languages, frameworks and databases. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against endoflife.date.
 */
const API = "https://endoflife.date/api"

export class EndOfLifeDateError extends Error {}

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
      headers: { "user-agent": "endoflife-date-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new EndOfLifeDateError(`endoflife.date returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof EndOfLifeDateError) throw e
    if ((e as Error).name === "AbortError") throw new EndOfLifeDateError("endoflife.date request timed out")
    throw new EndOfLifeDateError(`endoflife.date request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getProduct(product: string): Promise<string> {
  const name = product.trim().toLowerCase()
  if (name === "") throw new EndOfLifeDateError("product must not be empty")
  const body = await get<unknown>(`${API}/${encodeURIComponent(name)}.json`)
  const cycles = rows(body)
  if (cycles.length === 0) return `endoflife.date has no product called "${name}".`
  const lines = cycles.slice(0, 10).map((c) => {
    const raw = at(c, "eol")
    const eol = val(raw)
    const state = raw === false || eol === "false" || eol === "" ? "supported" : `EOL ${eol}`
    return `${val(at(c, "cycle"))}: released ${val(at(c, "releaseDate"))}, latest ${val(at(c, "latest"))} — ${state}`
  })
  return [`endoflife.date ${name} — ${cycles.length} cycles`, "", ...lines].join("\n")
}
