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
