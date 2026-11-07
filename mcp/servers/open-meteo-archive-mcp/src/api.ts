/**
 * Open-Meteo Archive — Historical daily weather from the Open-Meteo archive, back to 1940. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against archive-api.open-meteo.com.
 */
const API = "https://archive-api.open-meteo.com/v1"

export class OpenMeteoArchiveError extends Error {}

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
      headers: { "user-agent": "open-meteo-archive-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenMeteoArchiveError(`Open-Meteo Archive returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenMeteoArchiveError) throw e
    if ((e as Error).name === "AbortError") throw new OpenMeteoArchiveError("Open-Meteo Archive request timed out")
    throw new OpenMeteoArchiveError(`Open-Meteo Archive request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function archiveWeather(latitude = 52.52, longitude = 13.41, startDate = "2024-01-01", endDate = "2024-01-03"): Promise<string> {
  const date = /^\d{4}-\d{2}-\d{2}$/
  if (!date.test(startDate) || !date.test(endDate)) throw new OpenMeteoArchiveError("dates must be YYYY-MM-DD")
  const query = `?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=UTC`
  const body = await get<unknown>(`${API}/archive${query}`)
  const days = rows(at(body, "daily.time"))
  if (days.length === 0) return `Open-Meteo has no archive data for ${startDate} to ${endDate}.`
  const highs = rows(at(body, "daily.temperature_2m_max"))
  const lows = rows(at(body, "daily.temperature_2m_min"))
  const rain = rows(at(body, "daily.precipitation_sum"))
  const lines = days.map((d, i) => `${val(d)}: ${val(highs[i])} / ${val(lows[i])} C, ${val(rain[i])} mm`)
  return [`Open-Meteo archive ${startDate} to ${endDate}`, "", ...lines].join("\n")
}
