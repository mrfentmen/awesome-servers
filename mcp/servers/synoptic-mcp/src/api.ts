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

