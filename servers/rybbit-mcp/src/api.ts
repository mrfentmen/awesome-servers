export class RybbitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RybbitError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new RybbitError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("RYBBIT_API_KEY") };
}
function rybbitBase(): string {
  return (process.env.RYBBIT_BASE_URL ?? "https://app.rybbit.io").replace(/\/$/, "");
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
    throw new RybbitError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getOverview(site: string, startDate: string, endDate: string, timeZone?: string): Promise<string> {
  const base = rybbitBase();
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
  qs.append("time_zone", timeZone ?? "UTC");
  const data = await req(`${base}/api/sites/${encodeURIComponent(site)}/overview?${qs.toString()}`);
  return pretty(data);
}

export async function listUsers(site: string, startDate: string, endDate: string, timeZone?: string, limit?: number): Promise<string> {
  const base = rybbitBase();
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
  qs.append("time_zone", timeZone ?? "UTC");
  qs.append('limit', String(limit ?? 20));
  const data = await req(`${base}/api/sites/${encodeURIComponent(site)}/users?${qs.toString()}`);
  return pretty(data);
}

export async function getJourneys(site: string, startDate: string, endDate: string, timeZone?: string): Promise<string> {
  const base = rybbitBase();
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
  qs.append("time_zone", timeZone ?? "UTC");
  const data = await req(`${base}/api/sites/${encodeURIComponent(site)}/journeys?${qs.toString()}`);
  return pretty(data);
}
