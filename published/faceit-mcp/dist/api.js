export class FaceitError extends Error {
    constructor(message) {
        super(message);
        this.name = "FaceitError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function apiKey() {
    const k = process.env.FACEIT_API_KEY;
    if (!k)
        throw new FaceitError("Set the FACEIT_API_KEY environment variable.");
    return k;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
function stripHtml(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new FaceitError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function searchPlayers(nickname) {
    const key = apiKey();
    let url = `https://open.faceit.com/data/v4/search/players`;
    const qs = new URLSearchParams();
    qs.append("nickname", String(nickname));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
    return pretty(data);
}
export async function getPlayer(playerId) {
    const key = apiKey();
    let url = `https://open.faceit.com/data/v4/players/${encodeURIComponent(String(playerId))}`;
    const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
    return pretty(data);
}
export async function getPlayerStats(playerId, game) {
    const key = apiKey();
    let url = `https://open.faceit.com/data/v4/players/${encodeURIComponent(String(playerId))}/stats/${encodeURIComponent(String(game))}`;
    const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
    return pretty(data);
}
export async function getPlayerHistory(playerId, game, offset, limit) {
    const key = apiKey();
    let url = `https://open.faceit.com/data/v4/players/${encodeURIComponent(String(playerId))}/history`;
    const qs = new URLSearchParams();
    if (game !== undefined)
        qs.append("game", String(game));
    if (offset !== undefined)
        qs.append("offset", String(offset));
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
    return pretty(data);
}
export async function searchTeams(name) {
    const key = apiKey();
    let url = `https://open.faceit.com/data/v4/search/teams`;
    const qs = new URLSearchParams();
    qs.append("name", String(name));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
    return pretty(data);
}
export async function getChampionships(game, limit) {
    const key = apiKey();
    let url = `https://open.faceit.com/data/v4/championships`;
    const qs = new URLSearchParams();
    if (game !== undefined)
        qs.append("game", String(game));
    qs.append("offset", "0");
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url, { headers: { "Authorization": "Bearer " + key } });
    return pretty(data);
}
