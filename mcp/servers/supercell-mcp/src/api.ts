export class SupercellError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupercellError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.SUPERCELL_API_TOKEN
  if (!k) throw new SupercellError("Set the SUPERCELL_API_TOKEN environment variable.")
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
    throw new SupercellError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getCocPlayer(tag: string): Promise<string> {
  const key = apiKey()
  const tagEnc = "%23" + tag.replace(/^#/, "");
  let url = `https://api.clashofclans.com/v1/players/${tagEnc}`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
  return pretty(data);
}

export async function getCocClan(tag: string): Promise<string> {
  const key = apiKey()
  const tagEnc = "%23" + tag.replace(/^#/, "");
  let url = `https://api.clashofclans.com/v1/clans/${tagEnc}`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
  return pretty(data);
}

export async function searchCocClans(name: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.clashofclans.com/v1/clans`;
  const qs = new URLSearchParams();
  qs.append("name", String(name));
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
  return pretty(data);
}

export async function getRoyalePlayer(tag: string): Promise<string> {
  const key = apiKey()
  const tagEnc = "%23" + tag.replace(/^#/, "");
  let url = `https://api.clashroyale.com/v1/players/${tagEnc}`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
  return pretty(data);
}

export async function getRoyaleClan(tag: string): Promise<string> {
  const key = apiKey()
  const tagEnc = "%23" + tag.replace(/^#/, "");
  let url = `https://api.clashroyale.com/v1/clans/${tagEnc}`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
  return pretty(data);
}

export async function getRoyaleTopClans(locationId?: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.clashroyale.com/v1/locations/${encodeURIComponent(String(locationId))}/rankings/clans`;
  const qs = new URLSearchParams();
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
  return pretty(data);
}
