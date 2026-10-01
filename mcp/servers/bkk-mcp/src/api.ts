export class BkkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BkkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new BkkError(`Set the ${name} environment variable.`)
  return v
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
    throw new BkkError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchStops(lat: number, lon: number): Promise<string> {
  let url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/stops-for-location.json`;
  const qs = new URLSearchParams();
  qs.append("lat", String(lat));
  qs.append("lon", String(lon));
  qs.append("app_id", envStrict("BKK_APP_ID"));
  qs.append("app_key", envStrict("BKK_APP_KEY"));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getDepartures(stopId: string, minutesAfter?: number): Promise<string> {
  let url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json`;
  const qs = new URLSearchParams();
  qs.append("stopId", String(stopId));
  qs.append("minutesBefore", "0");
  if (minutesAfter !== undefined) qs.append("minutesAfter", String(minutesAfter));
  qs.append("app_id", envStrict("BKK_APP_ID"));
  qs.append("app_key", envStrict("BKK_APP_KEY"));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
