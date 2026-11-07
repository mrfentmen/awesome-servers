/**
 * Arch User Repository — Search Arch Linux AUR packages, versions and vote counts. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against aur.archlinux.org.
 */
const API = "https://aur.archlinux.org/rpc/v5"

export class AurError extends Error {}

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
      headers: { "user-agent": "aur-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new AurError(`Arch User Repository returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof AurError) throw e
    if ((e as Error).name === "AbortError") throw new AurError("Arch User Repository request timed out")
    throw new AurError(`Arch User Repository request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchPackages(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new AurError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/search/${encodeURIComponent(q)}?by=name-desc`)
  const items = rows(at(body, "results")).slice(0, size)
  if (items.length === 0) return `The AUR has no packages matching "${q}".`
  const total = val(at(body, "resultcount"))
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "Name"))} ${val(at(r, "Version"))} — ${val(at(r, "Description")).slice(0, 80)} (${val(at(r, "NumVotes"))} votes)`)
  return [`AUR "${q}" — ${total} packages, ${items.length} shown`, "", ...lines].join("\n")
}
