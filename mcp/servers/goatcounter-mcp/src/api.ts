export class GoatcounterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GoatcounterError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new GoatcounterError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("GOATCOUNTER_API_KEY") };
}
async function gcBase(): Promise<string> {
  return envStrict("GOATCOUNTER_BASE_URL").replace(/\/$/, "");
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
    throw new GoatcounterError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getTotals(start?: string, end?: string): Promise<string> {
  const base = await gcBase();
  let url = `${base}/api/v0/stats/total`;
  const qs = new URLSearchParams();
  if (start !== undefined) qs.append("start", String(start));
  if (end !== undefined) qs.append("end", String(end));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getHits(limit?: number): Promise<string> {
  const base = await gcBase();
  let url = `${base}/api/v0/stats/hits`;
  const qs = new URLSearchParams();
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getBreakdown(page: string): Promise<string> {
  const base = await gcBase();
  let url = `${base}/api/v0/stats/${encodeURIComponent(String(page))}`;
  const data = await req(url);
  return pretty(data);
}
