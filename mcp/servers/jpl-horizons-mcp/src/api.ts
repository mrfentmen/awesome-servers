/**
 * JPL Horizons — Solar system body positions and ephemerides from NASA JPL. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against ssd.jpl.nasa.gov.
 */
const API = "https://ssd.jpl.nasa.gov/api"

export class HorizonsError extends Error {}

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
      headers: { "user-agent": "jpl-horizons-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new HorizonsError(`JPL Horizons returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof HorizonsError) throw e
    if ((e as Error).name === "AbortError") throw new HorizonsError("JPL Horizons request timed out")
    throw new HorizonsError(`JPL Horizons request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function getText(url: string, timeoutMs = 30000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "jpl-horizons-mcp", accept: "*/*" } })
    if (!res.ok) throw new HorizonsError(`JPL Horizons returned HTTP ${res.status}`)
    return await res.text()
  } catch (e) {
    if (e instanceof HorizonsError) throw e
    if ((e as Error).name === "AbortError") throw new HorizonsError("JPL Horizons request timed out")
    throw new HorizonsError(`JPL Horizons request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function ephemeris(target = "499"): Promise<string> {
  const id = target.trim()
  if (!/^[0-9A-Za-z; ]{1,20}$/.test(id)) throw new HorizonsError("target must be a Horizons id such as 499")
  const url = `${API}/horizons.api?format=text&COMMAND=%27${encodeURIComponent(id)}%27&EPHEM_TYPE=OBSERVER&CENTER=%27500@10%27&START_TIME=%272026-11-01%27&STOP_TIME=%272026-11-03%27&STEP_SIZE=%271%20d%27&QUANTITIES=%271,20%27`
  const text = await getText(url)
  const name = (text.match(/Target body name:\s*(.+)/) ?? [])[1] ?? id
  const start = text.indexOf("$$SOE")
  const end = text.indexOf("$$EOE")
  const table = start >= 0 && end > start ? text.slice(start + 5, end).trim().split("\n").slice(0, 6) : []
  if (table.length === 0) throw new HorizonsError(`no ephemeris rows for ${id}`)
  return [`${name.trim()} — topocentric ephemeris from Earth`, "", ...table].join("\n")
}
