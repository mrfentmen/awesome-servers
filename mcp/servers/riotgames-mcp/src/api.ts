export class RiotgamesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RiotgamesError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.RIOT_API_KEY
  if (!k) throw new RiotgamesError("Set the RIOT_API_KEY environment variable.")
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
    throw new RiotgamesError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getAccountByRiotId(gameName: string, tagLine: string, cluster?: string): Promise<string> {
  const key = apiKey()
  let url = `https://${encodeURIComponent(String(cluster))}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(String(gameName))}/${encodeURIComponent(String(tagLine))}`;
  const data = await req(url, { headers: { "X-Riot-Token": key } });
  return pretty(data);
}

export async function getLolSummoner(puuid: string, platform?: string): Promise<string> {
  const key = apiKey()
  let url = `https://${encodeURIComponent(String(platform))}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(String(puuid))}`;
  const data = await req(url, { headers: { "X-Riot-Token": key } });
  return pretty(data);
}

export async function getLolMatchIds(puuid: string, cluster?: string, count?: number): Promise<string> {
  const key = apiKey()
  let url = `https://${encodeURIComponent(String(cluster))}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(String(puuid))}/ids`;
  const qs = new URLSearchParams();
  if (count !== undefined) qs.append("count", String(count));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "X-Riot-Token": key } });
  return pretty(data);
}

export async function getLolMatch(matchId: string, cluster?: string): Promise<string> {
  const key = apiKey()
  let url = `https://${encodeURIComponent(String(cluster))}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(String(matchId))}`;
  const data = await req(url, { headers: { "X-Riot-Token": key } });
  return pretty(data);
}

export async function getLolChampionMastery(puuid: string, platform?: string, count?: number): Promise<string> {
  const key = apiKey()
  let url = `https://${encodeURIComponent(String(platform))}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(String(puuid))}/top`;
  const qs = new URLSearchParams();
  if (count !== undefined) qs.append("count", String(count));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "X-Riot-Token": key } });
  return pretty(data);
}

export async function getDdragonVersions(): Promise<string> {
  let url = `https://ddragon.leagueoflegends.com/api/versions.json`;
  const data = await req(url);
  return pretty(data);
}
