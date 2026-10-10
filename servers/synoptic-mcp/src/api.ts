export class SynopticError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SynopticError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new SynopticError(`Set the ${name} environment variable.`)
  return v
}

function apiKey(): string {
  return envStrict("SYNOPTIC_API_TOKEN")
}

async function authHeaders(): Promise<Record<string, string>> {
  return {};
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SynopticError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function findStations(state: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.synopticdata.com/v2/stations/metadata`;
  const qs = new URLSearchParams();
  qs.append("token", key);
  qs.append("state", String(state));
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTimeseries(stid: string, vars?: string, recent?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.synopticdata.com/v2/stations/timeseries`;
  const qs = new URLSearchParams();
  qs.append("token", key);
  qs.append("stid", String(stid));
  if (vars !== undefined) qs.append("vars", String(vars));
  if (recent !== undefined) qs.append("recent", String(recent));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxB tools:

// The US National Weather Service publishes every observation its own stations
// take, and its gridded model output, through a public API that needs no token.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

const NWS_BASE = "https://api.weather.gov"

function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

// NWS measures everything in SI, so wind and visibility are converted once here.
function nwsWind(value: unknown): string {
  const kmh = (value as Raw | undefined)?.value;
  if (typeof kmh !== "number" || !Number.isFinite(kmh)) return "not reported";
  return `${kmh.toFixed(1)} km/h (${(kmh * 0.621371).toFixed(1)} mph)`;
}

function nwsTemp(value: unknown): string {
  const c = (value as Raw | undefined)?.value;
  if (typeof c !== "number" || !Number.isFinite(c)) return "not reported";
  return `${c.toFixed(1)} C (${((c * 9) / 5 + 32).toFixed(1)} F)`;
}

function nwsNumber(value: unknown, digits = 1): string {
  const n = (value as Raw | undefined)?.value;
  if (typeof n !== "number" || !Number.isFinite(n)) return "not reported";
  return n.toFixed(digits);
}

function nwsTime(value: unknown): string {
  return typeof value === "string" && value ? value : "time not reported";
}

export async function nwsStationTimeseries(stid: string, hours?: number, limit?: number): Promise<string> {
  const station = (stid ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,8}$/.test(station)) throw new SynopticError(`Station id must be 3-8 letters or digits, e.g. KJFK, got "${stid ?? ""}".`);
  const span = Math.min(Math.max(hours ?? 6, 1), 72);
  const count = Math.min(Math.max(limit ?? 24, 1), 100);
  const end = new Date();
  const start = new Date(end.getTime() - span * 3600 * 1000);
  const qs = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    limit: String(count),
  });
  const data = (await req(`${NWS_BASE}/stations/${encodeURIComponent(station)}/observations?${qs.toString()}`)) as Raw;
  const features: Raw[] = Array.isArray(data?.features) ? data.features : [];
  if (features.length === 0) throw new SynopticError(`No observations returned for station ${station} in the last ${span} h.`);
  const rows = features.slice(0, count).map((f) => {
    const p: Raw = f.properties ?? {};
    return [
      `${nwsTime(p.timestamp)} · ${p.textDescription ?? "conditions not reported"}`,
      `   temp ${nwsTemp(p.temperature)} · dewpoint ${nwsTemp(p.dewpoint)} · humidity ${nwsNumber(p.relativeHumidity)}%`,
      `   wind ${nwsWind(p.windSpeed)} from ${nwsNumber(p.windDirection, 0)} deg · gust ${nwsWind(p.windGust)}`,
      `   pressure ${nwsNumber(p.barometricPressure, 0)} Pa · visibility ${nwsNumber(p.visibility, 0)} m`,
    ].join("\n")
  });
  const first: Raw = features[0].properties ?? {};
  return [
    `NWS station observations for ${first.stationName ?? station} (${first.stationId ?? station}), last ${span} h - ${features.length} reported, showing ${rows.length}:`,
    ...rows,
  ].join("\n")
}

export async function nwsGridpointHourly(lat: number, lon: number, hours?: number, limit?: number): Promise<string> {
  const latitude = bounded(lat, 0, -90, 90);
  const longitude = bounded(lon, 0, -180, 180);
  const span = Math.min(Math.max(hours ?? 24, 1), 156);
  const count = Math.min(Math.max(limit ?? 24, 1), 156);
  const point = (await req(`${NWS_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`)) as Raw;
  const props: Raw = point?.properties ?? {};
  const office = String(props.gridId ?? "");
  const x = Number(props.gridX);
  const y = Number(props.gridY);
  if (!office || !Number.isFinite(x) || !Number.isFinite(y)) throw new SynopticError("The NWS could not resolve that point to a forecast grid.");
  const place: Raw = props.relativeLocation?.properties ?? {};
  const hourly = (await req(`${NWS_BASE}/gridpoints/${office}/${x},${y}/forecast/hourly`)) as Raw;
  const periods: Raw[] = Array.isArray(hourly?.properties?.periods) ? hourly.properties.periods : [];
  if (periods.length === 0) throw new SynopticError("The NWS returned no hourly periods for that grid.");
  const chosen = periods.slice(0, count);
  return [
    `NWS gridded hourly model forecast for ${[place.city, place.state].filter(Boolean).join(", ") || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`} (grid ${office} ${x},${y}) - ${chosen.length} of ${periods.length} hours:`,
    ...chosen.map((p) => {
      const precip = p.probabilityOfPrecipitation?.value;
      return `${nwsTime(p.startTime)} · ${p.shortForecast ?? "forecast not reported"} · ${p.temperature ?? "?"} ${p.temperatureUnit ?? ""} · wind ${p.windSpeed ?? "?"} ${p.windDirection ?? ""} · humidity ${nwsNumber(p.relativeHumidity, 0)}%${precip === null || precip === undefined ? "" : ` · precip ${precip}%`}`
    }),
    count < span ? `Only ${periods.length} hours are published for this grid.` : "",
  ].filter(Boolean).join("\n")
}
