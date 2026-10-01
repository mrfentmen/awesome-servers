export class MetofficeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MetofficeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.METOFFICE_API_KEY
  if (!k) throw new MetofficeError("Set the METOFFICE_API_KEY environment variable.")
  return k
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new MetofficeError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getHourlyForecast(latitude: number, longitude: number): Promise<string> {
  const key = apiKey()
  let url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly`;
  const qs = new URLSearchParams();
  qs.append("latitude", String(latitude));
  qs.append("longitude", String(longitude));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "apikey": key } });
  return pretty(data);
}

export async function getThreeHourlyForecast(latitude: number, longitude: number): Promise<string> {
  const key = apiKey()
  let url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/three-hourly`;
  const qs = new URLSearchParams();
  qs.append("latitude", String(latitude));
  qs.append("longitude", String(longitude));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "apikey": key } });
  return pretty(data);
}

export async function getDailyForecast(latitude: number, longitude: number): Promise<string> {
  const key = apiKey()
  let url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily`;
  const qs = new URLSearchParams();
  qs.append("latitude", String(latitude));
  qs.append("longitude", String(longitude));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "apikey": key } });
  return pretty(data);
}
