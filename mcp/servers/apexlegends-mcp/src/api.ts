export class ApexlegendsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApexlegendsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.MOZAMBIQUEHE_API_KEY
  if (!k) throw new ApexlegendsError("Set the MOZAMBIQUEHE_API_KEY environment variable.")
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
    throw new ApexlegendsError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getPlayer(player: string, platform?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.mozambiquehe.re/bridge`;
  const qs = new URLSearchParams();
  qs.append("auth", key);
  qs.append("player", String(player));
  if (platform !== undefined) qs.append("platform", String(platform));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getPlayerByUid(uid: string, platform?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.mozambiquehe.re/bridge`;
  const qs = new URLSearchParams();
  qs.append("auth", key);
  qs.append("uid", String(uid));
  if (platform !== undefined) qs.append("platform", String(platform));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getMapRotation(): Promise<string> {
  const key = apiKey()
  let url = `https://api.mozambiquehe.re/maprotation`;
  const qs = new URLSearchParams();
  qs.append("auth", key);
  qs.append("version", "2");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getCraftingRotation(): Promise<string> {
  const key = apiKey()
  let url = `https://api.mozambiquehe.re/crafting`;
  const qs = new URLSearchParams();
  qs.append("auth", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getPredatorCounts(): Promise<string> {
  const key = apiKey()
  let url = `https://api.mozambiquehe.re/predator`;
  const qs = new URLSearchParams();
  qs.append("auth", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getServerStatus(): Promise<string> {
  const key = apiKey()
  let url = `https://api.mozambiquehe.re/server`;
  const qs = new URLSearchParams();
  qs.append("auth", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
