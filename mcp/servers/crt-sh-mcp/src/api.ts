/**
 * crt.sh — Certificate transparency logs: every TLS certificate issued for a domain. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against crt.sh.
 */
const API = "https://crt.sh"

export class CrtShError extends Error {}

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
      headers: { "user-agent": "crt-sh-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new CrtShError(`crt.sh returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof CrtShError) throw e
    if ((e as Error).name === "AbortError") throw new CrtShError("crt.sh request timed out")
    throw new CrtShError(`crt.sh request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


async function getWithRetry(url: string): Promise<unknown> {
  let last: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await get<unknown>(url)
    } catch (e) {
      last = e
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
    }
  }
  throw last
}

export async function searchCertificates(domain: string, limit = 10): Promise<string> {
  const d = domain.trim().toLowerCase()
  if (!/^[a-z0-9.-]+$/.test(d)) throw new CrtShError("domain must be a plain hostname, e.g. example.com")
  const size = Math.min(50, Math.max(1, limit))
  const body = await getWithRetry(`${API}/?q=${encodeURIComponent(d)}&output=json`)
  const items = rows(body).slice(0, size)
  if (items.length === 0) return `crt.sh has no certificates for ${d}.`
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "common_name"))} — issued ${val(at(r, "not_before")).slice(0, 10)} by ${val(at(r, "issuer_name")).slice(0, 60)}`)
  const total = rows(body).length
  return [`crt.sh certificates for ${d} — ${total} found, ${items.length} shown`, "", ...lines].join("\n")
}
