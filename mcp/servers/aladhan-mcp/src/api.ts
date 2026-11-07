/**
 * AlAdhan — Daily Islamic prayer times for any city from the AlAdhan API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.aladhan.com.
 */
const API = "https://api.aladhan.com/v1"

export class AlAdhanError extends Error {}

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
      headers: { "user-agent": "aladhan-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new AlAdhanError(`AlAdhan returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof AlAdhanError) throw e
    if ((e as Error).name === "AbortError") throw new AlAdhanError("AlAdhan request timed out")
    throw new AlAdhanError(`AlAdhan request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function prayerTimes(city = "London", country = "UK", method = 2): Promise<string> {
  const c = city.trim()
  if (c === "") throw new AlAdhanError("city must not be empty")
  const url = `${API}/timingsByCity?city=${encodeURIComponent(c)}&country=${encodeURIComponent(country.trim())}&method=${method}`
  const body = await get<unknown>(url)
  const timings = at(body, "data.timings")
  if (!timings) return `AlAdhan has no timings for ${c}.`
  const keys = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
  const lines = keys.map((k) => `${k}: ${val(at(timings, k))}`)
  return [
    `Prayer times for ${c} — ${val(at(body, "data.date.readable"))}`,
    "",
    ...lines,
    "",
    `Method: ${method} (${val(at(body, "data.meta.method.name"))})`,
    `Timezone: ${val(at(body, "data.meta.timezone"))}`,
  ].join("\n")
}
