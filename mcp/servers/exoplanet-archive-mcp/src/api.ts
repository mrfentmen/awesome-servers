/**
 * NASA Exoplanet Archive — Confirmed exoplanets with host stars and discovery data from NASA. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against exoplanetarchive.ipac.caltech.edu.
 */
const API = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

export class ExoplanetArchiveError extends Error {}

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
      headers: { "user-agent": "exoplanet-archive-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ExoplanetArchiveError(`NASA Exoplanet Archive returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ExoplanetArchiveError) throw e
    if ((e as Error).name === "AbortError") throw new ExoplanetArchiveError("NASA Exoplanet Archive request timed out")
    throw new ExoplanetArchiveError(`NASA Exoplanet Archive request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchPlanets(name: string, limit = 5): Promise<string> {
  const q = name.trim()
  if (q === "") throw new ExoplanetArchiveError("name must not be empty")
  const size = Math.min(25, Math.max(1, limit))
  const safe = q.replace(/'/g, "")
  const sql = `select top ${size} pl_name,hostname,disc_year,discoverymethod from pscomppars where pl_name like '%${safe}%'`
  const body = await get<unknown>(`${API}?query=${encodeURIComponent(sql)}&format=json`)
  const items = rows(body)
  if (items.length === 0) return `The archive has no planets matching "${q}".`
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "pl_name"))} — ${val(at(r, "hostname"))} (${val(at(r, "disc_year"))}, ${val(at(r, "discoverymethod"))})`)
  return [`Exoplanets matching "${q}" — ${items.length} shown`, "", ...lines].join("\n")
}
