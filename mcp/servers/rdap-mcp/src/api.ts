/**
 * RDAP — Domain registration data from RDAP, the modern replacement for WHOIS. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against rdap.org.
 */
const API = "https://rdap.org"

export class RdapError extends Error {}

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
      headers: { "user-agent": "rdap-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new RdapError(`RDAP returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof RdapError) throw e
    if ((e as Error).name === "AbortError") throw new RdapError("RDAP request timed out")
    throw new RdapError(`RDAP request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function lookupDomain(domain: string): Promise<string> {
  const d = domain.trim().toLowerCase()
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) throw new RdapError("domain must look like example.com")
  const body = await get<unknown>(`${API}/domain/${encodeURIComponent(d)}`)
  const events = rows(at(body, "events"))
  const find = (action: string): string => {
    const hit = events.find((e) => val(at(e, "eventAction")) === action)
    return hit ? val(at(hit, "eventDate")).slice(0, 10) : "n/a"
  }
  const status = rows(at(body, "status")).map((s) => val(s)).filter((s) => s !== "")
  const registrar = rows(at(body, "entities")).map((e) => val(at(e, "vcardArray"))).filter((s) => s !== "")
  return [
    `${val(at(body, "ldhName")) || d}`,
    "",
    `Registered: ${find("registration")}`,
    `Expires: ${find("expiration")}`,
    `Last changed: ${find("last changed")}`,
    `Status: ${status.length === 0 ? "n/a" : status.join(", ")}`,
    `Entities: ${registrar.length}`,
  ].join("\n")
}
