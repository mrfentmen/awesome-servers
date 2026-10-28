/**
 * Aviation Weather — keyless public API client.
 */
const BASE = "https://aviationweather.gov/api/data"
const SOURCE = "Aviation Weather"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "metar-mcp", accept },
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

function checkStation(s: string): string {
  const st = clean(s).toUpperCase()
  if (!/^[A-Z0-9]{3,4}$/.test(st)) throw new SourceError("station must be a 3 or 4 character ICAO code")
  return st
}

function decode(ob: any): string[] {
  const wind = ob.wdir !== undefined
    ? `${ob.wdir === "VRB" ? "variable" : `${ob.wdir}°`} at ${ob.wspd ?? "?"} kt${ob.wgst ? ` gusting ${ob.wgst} kt` : ""}`
    : "wind not reported"
  const cloud = Array.isArray(ob.clouds) && ob.clouds.length
    ? ob.clouds.map((c: any) => `${c.cover ?? "?"}${c.base !== undefined ? ` at ${c.base} ft` : ""}`).join(", ")
    : "clouds not reported"
  return [
    `wind: ${wind}`,
    `visibility: ${clean(ob.visib) || "not reported"}`,
    `temperature: ${ob.temp ?? "?"}°C, dewpoint ${ob.dewp ?? "?"}°C`,
    `altimeter: ${ob.altim ?? "?"} hPa · sea level pressure ${ob.slp ?? "?"}`,
    `clouds: ${cloud}`,
    ob.wxString ? `weather: ${clean(ob.wxString)}` : "",
    ob.fltCat ? `flight category: ${clean(ob.fltCat)}` : "",
  ].filter(Boolean)
}

export async function metar(a: { station: string }): Promise<string> {
  const st = checkStation(a.station)
  const d = await getJson(`/metar?ids=${st}&format=json`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `NOAA publishes no current METAR for ${st}.`
  return rows.slice(0, 3).map((ob) => [
    `${clean(ob.icaoId) || st} METAR - observed ${clean(ob.reportTime) || clean(ob.obsTime) || "time unknown"}`,
    ...decode(ob).map((l) => `  ${l}`),
    ob.rawOb ? `  raw: ${clean(ob.rawOb)}` : "",
  ].filter(Boolean).join("\n")).join("\n\n")
}

export async function taf(a: { station: string }): Promise<string> {
  const st = checkStation(a.station)
  const d = await getJson(`/taf?ids=${st}&format=json`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `NOAA publishes no current TAF for ${st}.`
  const r = rows[0]
  const from = r.validTimeFrom ? new Date(Number(r.validTimeFrom) * 1000).toISOString() : "unknown"
  const to = r.validTimeTo ? new Date(Number(r.validTimeTo) * 1000).toISOString() : "unknown"
  const forecasts: any[] = Array.isArray(r.fcsts) ? r.fcsts : []
  return [
    `${clean(r.icaoId) || st} TAF - issued ${clean(r.issueTime) || "unknown"}`,
    `Valid ${from.slice(0, 16)}Z → ${to.slice(0, 16)}Z`,
    forecasts.length ? `Periods: ${forecasts.length}` : "",
    ...forecasts.slice(0, 8).map((f: any) => `  ${clean(f.timeFrom) ? `from ${clean(f.timeFrom)} ` : ""}${f.fcstChange ? `[${clean(f.fcstChange)}] ` : ""}${[f.wdir !== undefined ? `wind ${f.wdir}°/${f.wspd}kt` : "", f.visib ? `vis ${clean(f.visib)}` : "", clean(f.wxString) || ""].filter(Boolean).join(" · ")}`),
    r.rawTAF ? `raw: ${clean(r.rawTAF)}` : "",
  ].filter(Boolean).join("\n")
}

export async function stationInfo(a: { station: string }): Promise<string> {
  const st = checkStation(a.station)
  const d = await getJson(`/stationinfo?ids=${st}&format=json`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `NOAA has no station record for ${st}.`
  const r = rows[0]
  return [
    `${clean(r.site) || st}`,
    `ICAO ${clean(r.icaoId) || st}${r.iataId ? ` · IATA ${clean(r.iataId)}` : ""}${r.faaId ? ` · FAA ${clean(r.faaId)}` : ""}${r.wmoId ? ` · WMO ${clean(r.wmoId)}` : ""}`,
    `Position: ${r.lat}, ${r.lon} · elevation ${r.elev ?? "?"} m`,
    `Location: ${[r.state, r.country].map((x) => clean(x)).filter(Boolean).join(", ") || "not stated"}`,
    Array.isArray(r.siteType) && r.siteType.length ? `Publishes: ${r.siteType.map((x: any) => clean(x)).join(", ")}` : "",
  ].filter(Boolean).join("\n")
}
