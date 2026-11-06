/**
 * Open Notify — Where the International Space Station is right now. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.open-notify.org.
 */
const API = "http://api.open-notify.org"

export class OpenNotifyError extends Error {}

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
      headers: { "user-agent": "open-notify-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenNotifyError(`Open Notify returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenNotifyError) throw e
    if ((e as Error).name === "AbortError") throw new OpenNotifyError("Open Notify request timed out")
    throw new OpenNotifyError(`Open Notify request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function issNow(): Promise<string> {
  const body = await get<unknown>(`${API}/iss-now.json`)
  const lat = val(at(body, "iss_position.latitude"))
  const lon = val(at(body, "iss_position.longitude"))
  const ts = at(body, "timestamp")
  const when = typeof ts === "number" ? new Date(ts * 1000).toISOString() : ""
  return [`ISS is at ${lat}, ${lon}`, "", when === "" ? "" : `Measured: ${when}`, "Open the map: https://open-notify.org/Open-Notify-API/ISS-Location-Now/"].filter((l) => l !== "").join("\n")
}

export async function peopleInSpace(): Promise<string> {
  const body = await get<unknown>(`${API}/astros.json`)
  const people = rows(at(body, "people"))
  const lines = people.map((p, i) => `${i + 1}. ${val(at(p, "name"))} — ${val(at(p, "craft"))}`)
  return [`${val(at(body, "number"))} people in space`, "", ...lines].join("\n")
}
