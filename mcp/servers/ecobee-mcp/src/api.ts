/**
 * ecobee API client. Needs ECOBEE_API_KEY plus ECOBEE_REFRESH_TOKEN.
 * First-time setup (PIN flow, once):
 *   1. GET https://api.ecobee.com/authorize?response_type=ecobeePin&client_id=KEY&scope=smartRead
 *      -> shows an ecobeePin code; enter it at https://www.ecobee.com/consumerportal/ within 9 minutes.
 *   2. POST https://api.ecobee.com/token with grant_type=ecobeePin&code=PIN&client_id=KEY
 *      -> returns access_token + refresh_token. Save the refresh token as ECOBEE_REFRESH_TOKEN.
 * This server auto-refreshes the access token and caches it in memory.
 * Docs: https://www.ecobee.com/home/developer/api/documentation/v1/
 */
const BASE = "https://api.ecobee.com"

export class EcobeeError extends Error {}

let cached: { token: string; exp: number } | null = null

async function accessToken(): Promise<string> {
  const key = process.env.ECOBEE_API_KEY
  const refresh = process.env.ECOBEE_REFRESH_TOKEN
  if (!key || !refresh) {
    throw new EcobeeError("Set ECOBEE_API_KEY and ECOBEE_REFRESH_TOKEN first (see README PIN steps).")
  }
  if (cached && cached.exp > Date.now() + 60000) return cached.token
  const body = new URLSearchParams({ grant_type: "refresh_token", code: refresh, client_id: key })
  const res = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: { "User-Agent": "ecobee-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new EcobeeError(`ecobee token refresh failed (${res.status}). Re-do the PIN flow for a new refresh token.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.access_token) throw new EcobeeError("ecobee returned no access token.")
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cached.token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "ecobee-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${await accessToken()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) {
    cached = null
    throw new EcobeeError("ecobee refused (401/403). Tokens may have expired; re-do the PIN flow.")
  }
  if (!res.ok) throw new EcobeeError(`ecobee error ${res.status}`)
  return (await res.json()) as T
}

export interface Thermostat {
  id: string
  name?: string
  model?: string
  tempF?: number
  humidity?: number
  mode?: string
  sensors: string[]
}

const f2c = (f?: number): string | undefined =>
  f === undefined ? undefined : `${f}°F (${Math.round(((f - 320) / 18) * 10) / 10}°C)`;

export async function listThermostats(): Promise<Thermostat[]> {
  // NOTE: thermostat selection goes in a JSON body, so this is a POST
  // even though it only reads (matches ecobee's documented API).
  const post = await fetch(`${BASE}/1/thermostat?format=json`, {
    method: "POST",
    headers: { "User-Agent": "ecobee-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}` },
    body: JSON.stringify({ selection: { selectionType: "registered", includeRuntime: true, includeSensors: true } }),
    signal: AbortSignal.timeout(20000),
  })
  if (!post.ok) throw new EcobeeError(`ecobee error ${post.status}`)
  const data = (await post.json()) as Raw
  const rows: Raw[] = Array.isArray(data.thermostatList) ? data.thermostatList : []
  return rows.map((t) => {
    const rt: Raw = t.runtime ?? {}
    const sensors: Raw[] = Array.isArray(t.remoteSensors) ? t.remoteSensors : []
    return {
      id: String(t.identifier),
      name: t.name,
      model: t.modelNumber,
      tempF: typeof rt.actualTemperature === "number" ? rt.actualTemperature / 10 : undefined,
      humidity: typeof rt.actualHumidity === "number" ? rt.actualHumidity : undefined,
      mode: rt.actualHeatCoolMode ?? t.settings?.hvacMode,
      sensors: sensors.map((s) => String(s.name ?? "?")).slice(0, 8),
    }
  })
}

export function formatThermostat(t: Thermostat, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}[${t.id}] ${t.name ?? "(unnamed)"}${t.model ? ` (${t.model})` : ""}`,
    t.tempF !== undefined ? `Temp: ${f2c(t.tempF)}` : "",
    t.humidity !== undefined ? `Humidity: ${t.humidity}%` : "",
    t.mode ? `Mode: ${t.mode}` : "",
    t.sensors.length ? `Sensors: ${t.sensors.join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxF tools:
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality"

interface AirCurrent {
  time?: string
  interval?: number
  european_aqi?: number
  us_aqi?: number
  pm10?: number
  pm2_5?: number
  carbon_monoxide?: number
  nitrogen_dioxide?: number
  sulphur_dioxide?: number
  ozone?: number
  uv_index?: number
  dust?: number
  aerosol_optical_depth?: number
  alder_pollen?: number
  birch_pollen?: number
  grass_pollen?: number
  mugwort_pollen?: number
  olive_pollen?: number
  ragweed_pollen?: number
}

interface AirPayload {
  latitude?: number
  longitude?: number
  timezone?: string
  utc_offset_seconds?: number
  elevation?: number
  current_units?: Record<string, string>
  current?: AirCurrent
  hourly?: { time?: string[]; pm2_5?: Array<number | null>; pm10?: Array<number | null>; european_aqi?: Array<number | null> }
  hourly_units?: Record<string, string>
}

const POLLUTANTS: Array<[string, string]> = [
  ['pm2_5', 'Fine particulate PM2.5'],
  ['pm10', 'Coarse particulate PM10'],
  ['carbon_monoxide', 'Carbon monoxide'],
  ['nitrogen_dioxide', 'Nitrogen dioxide'],
  ['sulphur_dioxide', 'Sulphur dioxide'],
  ['ozone', 'Ozone'],
]

const POLLEN: Array<[string, string]> = [
  ['alder_pollen', 'Alder pollen'],
  ['birch_pollen', 'Birch pollen'],
  ['grass_pollen', 'Grass pollen'],
  ['mugwort_pollen', 'Mugwort pollen'],
  ['olive_pollen', 'Olive pollen'],
  ['ragweed_pollen', 'Ragweed pollen'],
]

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(n, max))
}

function coords(args: { lat?: number; lng?: number }): { lat: number; lng: number } {
  const lat = Number(args.lat)
  const lng = Number(args.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new EcobeeError('Provide valid latitude and longitude.')
  if (lat < -90 || lat > 90) throw new EcobeeError('Latitude must be between -90 and 90.')
  if (lng < -180 || lng > 180) throw new EcobeeError('Longitude must be between -180 and 180.')
  return { lat, lng }
}

async function air<T>(query: string): Promise<AirPayload> {
  const res = await fetch(`${AIR}?${query}`, {
    headers: { 'User-Agent': 'ecobee-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new EcobeeError(`Open-Meteo air quality returned ${res.status}`)
  return (await res.json()) as AirPayload
}

/** What the air outside a building is doing right now, as the readings a ventilation decision depends on. */
export async function outdoorAir(args: { lat?: number; lng?: number }): Promise<string> {
  const { lat, lng } = coords(args)
  const currentVars = [
    'european_aqi', 'us_aqi', 'pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide',
    'sulphur_dioxide', 'ozone', 'uv_index', ...POLLEN.map(([k]) => k),
  ]
  const d = await air(`latitude=${lat}&longitude=${lng}&current=${currentVars.join(',')}`)
  const c = d.current
  if (!c?.time) throw new EcobeeError('Open-Meteo air quality returned no current reading for that point.')
  const units = d.current_units ?? {}
  const lines = [
    `Outdoor air at ${d.latitude ?? lat}, ${d.longitude ?? lng}, valid ${c.time} (${c.interval ?? 3600} second interval)`,
    `European AQI: ${c.european_aqi ?? 'not reported'} | US AQI: ${c.us_aqi ?? 'not reported'}`,
    `UV index: ${c.uv_index ?? 'not reported'}`,
    'Pollutants:',
  ]
  for (const [key, label] of POLLUTANTS) {
    const value = (c as Record<string, unknown>)[key]
    lines.push(`  ${label}: ${value === undefined || value === null ? 'not reported' : `${value} ${units[key] ?? 'in its own unit'}`}`)
  }
  const pollenLines = POLLEN.map(([key, label]) => {
    const value = (c as Record<string, unknown>)[key]
    return value === undefined || value === null ? null : `${label} ${value} ${units[key] ?? ''}`
  }).filter((x): x is string => x !== null)
  lines.push(pollenLines.length ? `Pollen: ${pollenLines.join(', ')}` : 'Pollen: none of the tracked species reported')
  lines.push(`Grid cell elevation: ${d.elevation === undefined ? 'not reported' : `${d.elevation} m`} | time zone ${d.timezone ?? 'not reported'}`)
  lines.push('These are modelled outdoor values for the grid cell, which is what a fresh air intake would draw, not what a sensor indoors would read.')
  return lines.join('\n')
}

/** The air quality trend over a few days, judged against the WHO guideline for PM2.5. */
export async function airQualityTrend(args: { lat?: number; lng?: number; days?: number }): Promise<string> {
  const { lat, lng } = coords(args)
  const days = bound(args.days, 1, 7, 3)
  const d = await air(`latitude=${lat}&longitude=${lng}&hourly=pm2_5,pm10,european_aqi&forecast_days=${days}&timezone=auto`)
  const h = d.hourly
  const times = h?.time ?? []
  if (!times.length) throw new EcobeeError('Open-Meteo air quality returned no hourly series for that point.')
  const pm25 = h?.pm2_5 ?? []
  const pm10 = h?.pm10 ?? []
  const aqi = h?.european_aqi ?? []
  const pairs: Array<{ t: string; pm: number }> = []
  times.forEach((t, i) => {
    const v = pm25[i]
    if (typeof v === 'number' && Number.isFinite(v)) pairs.push({ t: String(t), pm: v })
  })
  if (!pairs.length) throw new EcobeeError('Open-Meteo returned hourly timestamps but no PM2.5 values.')
  const mean = pairs.reduce((s, p) => s + p.pm, 0) / pairs.length
  const peak = pairs.reduce((a, b) => (b.pm > a.pm ? b : a))
  const WHO = 15
  const over = pairs.filter((p) => p.pm > WHO)
  const aqiValues = aqi.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const pm10Values = pm10.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return [
    `Air quality trend at ${d.latitude ?? lat}, ${d.longitude ?? lng} over ${days} day(s)`,
    `Hours covered: ${times.length} (${times[0]} to ${times[times.length - 1]})`,
    `PM2.5: mean ${mean.toFixed(2)} ${d.hourly_units?.pm2_5 ?? 'in its own unit'}, peak ${peak.pm} at ${peak.t}`,
    `WHO 24 hour PM2.5 guideline is 15 µg/m3, so ${over.length} of ${times.length} hours sit above it (${((over.length / times.length) * 100).toFixed(1)}%)`,
    over.length ? `Hours above the guideline: ${over.slice(0, 12).map((p) => `${p.t} at ${p.pm}`).join(', ')}${over.length > 12 ? `, and ${over.length - 12} more` : ''}` : 'No hour sits above the WHO guideline in this window.',
    pm10Values.length ? `PM10: mean ${(pm10Values.reduce((s, v) => s + v, 0) / pm10Values.length).toFixed(2)}, peak ${Math.max(...pm10Values)}` : 'PM10: not reported',
    aqiValues.length
      ? `European AQI: mean ${(aqiValues.reduce((s, v) => s + v, 0) / aqiValues.length).toFixed(1)}, band ${Math.min(...aqiValues)} to ${Math.max(...aqiValues)}`
      : 'European AQI: not reported',
    'The AQI is averaged over the hours present, which is not the same as the 24 hour index a regulator would publish.',
  ].join('\n')
}

/** Degree-hour arithmetic for an overnight heating setpoint: how far the house has to be pulled back up, and the runtime that takes. */
export async function setpointAudit(args: {
  indoorC?: number
  setbackC?: number
  outdoorLowC?: number
  outdoorHighC?: number
  hours?: number
  runtimeRateC?: number
}): Promise<string> {
  const indoor = bound(args.indoorC, -40, 60, 21)
  const setback = bound(args.setbackC, 0, 20, 3)
  const low = bound(args.outdoorLowC, -60, 60, 2)
  const high = bound(args.outdoorHighC, -60, 60, 8)
  if (high < low) throw new EcobeeError('outdoorHighC must not be below outdoorLowC.')
  const hours = bound(args.hours, 1, 24, 8)
  const rate = bound(args.runtimeRateC, 0.2, 10, 1.5)
  const setbackTemp = indoor - setback
  const deficitLow = setbackTemp - low
  const deficitHigh = setbackTemp - high
  const meanDeficit = Math.max(0, deficitLow)
  const totalDeficit = meanDeficit * hours
  const runtimeHours = totalDeficit / rate
  const catchUpHours = setback / rate
  const holdingRuntime = (setback * hours) / rate
  const saved = holdingRuntime > 0 ? Math.max(0, 1 - runtimeHours / holdingRuntime) : 0
  const penalty = holdingRuntime + catchUpHours > 0 ? catchUpHours / (holdingRuntime + catchUpHours) : 0
  return [
    'Overnight setpoint audit, degree-hour arithmetic, computed locally',
    `Assumptions: indoor target ${indoor}C, setback ${setback}C to ${setbackTemp}C, ${hours} hours overnight, outdoor ${low}C to ${high}C, equipment rated at ${rate}C of temperature change per runtime hour.`,
    `Setback target: ${setbackTemp}C`,
    `Deficit at the coldest hour: ${deficitLow.toFixed(1)}C${deficitLow > 0 ? '' : ' (the house never drops below the setback, so there is nothing to recover)'}`,
    `Deficit at the warmest hour: ${deficitHigh.toFixed(1)}C${deficitHigh > 0 ? '' : ' (the house stays above the setback even at the warmest hour)'}`,
    `Mean deficit used for the runtime estimate: ${meanDeficit.toFixed(1)}C`,
    `Total temperature deficit to recover: ${totalDeficit.toFixed(1)} degree hours`,
    `Runtime to hold the setback: ${runtimeHours.toFixed(1)} hours out of the ${hours} hour window, a duty cycle of ${hours ? ((runtimeHours / hours) * 100).toFixed(0) : 0}%`,
    `Catching the full ${setback}C back up afterwards: ${catchUpHours.toFixed(1)} runtime hours`,
    `Runtime to hold ${indoor}C all night instead: ${holdingRuntime.toFixed(1)} hours, so the setback saves ${(saved * 100).toFixed(0)}% of that overnight runtime`,
    `The catch-up adds about ${(penalty * 100).toFixed(0)}% to the fuel used over the setback window and the recovery together`,
    meanDeficit <= 0
      ? 'The outdoor temperature never falls below the setback, so this setback costs no runtime at all and only delays the morning recovery.'
      : 'A deeper setback is only free while the house is still warmer than the outdoor air; past that the deficit grows hour by hour.',
    'This is a linear degree-hour estimate. It ignores thermal mass, envelope losses changing with wind, and duty cycling, so read it as an order of magnitude rather than a billing figure.',
  ].join('\n')
}
