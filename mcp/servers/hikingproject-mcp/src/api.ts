export class HikingprojectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HikingprojectError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new HikingprojectError(`Set the ${name} environment variable.`)
  return v
}

function apiKey(): string {
  return envStrict("HIKINGPROJECT_API_KEY")
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
    throw new HikingprojectError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getTrails(lat: number, lon: number, maxDistance?: number, maxResults?: number): Promise<string> {
  const key = apiKey()
  let url = `https://www.hikingproject.com/data/get-trails`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  if (maxDistance !== undefined) qs.append("maxDistance", String(maxDistance));
  if (maxResults !== undefined) qs.append("maxResults", String(maxResults));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTrailById(ids: string): Promise<string> {
  const key = apiKey()
  let url = `https://www.hikingproject.com/data/get-trails-by-id`;
  const qs = new URLSearchParams();
  qs.append("ids", String(ids));
  qs.append("key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
