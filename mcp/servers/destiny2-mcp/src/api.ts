export class Destiny2Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = "Destiny2Error"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.BUNGIE_API_KEY
  if (!k) throw new Destiny2Error("Set the BUNGIE_API_KEY environment variable.")
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
    throw new Destiny2Error(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchPlayer(displayName: string, membershipType?: number): Promise<string> {
  const key = apiKey()
  let url = `https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/${encodeURIComponent(String(membershipType))}/${encodeURIComponent(String(displayName))}/`;
  const data = await req(url, { headers: { "X-API-Key": key } });
  return pretty(data);
}

export async function getProfile(membershipType: number, membershipId: string, components?: string): Promise<string> {
  const key = apiKey()
  let url = `https://www.bungie.net/Platform/Destiny2/${encodeURIComponent(String(membershipType))}/Profile/${encodeURIComponent(String(membershipId))}/`;
  const qs = new URLSearchParams();
  if (components !== undefined) qs.append("components", String(components));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "X-API-Key": key } });
  return pretty(data);
}

export async function getCharacter(membershipType: number, membershipId: string, characterId: string, components?: string): Promise<string> {
  const key = apiKey()
  let url = `https://www.bungie.net/Platform/Destiny2/${encodeURIComponent(String(membershipType))}/Profile/${encodeURIComponent(String(membershipId))}/Character/${encodeURIComponent(String(characterId))}/`;
  const qs = new URLSearchParams();
  if (components !== undefined) qs.append("components", String(components));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "X-API-Key": key } });
  return pretty(data);
}

export async function getMilestones(): Promise<string> {
  const key = apiKey()
  let url = `https://www.bungie.net/Platform/Destiny2/Milestones/`;
  const data = await req(url, { headers: { "X-API-Key": key } });
  return pretty(data);
}

export async function getManifest(): Promise<string> {
  const key = apiKey()
  let url = `https://www.bungie.net/Platform/Destiny2/Manifest/`;
  const data = await req(url, { headers: { "X-API-Key": key } });
  return pretty(data);
}
