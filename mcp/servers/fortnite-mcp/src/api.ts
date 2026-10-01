export class FortniteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FortniteError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

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
    throw new FortniteError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getBrNews(): Promise<string> {
  let url = `https://fortnite-api.com/v2/news/br`;
  const data = await req(url);
  return pretty(data);
}

export async function getBrShop(): Promise<string> {
  let url = `https://fortnite-api.com/v2/shop`;
  const data = await req(url);
  return pretty(data);
}

export async function getMap(): Promise<string> {
  let url = `https://fortnite-api.com/v2/map`;
  const data = await req(url);
  return pretty(data);
}

export async function getAes(): Promise<string> {
  let url = `https://fortnite-api.com/v2/aes`;
  const data = await req(url);
  return pretty(data);
}

export async function searchCosmetic(name: string, language?: string): Promise<string> {
  let url = `https://fortnite-api.com/v2/search/br`;
  const qs = new URLSearchParams();
  qs.append("name", String(name));
  if (language !== undefined) qs.append("language", String(language));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getPlaylists(): Promise<string> {
  let url = `https://fortnite-api.com/v2/playlists`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxC tools:

