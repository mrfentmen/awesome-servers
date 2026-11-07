/**
 * eCFR — US Code of Federal Regulations titles and their latest amendments. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against www.ecfr.gov.
 */
const API = "https://www.ecfr.gov/api/versioner/v1"

export class EcfrError extends Error {}

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
      headers: { "user-agent": "ecfr-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new EcfrError(`eCFR returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof EcfrError) throw e
    if ((e as Error).name === "AbortError") throw new EcfrError("eCFR request timed out")
    throw new EcfrError(`eCFR request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function listTitles(limit = 15): Promise<string> {
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/titles.json`)
  const items = rows(at(body, "titles")).slice(0, size)
  if (items.length === 0) throw new EcfrError("eCFR returned no titles")
  const lines = items.map((r, i) => `${i + 1}. Title ${val(at(r, "number"))} — ${val(at(r, "name"))} (amended ${val(at(r, "latest_amended_on"))})`)
  return [`eCFR titles — ${rows(at(body, "titles")).length} total`, "", ...lines].join("\n")
}
