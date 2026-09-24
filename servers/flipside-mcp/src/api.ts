export class FlipsideError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FlipsideError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.FLIPSIDE_API_KEY
  if (!k) throw new FlipsideError("Set the FLIPSIDE_API_KEY environment variable.")
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
    throw new FlipsideError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function createQuery(sql: string, dataSource?: string, dataProvider?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries`;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key }, body: JSON.stringify({ sql, dataSource, dataProvider }) });
  return pretty(data);
}

export async function getQueryStatus(token: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries/${encodeURIComponent(String(token))}`;
  const data = await req(url, { headers: { "x-api-key": key } });
  return pretty(data);
}

export async function getQueryResults(token: string, pageNumber?: number, pageSize?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries/${encodeURIComponent(String(token))}/results`;
  const qs = new URLSearchParams();
  if (pageNumber !== undefined) qs.append("pageNumber", String(pageNumber));
  if (pageSize !== undefined) qs.append("pageSize", String(pageSize));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "x-api-key": key } });
  return pretty(data);
}

export async function cancelQuery(token: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries/${encodeURIComponent(String(token))}`;
  const data = await req(url, { method: "DELETE", headers: { "x-api-key": key } });
  return pretty(data);
}
