/**
 * OpenF1 — Formula 1 live timing data: drivers, sessions and lap times. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.openf1.org.
 */
const API = "https://api.openf1.org/v1"

export class OpenF1Error extends Error {}

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
      headers: { "user-agent": "openf1-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenF1Error(`OpenF1 returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenF1Error) throw e
    if ((e as Error).name === "AbortError") throw new OpenF1Error("OpenF1 request timed out")
    throw new OpenF1Error(`OpenF1 request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function sessionDrivers(): Promise<string> {
  const body = await get<unknown>(`${API}/drivers?session_key=latest`)
  const items = rows(body)
  if (items.length === 0) throw new OpenF1Error("OpenF1 returned no drivers")
  const lines = items.map((r) => `#${val(at(r, "driver_number"))} ${val(at(r, "full_name"))} — ${val(at(r, "team_name"))} (${val(at(r, "country_code"))})`)
  return [`OpenF1 latest session — ${items.length} drivers`, "", ...lines].join("\n")
}
