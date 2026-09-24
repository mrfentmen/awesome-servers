export class OhdearError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OhdearError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new OhdearError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("OHDEAR_API_TOKEN"), Accept: "application/json" }
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
    throw new OhdearError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listMonitors(): Promise<string> {
  let url = `https://ohdear.app/api/monitors`;
  const data = await req(url);
  return pretty(data);
}

export async function getMonitor(monitorId: string): Promise<string> {
  let url = `https://ohdear.app/api/monitors/${encodeURIComponent(String(monitorId))}`;
  const data = await req(url);
  return pretty(data);
}

export async function getMonitorByUrl(monitorUrl: string): Promise<string> {
  let url = `https://ohdear.app/api/monitors/url/${encodeURIComponent(String(monitorUrl))}`;
  const data = await req(url);
  return pretty(data);
}
