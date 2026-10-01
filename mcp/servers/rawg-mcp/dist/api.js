export class RawgError extends Error {
    constructor(message) {
        super(message);
        this.name = "RawgError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.rawg.io/api";
async function req(path, params) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new RawgError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new RawgError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
function key() {
    const k = process.env.RAWG_API_KEY;
    if (!k)
        throw new RawgError("Set RAWG_API_KEY (free at rawg.io/apidocs).");
    return k;
}
function slimGame(g) {
    const plats = (g.platforms ?? [])
        .map((p) => p.platform?.name).filter(Boolean);
    const genres = (g.genres ?? []).map((x) => x.name).filter(Boolean);
    return { id: g.id, slug: g.slug, name: g.name, released: g.released, rating: g.rating,
        ratings_count: g.ratings_count, metacritic: g.metacritic ?? null, platforms: plats,
        genres, image: g.background_image ?? null };
}
export function searchGames(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 40);
    return req(`/games?key=${encodeURIComponent(key())}&search=${encodeURIComponent(query)}&page_size=${n}`, {}).then((t) => {
        const d = JSON.parse(t);
        return JSON.stringify({ count: d.count ?? null, games: (d.results ?? []).map(slimGame) }, null, 2);
    });
}
export function getGame(gameId) {
    return req(`/games/${encodeURIComponent(gameId)}?key=${encodeURIComponent(key())}`, {}).then((t) => JSON.stringify(slimGame(JSON.parse(t)), null, 2));
}
// ---- muxH tools:
// The tools above read RAWG, which needs a key. Steam publishes its own store
// metadata and SteamSpy publishes ownership and concurrency estimates, all
// keylessly, and between them they answer the two questions a game database
// actually gets asked: what is this title, and how big is it actually.
const STEAM_APP = "https://store.steampowered.com/api/appdetails";
const STEAMSPY = "https://steamspy.com/api.php";
const RAWG_UA = "rawg-mcp/1.1 (https://github.com/mrfentmen/rawg-mcp)";
async function steamApp(appId) {
    if (!/^\d{1,10}$/.test(appId))
        throw new RawgError(`"${appId}" is not a Steam app id. Those are the numbers in store.steampowered.com/app/<id>/.`);
    let res;
    try {
        res = await fetch(`${STEAM_APP}?appids=${encodeURIComponent(appId)}&l=english`, {
            headers: { Accept: "application/json", "User-Agent": RAWG_UA },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new RawgError(`Could not reach the Steam store: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok)
        throw new RawgError(`Steam store error ${res.status}: ${res.statusText}`);
    const body = (await res.json());
    const entry = body[appId];
    if (!entry?.success || !entry.data)
        throw new RawgError(`Steam has no store page for app ${appId}, or it is not published in this region.`);
    return { app: entry.data };
}
async function steamSpyApp(appId) {
    try {
        const res = await fetch(`${STEAMSPY}?request=appdetails&appid=${encodeURIComponent(appId)}`, {
            headers: { Accept: "application/json", "User-Agent": RAWG_UA },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            return null;
        const body = (await res.json());
        return body.error ? null : body;
    }
    catch {
        return null;
    }
}
const stripTags = (html) => String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
