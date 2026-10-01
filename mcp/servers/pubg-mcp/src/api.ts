export class PubgError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PubgError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.PUBG_API_KEY
  if (!k) throw new PubgError("Set the PUBG_API_KEY environment variable.")
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
    throw new PubgError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getPlayer(playerName: string, shard?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.pubg.com/shards/${encodeURIComponent(String(shard))}/players`;
  const qs = new URLSearchParams();
  qs.append("filter[playerNames]", String(playerName));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key, "Accept": "application/vnd.api+json" } });
  return pretty(data);
}

export async function getMatch(matchId: string, shard?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.pubg.com/shards/${encodeURIComponent(String(shard))}/matches/${encodeURIComponent(String(matchId))}`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key, "Accept": "application/vnd.api+json" } });
  return pretty(data);
}

export async function getSeasons(shard?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.pubg.com/shards/${encodeURIComponent(String(shard))}/seasons`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key, "Accept": "application/vnd.api+json" } });
  return pretty(data);
}

export async function getLifetimeStats(accountId: string, shard?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.pubg.com/shards/${encodeURIComponent(String(shard))}/players/${encodeURIComponent(String(accountId))}/seasons/lifetime`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key, "Accept": "application/vnd.api+json" } });
  return pretty(data);
}

export async function getSeasonStats(accountId: string, seasonId: string, shard?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.pubg.com/shards/${encodeURIComponent(String(shard))}/players/${encodeURIComponent(String(accountId))}/seasons/${encodeURIComponent(String(seasonId))}`;
  const data = await req(url, { headers: { "Authorization": "Bearer " + key, "Accept": "application/vnd.api+json" } });
  return pretty(data);
}
