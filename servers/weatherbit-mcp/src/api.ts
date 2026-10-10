export class WeatherbitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WeatherbitError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new WeatherbitError(`Set the ${name} environment variable.`)
  return v
}

function apiKey(): string {
  return envStrict("WEATHERBIT_API_KEY")
}

async function authHeaders(): Promise<Record<string, string>> {
  return {}
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
    throw new WeatherbitError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getCurrent(lat: number, lon: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.weatherbit.io/v2.0/current`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getDailyForecast(lat: number, lon: number, days?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.weatherbit.io/v2.0/forecast/daily`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  if (days !== undefined) qs.append("days", String(days));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getHourlyForecast(lat: number, lon: number, hours?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.weatherbit.io/v2.0/forecast/hourly`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  if (hours !== undefined) qs.append("hours", String(hours));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getAlerts(lat: number, lon: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.weatherbit.io/v2.0/alerts`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getAirQuality(lat: number, lon: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.weatherbit.io/v2.0/current/airquality`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxB tools:

// The US National Weather Service publishes a public API (api.weather.gov) and
// Open-Meteo publishes a keyless air-quality model, so both forecasts and air
// quality are reachable without a Weatherbit account.
const NWS_BASE = "https://api.weather.gov"
const AIR_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

export async function nwsPointForecast(lat: number, lon: number, periods?: number): Promise<string> {
  const latitude = bounded(lat, 0, -90, 90);
  const longitude = bounded(lon, 0, -180, 180);
  const count = Math.min(Math.max(periods ?? 7, 1), 14);
  const point = (await req(`${NWS_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`)) as Raw;
  const props: Raw = point?.properties ?? {};
  const office = String(props.gridId ?? "");
  const x = Number(props.gridX);
  const y = Number(props.gridY);
  const place: Raw = props.relativeLocation?.properties ?? {};
  if (!office || !Number.isFinite(x) || !Number.isFinite(y)) throw new WeatherbitError("The NWS could not resolve that point to a forecast grid.");
  const forecast = (await req(`${NWS_BASE}/gridpoints/${office}/${x},${y}/forecast`)) as Raw;
  const list: Raw[] = Array.isArray(forecast?.properties?.periods) ? forecast.properties.periods : [];
  if (list.length === 0) throw new WeatherbitError("The NWS returned no forecast periods for that grid.");
  const where = [place.city, place.state].filter(Boolean).join(", ");
  return [
    `NWS forecast for ${where || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`} (grid ${office} ${x},${y}) - showing ${Math.min(count, list.length)} of ${list.length} periods:`,
    ...list.slice(0, count).map((p) => {
      const precip = p.probabilityOfPrecipitation?.value;
      return [
        `${p.name ?? "period"}: ${p.temperature ?? "?"} ${p.temperatureUnit ?? ""}${p.windSpeed ? `, wind ${p.windSpeed} ${p.windDirection ?? ""}` : ""}${precip === null || precip === undefined ? "" : `, ${precip}% chance of precipitation`}`,
        `   ${String(p.detailedForecast ?? "no detailed forecast").replace(/\s+/g, " ")}`,
      ].join("\n")
    }),
  ].join("\n")
}

export async function openMeteoAirQuality(lat: number, lon: number, hours?: number): Promise<string> {
  const latitude = bounded(lat, 0, -90, 90);
  const longitude = bounded(lon, 0, -180, 180);
  const span = Math.min(Math.max(hours ?? 12, 1), 48);
  const current = "pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,us_aqi,european_aqi";
  const pollen = "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen";
  const days = Math.ceil(span / 24) + 1;
  const qs = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current,
    hourly: `pm2_5,pm10,${pollen}`,
    forecast_days: String(Math.min(days, 7)),
    timezone: "auto",
  });
  const data = (await req(`${AIR_BASE}?${qs.toString()}`)) as Raw;
  const now: Raw = data?.current ?? {};
  const units: Raw = data?.current_units ?? {};
  const hourly: Raw = data?.hourly ?? {};
  const times: string[] = Array.isArray(hourly.time) ? hourly.time : [];
  const nowTime = String(now.time ?? "");
  const from = Math.max(times.findIndex((t) => t >= nowTime.slice(0, 13)), 0);
  const rows = times.slice(from, from + span);
  const number = (value: unknown): string => (typeof value === "number" && Number.isFinite(value) ? String(value) : "not reported");
  const currentLine = [
    `Now (${nowTime || "time not reported"}, ${String(data.timezone_abbreviation ?? data.timezone ?? "timezone not reported")}):`,
    `  US AQI ${number(now.us_aqi)} · European AQI ${number(now.european_aqi)}`,
    `  PM2.5 ${number(now.pm2_5)} ${units.pm2_5 ?? "μg/m³"} · PM10 ${number(now.pm10)} ${units.pm10 ?? "μg/m³"}`,
    `  O3 ${number(now.ozone)} · NO2 ${number(now.nitrogen_dioxide)} · SO2 ${number(now.sulphur_dioxide)} · CO ${number(now.carbon_monoxide)} ${units.carbon_monoxide ?? "μg/m³"}`,
  ].join("\n");
  const pollenNames: Array<[string, string]> = [
    ["alder_pollen", "alder"],
    ["birch_pollen", "birch"],
    ["grass_pollen", "grass"],
    ["mugwort_pollen", "mugwort"],
    ["olive_pollen", "olive"],
    ["ragweed_pollen", "ragweed"],
  ];
  const pollenLine = pollenNames.some(([key]) => (hourly[key] as number[] | undefined)?.some((v) => typeof v === "number" && v > 0))
    ? `Pollen grains/m3, next ${rows.length} h: ${rows.slice(0, Math.min(rows.length, 6)).map((t) => {
      const i = times.indexOf(t);
      return `${t.slice(11)} ${pollenNames.map(([key, label]) => {
        const v = (hourly[key] as number[] | undefined)?.[i]
        return typeof v === "number" && v > 0 ? `${label} ${v}` : ""
      }).filter(Boolean).join("/") || "none"}`
    }).join("; ")}`
    : "Pollen: none reported in this window";
  return [
    `Open-Meteo air quality for ${latitude.toFixed(3)}, ${longitude.toFixed(3)} (${String(data.timezone ?? "timezone not reported")})`,
    currentLine,
    `PM2.5 / PM10 μg/m³, next ${rows.length} h:`,
    ...rows.slice(0, 12).map((t) => {
      const i = times.indexOf(t)
      const pm25 = (hourly.pm2_5 as number[] | undefined)?.[i]
      const pm10 = (hourly.pm10 as number[] | undefined)?.[i]
      return `  ${t}: PM2.5 ${number(pm25)} · PM10 ${number(pm10)}`
    }),
    rows.length > 12 ? `  ...and ${rows.length - 12} more hours, raise hours to see them.` : "",
    pollenLine,
  ].filter(Boolean).join("\n")
}
