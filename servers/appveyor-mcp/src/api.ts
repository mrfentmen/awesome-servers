export class AppveyorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppveyorError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new AppveyorError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("APPVEYOR_API_TOKEN") };
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
    throw new AppveyorError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listProjects(): Promise<string> {
  let url = `https://ci.appveyor.com/api/projects`;
  const data = await req(url);
  return pretty(data);
}

export async function getProject(account: string, slug: string): Promise<string> {
  let url = `https://ci.appveyor.com/api/projects/${encodeURIComponent(String(account))}/${encodeURIComponent(String(slug))}`;
  const data = await req(url);
  return pretty(data);
}

export async function getHistory(account: string, slug: string, records?: number): Promise<string> {
  let url = `https://ci.appveyor.com/api/projects/${encodeURIComponent(String(account))}/${encodeURIComponent(String(slug))}/history`;
  const qs = new URLSearchParams();
  if (records !== undefined) qs.append("recordsNumber", String(records));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
