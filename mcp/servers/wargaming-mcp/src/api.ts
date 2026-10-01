export class WargamingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WargamingError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.WARGAMING_APP_ID
  if (!k) throw new WargamingError("Set the WARGAMING_APP_ID environment variable.")
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
    throw new WargamingError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchWotAccounts(search: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.worldoftanks.com/wot/account/list/`;
  const qs = new URLSearchParams();
  qs.append("application_id", key);
  qs.append("search", String(search));
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getWotAccount(accountId: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.worldoftanks.com/wot/account/info/`;
  const qs = new URLSearchParams();
  qs.append("application_id", key);
  qs.append("account_id", String(accountId));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getWotTanks(accountId: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.worldoftanks.com/wot/account/tanks/`;
  const qs = new URLSearchParams();
  qs.append("application_id", key);
  qs.append("account_id", String(accountId));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function searchWotClans(search: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.worldoftanks.com/wot/clans/list/`;
  const qs = new URLSearchParams();
  qs.append("application_id", key);
  qs.append("search", String(search));
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function searchWowsAccounts(search: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.worldofwarships.com/wows/account/list/`;
  const qs = new URLSearchParams();
  qs.append("application_id", key);
  qs.append("search", String(search));
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getWowsAccount(accountId: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.worldofwarships.com/wows/account/info/`;
  const qs = new URLSearchParams();
  qs.append("application_id", key);
  qs.append("account_id", String(accountId));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
