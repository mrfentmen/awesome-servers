export class PingdomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PingdomError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new PingdomError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("PINGDOM_API_TOKEN") }
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
    throw new PingdomError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listChecks(): Promise<string> {
  let url = `https://api.pingdom.com/api/3.1/checks`;
  const data = await req(url);
  return pretty(data);
}

export async function getCheck(checkId: string): Promise<string> {
  let url = `https://api.pingdom.com/api/3.1/checks/${encodeURIComponent(String(checkId))}`;
  const data = await req(url);
  return pretty(data);
}

export async function getResults(checkId: string, from?: string, to?: string): Promise<string> {
  let url = `https://api.pingdom.com/api/3.1/results/${encodeURIComponent(String(checkId))}`;
  const qs = new URLSearchParams();
  if (from !== undefined) qs.append("from", String(from));
  if (to !== undefined) qs.append("to", String(to));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getCredits(): Promise<string> {
  let url = `https://api.pingdom.com/api/3.1/credits`;
  const data = await req(url);
  return pretty(data);
}
