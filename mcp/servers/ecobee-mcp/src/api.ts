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

// ---- The Open-Meteo outdoor-air premium tools moved to the licence gateway
// (src/gateway.ts); `bound` stays here because the free setpoint audit uses it.

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(n, max))
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
