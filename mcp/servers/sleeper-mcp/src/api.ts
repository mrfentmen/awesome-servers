/**
 * Sleeper — Current NFL season state from the Sleeper fantasy football API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.sleeper.app.
 */
const API = "https://api.sleeper.app/v1"

export class SleeperError extends Error {}

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
      headers: { "user-agent": "sleeper-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new SleeperError(`Sleeper returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof SleeperError) throw e
    if ((e as Error).name === "AbortError") throw new SleeperError("Sleeper request timed out")
    throw new SleeperError(`Sleeper request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function leagueState(): Promise<string> {
  const body = await get<unknown>(`${API}/state/nfl`)
  return [
    `NFL ${val(at(body, "season"))} — ${val(at(body, "season_type"))}`.trim(),
    "",
    `Week: ${val(at(body, "week"))}`,
    `Leg: ${val(at(body, "leg"))}`,
    `Previous season: ${val(at(body, "previous_season"))}`,
    `League season: ${val(at(body, "league_season"))}`,
  ].join("\n")
}
