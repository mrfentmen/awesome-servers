/**
 * National Weather Service client. Keyless (a User-Agent is required by NWS).
 * Forecasts, hourly forecasts, active alerts, station observations.
 */
const BASE = "https://api.weather.gov"
const UA = "nws-mcp/1.0 (awesome-servers)"

export class NwsError extends Error {}

export type PointInfo = NonNullable<Points["properties"]>

interface Points {
  properties?: {
    forecast?: string
    forecastHourly?: string
    forecastOffice?: string
    timeZone?: string
    relativeLocation?: { properties?: { city?: string; state?: string } }
    observationStations?: string
  }
}

interface ForecastPeriod {
  name?: string
  temperature?: number
  temperatureUnit?: string
  windSpeed?: string
  windDirection?: string
  shortForecast?: string
  detailedForecast?: string
  startTime?: string
  isDaytime?: boolean
}

interface ForecastBody {
  properties?: { periods?: ForecastPeriod[]; updated?: string }
}

interface AlertFeature {
  properties?: {
    event?: string
    severity?: string
    urgency?: string
    headline?: string
    areaDesc?: string
    effective?: string
    expires?: string
    senderName?: string
  }
}

interface StationFeature {
  properties?: { stationIdentifier?: string; name?: string }
  geometry?: { coordinates?: [number, number] }
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/geo+json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new NwsError(`NWS error ${res.status} for ${url}`)
  return (await res.json()) as T
}

export async function points(lat: number, lon: number): Promise<PointInfo> {
  return (await get<Points>(`${BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`)).properties ?? {}
}

export async function forecast(lat: number, lon: number): Promise<ForecastPeriod[]> {
  const p = await points(lat, lon)
  if (!p.forecast) throw new NwsError("no forecast grid for that point")
  return (await get<ForecastBody>(p.forecast)).properties?.periods ?? []
}

export async function hourly(lat: number, lon: number): Promise<ForecastPeriod[]> {
  const p = await points(lat, lon)
  if (!p.forecastHourly) throw new NwsError("no hourly forecast for that point")
  return (await get<ForecastBody>(p.forecastHourly)).properties?.periods ?? []
}

export async function alerts(area: string): Promise<AlertFeature[]> {
  const url = area
    ? `${BASE}/alerts/active?area=${encodeURIComponent(area.toUpperCase())}`
    : `${BASE}/alerts/active`
  return (await get<{ features?: AlertFeature[] }>(url)).features ?? []
}

export async function stations(lat: number, lon: number): Promise<StationFeature[]> {
  const p = await points(lat, lon)
  if (!p.observationStations) throw new NwsError("no observation stations for that point")
  return (await get<{ features?: StationFeature[] }>(p.observationStations)).features ?? []
}

export async function observation(station: string): Promise<string> {
  const body = await get<{
    properties?: {
      timestamp?: string
      textDescription?: string
      temperature?: { value?: number; unitCode?: string }
      windSpeed?: { value?: number; unitCode?: string }
      relativeHumidity?: { value?: number }
      barometricPressure?: { value?: number }
    }
  }>(`${BASE}/stations/${encodeURIComponent(station)}/observations/latest`)
  const p = body.properties ?? {}
  const tempUnit = p.temperature?.unitCode ?? ""
  const c = (v: number | undefined) => {
    if (v === undefined) return "?"
    if (tempUnit.includes("degF")) return `${((v - 32) * 5) / 9} C`
    if (tempUnit.includes("degC")) return `${v.toFixed(1)} C`
    return `${(v - 273.15).toFixed(1)} C`
  }
  const humidity = p.relativeHumidity?.value
  const pressure = p.barometricPressure?.value
  return [
    `station ${station.toUpperCase()} at ${p.timestamp ?? "?"}`,
    `conditions: ${p.textDescription ?? "unknown"}`,
    `temperature: ${c(p.temperature?.value)}`,
    `humidity: ${humidity === undefined ? "?" : humidity.toFixed(0)}%`,
    `wind: ${p.windSpeed?.value ?? "?"} m/s`,
    `pressure: ${pressure === undefined ? "?" : (pressure / 100).toFixed(1)} hPa`,
  ].join("\n")
}

export function periodText(p: ForecastPeriod): string {
  const label = p.name || p.startTime || "period"
  const detail = p.detailedForecast ? `\n  ${p.detailedForecast}` : ""
  return `${label}${p.isDaytime === false ? " (night)" : ""}: ${p.temperature}${p.temperatureUnit} — ${p.shortForecast} — wind ${p.windSpeed} ${p.windDirection}${detail}`
}

export function alertText(a: AlertFeature): string {
  const p = a.properties ?? {}
  return `${p.event} [${p.severity ?? "?"}/${p.urgency ?? "?"}] ${p.areaDesc ?? ""}\n  ${p.headline ?? ""}\n  ${p.effective ?? ""} → ${p.expires ?? ""} (${p.senderName ?? ""})`
}
