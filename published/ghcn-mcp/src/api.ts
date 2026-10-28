/**
 * NOAA GHCN Weather — keyless public API client.
 */
const BASE = "https://www.ncei.noaa.gov/access/services/data/v1"
const SOURCE = "NOAA GHCN Weather"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "ghcn-mcp", accept },
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

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

function checkStation(value: string): string {
  const v = clean(value).toUpperCase()
  if (!/^[A-Z0-9]{3,20}$/.test(v)) throw new SourceError(`"${value}" is not a GHCN station id (e.g. USW00094728)`)
  return v
}

function checkDates(start: string, end: string, maxDays: number): { start: string; end: string; days: number } {
  const s = clean(start)
  const e = clean(end)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) throw new SourceError("dates must be YYYY-MM-DD")
  const ds = Date.parse(`${s}T00:00:00Z`)
  const de = Date.parse(`${e}T00:00:00Z`)
  if (Number.isNaN(ds) || Number.isNaN(de)) throw new SourceError("those dates are not valid")
  if (de < ds) throw new SourceError("endDate is before startDate")
  const days = Math.round((de - ds) / 86400000) + 1
  if (days > maxDays) throw new SourceError(`that window is ${days} days; the limit is ${maxDays}`)
  return { start: s, end: e, days }
}

function num(value: unknown): number | null {
  const t = clean(value)
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

async function fetchRows(dataset: string, station: string, start: string, end: string, units: string): Promise<any[]> {
  const data = await getJson(
    `?dataset=${dataset}&stations=${station}&startDate=${start}&endDate=${end}&format=json&units=${units}`,
    "application/json", 60000)
  if (Array.isArray(data)) return data
  throw new SourceError("NCEI returned an unexpected payload for this station and window")
}

const UNIT_T = (units: string) => (units === "metric" ? "C" : "F")
const UNIT_P = (units: string) => (units === "metric" ? "mm" : "in")

export async function dailySummaries(a: { station: string; startDate: string; endDate: string; units?: string }): Promise<string> {
  const station = checkStation(a.station)
  const { start, end, days } = checkDates(a.startDate, a.endDate, 45)
  const units = a.units ?? "metric"
  const rows = await fetchRows("daily-summaries", station, start, end, units)
  if (!rows.length) return `NCEI has no daily data for ${station} between ${start} and ${end}.`
  const tUnit = UNIT_T(units)
  const pUnit = UNIT_P(units)
  return [
    `${station}: ${rows.length} day(s) from ${start} to ${end} (asked for ${days}), units ${units}`,
    "",
    `date        TMAX(${tUnit})  TMIN(${tUnit})  PRCP(${pUnit})  SNOW  AWND`,
    ...rows.slice(0, 45).map((r: any) => {
      const tmax = num(r.TMAX)
      const tmin = num(r.TMIN)
      const prcp = num(r.PRCP)
      const snow = num(r.SNOW)
      const wind = num(r.AWND)
      return [
        clean(r.DATE).padEnd(11),
        (tmax === null ? "-" : tmax.toFixed(1)).padStart(8),
        (tmin === null ? "-" : tmin.toFixed(1)).padStart(9),
        (prcp === null ? "-" : prcp.toFixed(1)).padStart(10),
        (snow === null ? "-" : snow.toFixed(1)).padStart(6),
        (wind === null ? "-" : wind.toFixed(1)).padStart(6),
      ].join(" ")
    }),
    "",
    "Values come from the station's GHCN daily summary record; missing days are simply absent.",
  ].join("\n")
}

export async function monthlySummaries(a: { station: string; year: number; units?: string }): Promise<string> {
  const station = checkStation(a.station)
  const year = Math.floor(a.year)
  if (!Number.isInteger(year) || year < 1850 || year > 2100) throw new SourceError("year must be between 1850 and 2100")
  const units = a.units ?? "metric"
  const rows = await fetchRows("global-summary-of-the-month", station, `${year}-01-01`, `${year}-12-31`, units)
  if (!rows.length) return `NCEI has no monthly summaries for ${station} in ${year}.`
  const tUnit = UNIT_T(units)
  const pUnit = UNIT_P(units)
  return [
    `${station}: ${rows.length} month(s) in ${year} (${units})`,
    "",
    `month  TMAX(${tUnit})  TMIN(${tUnit})  PRCP(${pUnit})  extreme max  extreme min`,
    ...rows.map((r: any) => {
      const month = clean(r.DATE).slice(0, 7)
      const tmax = num(r.TMAX)
      const tmin = num(r.TMIN)
      const prcp = num(r.PRCP)
      const emxt = num(r.EMXT)
      const emnt = num(r.EMNT)
      return [
        month.padEnd(6),
        (tmax === null ? "-" : tmax.toFixed(1)).padStart(8),
        (tmin === null ? "-" : tmin.toFixed(1)).padStart(9),
        (prcp === null ? "-" : prcp.toFixed(1)).padStart(10),
        (emxt === null ? "-" : emxt.toFixed(1)).padStart(11),
        (emnt === null ? "-" : emnt.toFixed(1)).padStart(11),
      ].join(" ")
    }),
  ].join("\n")
}

export async function stationExtremes(a: { station: string; startDate: string; endDate: string; units?: string }): Promise<string> {
  const station = checkStation(a.station)
  const { start, end, days } = checkDates(a.startDate, a.endDate, 366)
  const units = a.units ?? "metric"
  const rows = await fetchRows("daily-summaries", station, start, end, units)
  if (!rows.length) return `NCEI has no daily data for ${station} between ${start} and ${end}.`
  const tUnit = UNIT_T(units)
  const pUnit = UNIT_P(units)
  let hottest: any = null
  let coldest: any = null
  let wettest: any = null
  for (const r of rows) {
    const tmax = num(r.TMAX)
    const tmin = num(r.TMIN)
    const prcp = num(r.PRCP)
    if (tmax !== null && (!hottest || tmax > hottest.value)) hottest = { date: clean(r.DATE), value: tmax }
    if (tmin !== null && (!coldest || tmin < coldest.value)) coldest = { date: clean(r.DATE), value: tmin }
    if (prcp !== null && (!wettest || prcp > wettest.value)) wettest = { date: clean(r.DATE), value: prcp }
  }
  const temps = rows.map((r: any) => num(r.TMAX)).filter((v): v is number => v !== null)
  const mean = temps.length ? temps.reduce((s, v) => s + v, 0) / temps.length : null
  return [
    `${station} extremes from ${start} to ${end} (${days} day window, ${rows.length} day(s) with data, ${units}):`,
    "",
    hottest ? `Warmest day:  ${hottest.date} · TMAX ${hottest.value.toFixed(1)} ${tUnit}` : "Warmest day:  no temperature data",
    coldest ? `Coldest night: ${coldest.date} · TMIN ${coldest.value.toFixed(1)} ${tUnit}` : "Coldest night: no temperature data",
    wettest ? `Wettest day:  ${wettest.date} · PRCP ${wettest.value.toFixed(1)} ${pUnit}` : "Wettest day:  no precipitation data",
    mean !== null ? `\nMean daily TMAX: ${mean.toFixed(1)} ${tUnit}` : "",
  ].filter(Boolean).join("\n")
}
