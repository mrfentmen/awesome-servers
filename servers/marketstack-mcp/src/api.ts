export class MarketstackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MarketstackError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new MarketstackError(`Set the ${name} environment variable.`)
  return v
}

function apiKey(): string {
  return envStrict("MARKETSTACK_API_KEY")
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
    throw new MarketstackError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getLatestEod(symbols: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.marketstack.com/v1/eod`;
  const qs = new URLSearchParams();
  qs.append("access_key", key);
  qs.append("symbols", String(symbols));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getEodOnDate(symbols: string, date: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.marketstack.com/v1/eod/${encodeURIComponent(String(date))}`;
  const qs = new URLSearchParams();
  qs.append("access_key", key);
  qs.append("symbols", String(symbols));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function searchTickers(query: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.marketstack.com/v1/tickers`;
  const qs = new URLSearchParams();
  qs.append("access_key", key);
  qs.append("search", String(query));
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function listExchanges(): Promise<string> {
  const key = apiKey()
  let url = `https://api.marketstack.com/v1/exchanges`;
  const qs = new URLSearchParams();
  qs.append("access_key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getDividends(symbols: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.marketstack.com/v1/dividends`;
  const qs = new URLSearchParams();
  qs.append("access_key", key);
  qs.append("symbols", String(symbols));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
