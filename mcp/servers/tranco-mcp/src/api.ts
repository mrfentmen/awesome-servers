/**
 * Tranco — Tranco popularity ranking for domains, from the research grade top sites list. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against tranco-list.eu.
 */
const API = "https://tranco-list.eu/api"

export class TrancoError extends Error {}

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
      headers: { "user-agent": "tranco-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new TrancoError(`Tranco returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof TrancoError) throw e
    if ((e as Error).name === "AbortError") throw new TrancoError("Tranco request timed out")
    throw new TrancoError(`Tranco request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function domainRank(domain: string): Promise<string> {
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) throw new TrancoError("domain must look like example.com")
  const body = await get<unknown>(`${API}/ranks/domain/${encodeURIComponent(d)}`)
  const items = rows(at(body, "ranks"))
  if (items.length === 0) return `Tranco has no ranking for ${d}.`
  const lines = items.slice(0, 5).map((r) => `${val(at(r, "date"))}: rank ${val(at(r, "rank"))}`)
  return [`Tranco ranks for ${d}`, "", ...lines].join("\n")
}
