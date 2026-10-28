/**
 * SNOTEL Snowpack — keyless public API client.
 */
const BASE = "https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1"
const SOURCE = "SNOTEL Snowpack"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "snotel-mcp", accept },
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

const ELEMENT_HINT: Record<string, string> = {
  WTEQ: "snow water equivalent (in)",
  SNWD: "snow depth (in)",
  PREC: "precipitation accumulation (in)",
  TOBS: "observed air temperature (°F)",
  TAVG: "average air temperature (°F)",
  TMAX: "maximum air temperature (°F)",
  TMIN: "minimum air temperature (°F)",
  SMS: "soil moisture percent",
  STO: "soil temperature (°F)",
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function stationsInState(a: { state: string; network: string; limit?: number }): Promise<string> {
  const state = clean(a.state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) throw new SourceError("state must be a two-letter code")
  const network = clean(a.network || "SNTL").toUpperCase()
  if (!/^[A-Z]{3,6}$/.test(network)) throw new SourceError("network must look like SNTL, SCAN, SNOW or BOR")
  const limit = a.limit ?? 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new SourceError("limit must be between 1 and 50")
  const rows: any[] = await getJson(`/stations?stationTriplets=*:${state}:${network}`)
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return `The AWDB has no ${network} station in ${state}.`
  const shown = list.slice(0, limit)
  return [
    `${list.length} ${network} stations in ${state}, showing ${shown.length}:`,
    "",
    ...shown.map((s) => `- ${clean(s.stationTriplet)} · ${clean(s.name) || "unnamed"}${s.elevation !== undefined ? ` · ${s.elevation} ft` : ""}${s.countyName ? ` · ${clean(s.countyName)} county` : ""}`),
  ].join("\n")
}

export async function stationReadings(a: { stationTriplet: string; elements: string; days?: number }): Promise<string> {
  const triplet = clean(a.stationTriplet)
  if (!/^[A-Za-z0-9]+:[A-Za-z]{2}:[A-Z]{3,6}$/.test(triplet)) throw new SourceError("stationTriplet must look like 1344:CO:SNTL")
  const days = a.days ?? 10
  if (!Number.isInteger(days) || days < 1 || days > 60) throw new SourceError("days must be between 1 and 60")
  const elements = clean(a.elements || "WTEQ,SNWD,PREC,TOBS").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  if (!elements.length || elements.length > 8) throw new SourceError("elements must list 1 to 8 element codes")
  for (const e of elements) {
    if (!/^[A-Z]{2,5}$/.test(e)) throw new SourceError(`${e} is not a valid AWDB element code`)
  }
  const end = new Date()
  const begin = new Date(end.getTime() - (days - 1) * 86400000)
  const params = new URLSearchParams({
    stationTriplets: triplet,
    elements: elements.join(","),
    duration: "DAILY",
    beginDate: isoDate(begin),
    endDate: isoDate(end),
    returnFlags: "false",
  })
  const rows: any[] = await getJson(`/data?${params.toString()}`)
  const station = Array.isArray(rows) ? rows[0] : undefined
  if (!station || !Array.isArray(station.data)) return `The AWDB returned no readings for ${triplet}.`
  const blocks = station.data.map((block: any) => {
    const code = clean(block?.stationElement?.elementCode)
    const values: any[] = Array.isArray(block?.values) ? block.values : []
    const numeric = values.map((v) => Number(v.value)).filter((v) => Number.isFinite(v))
    const last = values[values.length - 1]
    return [
      `${code} - ${ELEMENT_HINT[code] ?? "AWDB element"}`,
      `  latest ${clean(last?.date) || "?"}: ${last?.value ?? "n/a"}${numeric.length ? ` · range ${Math.min(...numeric)} to ${Math.max(...numeric)} over ${numeric.length} reading(s)` : ""}`,
    ].join("\n")
  })
  const label = clean(station.name) ? `${clean(station.name)} (${triplet})` : triplet
  return [
    `${label} - daily readings ${isoDate(begin)} to ${isoDate(end)}:`,
    "",
    ...blocks,
    "",
    `Station page: https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=${triplet.split(":")[0]}`,
  ].join("\n")
}

export async function stationMetadata(a: { stationTriplet: string }): Promise<string> {
  const triplet = clean(a.stationTriplet)
  if (!/^[A-Za-z0-9]+:[A-Za-z]{2}:[A-Z]{3,6}$/.test(triplet)) throw new SourceError("stationTriplet must look like 1344:CO:SNTL")
  const rows: any[] = await getJson(`/stations?stationTriplets=${encodeURIComponent(triplet)}`)
  const s = Array.isArray(rows) ? rows[0] : undefined
  if (!s) throw new SourceError(`No AWDB station ${triplet}`)
  return section(`${clean(s.name) || triplet} (${triplet})`, [
    bullet("Network", s.networkCode),
    bullet("State", s.stateCode),
    bullet("County", s.countyName),
    bullet("Elevation", s.elevation !== undefined ? `${s.elevation} ft` : ""),
    bullet("HUC", s.huc),
    bullet("Latitude", s.latitude),
    bullet("Longitude", s.longitude),
    bullet("Operator", s.operator),
    bullet("Station page", `https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=${triplet.split(":")[0]}`),
  ])
}

export async function peakSnowWaterEquivalent(a: { stationTriplet: string; year: number }): Promise<string> {
  const triplet = clean(a.stationTriplet)
  if (!/^[A-Za-z0-9]+:[A-Za-z]{2}:[A-Z]{3,6}$/.test(triplet)) throw new SourceError("stationTriplet must look like 1344:CO:SNTL")
  const begin = new Date(`${a.year - 1}-10-01`)
  const end = new Date(`${a.year}-09-30`)
  const params = new URLSearchParams({
    stationTriplets: triplet,
    elements: "WTEQ",
    duration: "DAILY",
    beginDate: isoDate(begin),
    endDate: isoDate(end),
    returnFlags: "false",
  })
  const rows: any[] = await getJson(`/data?${params.toString()}`)
  const station = Array.isArray(rows) ? rows[0] : undefined
  const block = station?.data?.find((b: any) => clean(b?.stationElement?.elementCode) === "WTEQ")
  const values: any[] = Array.isArray(block?.values) ? block.values : []
  const numeric = values.map((v) => ({ date: clean(v.date), value: Number(v.value) })).filter((v) => Number.isFinite(v.value))
  if (!numeric.length) return `No snow water equivalent readings for ${triplet} in water year ${a.year}.`
  const peak = numeric.reduce((best, v) => (v.value > best.value ? v : best), numeric[0])
  const latest = numeric[numeric.length - 1]
  return section(`${clean(station.name) || triplet} · water year ${a.year}`, [
    bullet("Peak SWE", `${peak.value} in on ${peak.date}`),
    bullet("Latest SWE", `${latest.value} in on ${latest.date}`),
    bullet("Readings", numeric.length),
    bullet("Season start", numeric[0].date),
  ])
}

export async function snowSummary(a: { state: string; network: string; limit: number }): Promise<string> {
  const state = clean(a.state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) throw new SourceError("state must be a two-letter code")
  const network = clean(a.network || "SNTL").toUpperCase()
  const end = new Date()
  const begin = new Date(end.getTime() - 7 * 86400000)
  const params = new URLSearchParams({
    stationTriplets: `*:${state}:${network}`,
    elements: "WTEQ",
    duration: "DAILY",
    beginDate: isoDate(begin),
    endDate: isoDate(end),
    returnFlags: "false",
  })
  const rows: any[] = await getJson(`/data?${params.toString()}`)
  const list = Array.isArray(rows) ? rows : []
  const readings = list.map((station: any) => {
    const block = station?.data?.find((b: any) => clean(b?.stationElement?.elementCode) === "WTEQ")
    const values: any[] = Array.isArray(block?.values) ? block.values : []
    const last = values[values.length - 1]
    return { name: clean(station.name) || clean(station.stationTriplet), triplet: clean(station.stationTriplet), value: Number(last?.value) }
  }).filter((r) => Number.isFinite(r.value)).sort((x, y) => y.value - x.value)
  if (!readings.length) return `No snow water equivalent readings for ${network} stations in ${state}.`
  const shown = readings.slice(0, a.limit)
  const avg = readings.reduce((n, r) => n + r.value, 0) / readings.length
  return section(`${network} snowpack in ${state}: ${readings.length} station(s), mean SWE ${avg.toFixed(1)} in`, shown.map((r, i) => `${i + 1}. ${r.name} (${r.triplet}) · ${r.value} in`))
}
