export class StormglassError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StormglassError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new StormglassError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: envStrict("STORMGLASS_API_KEY") };
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
    throw new StormglassError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getWeather(lat: number, lng: string, params?: string, start?: string, end?: string): Promise<string> {
  let url = `https://api.stormglass.io/v2/weather/point`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lng", String(lng));
  if (params !== undefined) qs.append("params", String(params));
  if (start !== undefined) qs.append("start", String(start));
  if (end !== undefined) qs.append("end", String(end));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getElevation(lat: number, lng: string): Promise<string> {
  let url = `https://api.stormglass.io/v2/elevation/point`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lng", String(lng));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTides(lat: number, lng: string): Promise<string> {
  let url = `https://api.stormglass.io/v2/tide/extremes/point`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lng", String(lng));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
