/**
 * NASA POWER — keyless public API client.
 */
const BASE = "https://power.larc.nasa.gov/api"
const SOURCE = "NASA POWER"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "nasa-power-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function coords(a: { latitude: number; longitude: number }): string {
  if (!Number.isFinite(a.latitude) || a.latitude < -90 || a.latitude > 90) throw new SourceError("latitude must be between -90 and 90")
  if (!Number.isFinite(a.longitude) || a.longitude < -180 || a.longitude > 180) throw new SourceError("longitude must be between -180 and 180")
  return `latitude=${a.latitude}&longitude=${a.longitude}`
}

function params(value: string): string {
  const list = clean(value).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  if (!list.length) throw new SourceError("parameters must list at least one POWER parameter")
  if (list.length > 12) throw new SourceError("parameters accepts at most 12 names")
  return list.join(",")
}

const UNITS: Record<string, string> = { T2M: "°C", T2M_MAX: "°C", T2M_MIN: "°C", PRECTOTCORR: "mm/day", WS2M: "m/s", WS10M: "m/s", RH2M: "%", ALLSKY_SFC_SW_DWN: "kWh/m²/day", PS: "kPa" }

function rowsFor(values: Record<string, unknown>): number {
  return Object.values(values ?? {}).filter((v) => v && typeof v === "object").map((v) => Object.keys(v as object).length).sort((a, b) => b - a)[0] ?? 0
}

export async function dailyPoint(a: { latitude: number; longitude: number; start: string; end: string; parameters: string }): Promise<string> {
  const start = clean(a.start)
  const end = clean(a.end)
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) throw new SourceError("start and end must be YYYYMMDD")
  if (start > end) throw new SourceError("start must not be after end")
  const d = await getJson(`/temporal/daily/point?parameters=${params(a.parameters)}&community=RE&${coords(a)}&start=${start}&end=${end}&format=JSON`)
  const values = d?.properties?.parameter
  if (!values) throw new SourceError("NASA POWER returned no parameter block")
  const names = Object.keys(values)
  const count = rowsFor(values)
  if (!count) return `NASA POWER returned no daily values for ${a.latitude}, ${a.longitude} between ${start} and ${end}.`
  const lines: string[] = []
  for (const name of names) {
    const series = Object.entries(values[name] as Record<string, number | string>)
    const numeric = series.map(([, v]) => Number(v)).filter((v) => Number.isFinite(v))
    const mean = numeric.reduce((s, v) => s + v, 0) / (numeric.length || 1)
    const min = Math.min(...numeric)
    const max = Math.max(...numeric)
    lines.push(`- ${name} (${UNITS[name.toUpperCase()] ?? "POWER units"}): mean ${mean.toFixed(2)} · min ${min.toFixed(2)} · max ${max.toFixed(2)} over ${series.length} day(s)`)
  }
  const first = Object.entries(values[names[0]] as Record<string, number | string>).slice(-5)
  return [
    `NASA POWER daily data at ${a.latitude}, ${a.longitude} for ${start}-${end}`,
    "",
    ...lines,
    "",
    `Last days (${names[0]}): ${first.map(([day, v]) => `${day}=${v}`).join(", ")}`,
    `Source: https://power.larc.nasa.gov/data-access-viewer/`,
  ].join("\n")
}

export async function climatology(a: { latitude: number; longitude: number; parameters: string }): Promise<string> {
  const d = await getJson(`/temporal/climatology/point?parameters=${params(a.parameters)}&community=RE&${coords(a)}&format=JSON`)
  const values = d?.properties?.parameter
  if (!values) throw new SourceError("NASA POWER returned no climatology block")
  const out: string[] = []
  for (const [name, months] of Object.entries(values as Record<string, Record<string, number>>)) {
    const entries = Object.entries(months).filter(([k]) => /^[A-Z]{3}$/.test(k))
    const warmest = entries.reduce((best, cur) => (Number(cur[1]) > Number(best[1]) ? cur : best), entries[0])
    const coldest = entries.reduce((best, cur) => (Number(cur[1]) < Number(best[1]) ? cur : best), entries[0])
    out.push(`- ${name} (${UNITS[name.toUpperCase()] ?? "POWER units"}): high ${warmest[0]} ${warmest[1]} · low ${coldest[0]} ${coldest[1]}`)
    out.push(`    ${entries.map(([m, v]) => `${m} ${v}`).join(" · ")}`)
  }
  return [
    `NASA POWER monthly climatology at ${a.latitude}, ${a.longitude} (long-term averages):`,
    "",
    ...out,
  ].join("\n")
}
