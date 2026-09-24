export class SimplecastError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SimplecastError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new SimplecastError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("SIMPLECAST_API_KEY") };
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SimplecastError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listPodcasts(): Promise<string> {
  let url = `https://api.simplecast.com/podcasts`;
  const data = await req(url);
  return pretty(data);
}

export async function listEpisodes(podcastId: string, limit?: number): Promise<string> {
  let url = `https://api.simplecast.com/podcasts/${encodeURIComponent(String(podcastId))}/episodes`;
  const qs = new URLSearchParams();
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getEpisode(episodeId: string): Promise<string> {
  let url = `https://api.simplecast.com/episodes/${encodeURIComponent(String(episodeId))}`;
  const data = await req(url);
  return pretty(data);
}
