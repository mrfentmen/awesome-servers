export class NetatmoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NetatmoError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new NetatmoError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("NETATMO_ACCESS_TOKEN") }
}
async function nreq(url: string, init: RequestInit = {}, retried = false): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  if ((res.status === 401 || res.status === 403) && !retried) {
    const cid = process.env.NETATMO_CLIENT_ID
    const csec = process.env.NETATMO_CLIENT_SECRET
    const ref = process.env.NETATMO_REFRESH_TOKEN
    if (cid && csec && ref) {
      const tr = await fetch("https://api.netatmo.com/oauth2/token", {
        method: "POST",
        headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: ref, client_id: cid, client_secret: csec }).toString(),
      })
      if (tr.ok) {
        const td = (await tr.json()) as { access_token?: string }
        if (td.access_token) {
          process.env.NETATMO_ACCESS_TOKEN = td.access_token
          return nreq(url, init, true)
        }
      }
    }
  }
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new NetatmoError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  return nreq(url, init)
}

export async function getWeatherStations(): Promise<string> {
  let url = `https://api.netatmo.com/api/getstationsdata`;
  const data = await req(url);
  return pretty(data);
}

export async function getHomeData(): Promise<string> {
  let url = `https://api.netatmo.com/api/gethomedata`;
  const data = await req(url);
  return pretty(data);
}

export async function getHomeStatus(homeId: string): Promise<string> {
  let url = `https://api.netatmo.com/api/homestatus`;
  const qs = new URLSearchParams();
  qs.append("home_id", String(homeId));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getEvents(homeId: string): Promise<string> {
  let url = `https://api.netatmo.com/api/getevents`;
  const qs = new URLSearchParams();
  qs.append("home_id", String(homeId));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
