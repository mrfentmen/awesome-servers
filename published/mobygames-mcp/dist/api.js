export class MobyError extends Error {
    constructor(message) {
        super(message);
        this.name = "MobyError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.mobygames.com/v1";
async function req(path, params) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new MobyError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new MobyError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
function key() {
    const k = process.env.MOBYGAMES_API_KEY;
    if (!k)
        throw new MobyError("Set MOBYGAMES_API_KEY (free MobyGames API key).");
    return k;
}
export function searchGames(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return req(`/games?api_key=${encodeURIComponent(key())}&title=${encodeURIComponent(query)}&limit=${n}`, {});
}
export function getGame(gameId) {
    return req(`/games/${encodeURIComponent(gameId)}?api_key=${encodeURIComponent(key())}`, {});
}
// ---- muxF tools:
const STEAM_STORE = "https://store.steampowered.com/api";
// Steam sends supported_languages as an object keyed by code, not a list.
