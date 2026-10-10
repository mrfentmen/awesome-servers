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
/**
 * The Steam store record for an app: what it is, who made it, when it shipped,
 * which platforms and feature tags it carries, its price and its content notes.
 * RAWG aggregates this from many places; this is the storefront's own answer.
 */
export async function steamStoreInfo(args) {
    const appId = String(args.app_id ?? "").trim();
    const { app } = await steamApp(appId);
    const platforms = Object.entries(app.platforms ?? {})
        .filter(([, on]) => on === true)
        .map(([name]) => name);
    const price = app.price_overview;
    const free = app.is_free === true;
    const about = stripTags(app.about_the_game || app.detailed_description);
    const highlights = (app.achievements?.highlighted ?? []).slice(0, 3).map((a) => a.name);
    return [
        `${app.name ?? "untitled"} on Steam (app ${app.steam_appid ?? appId})`,
        `  type: ${app.type ?? "not reported"} | free to play: ${free ? "yes" : "no"}${app.required_age ? ` | minimum age: ${app.required_age}` : ""}`,
        `  developer: ${(app.developers ?? []).join(", ") || "not reported"}`,
        `  publisher: ${(app.publishers ?? []).join(", ") || "not reported"}`,
        `  released: ${String(app.release_date?.date ?? "not reported")}${app.release_date?.coming_soon ? " (not released yet)" : ""}`,
        "",
        `  platforms: ${platforms.join(", ") || "none listed"}`,
        `  genres: ${(app.genres ?? []).map((g) => g.description).filter(Boolean).join(", ") || "none listed"}`,
        `  feature tags: ${(app.categories ?? []).map((c) => c.description).filter(Boolean).slice(0, 10).join(", ") || "none listed"}`,
        "",
        price
            ? `  price: ${price.final_formatted ?? "not reported"}${price.discount_percent ? ` (was ${price.initial_formatted}, ${price.discount_percent}% off)` : ""} in ${price.currency ?? "an unreported currency"}`
            : `  price: ${free ? "free to play, no purchase price" : "not listed on the store"}`,
        `  recommendations: ${app.recommendations?.total?.toLocaleString() ?? "not reported"}`,
        app.metacritic?.score ? `  Metacritic: ${app.metacritic.score}` : "  Metacritic: no score published on the store page",
        app.content_descriptors?.notes ? `  content notes: ${app.content_descriptors.notes}` : "",
        app.supported_languages ? `  languages: ${stripTags(app.supported_languages).slice(0, 160)}` : "",
        "",
        `  DLC entries: ${(app.dlc ?? []).length} | achievements: ${app.achievements?.total ?? 0} | screenshots: ${(app.screenshots ?? []).length} | trailers: ${(app.movies ?? []).length}`,
        highlights.length ? `  highlighted achievements: ${highlights.join(" | ")}` : "",
        "",
        `  about: ${about ? about.slice(0, 420) : "the store page carries no about text"}`,
        `  ${`https://store.steampowered.com/app/${app.steam_appid ?? appId}/`}`,
        "Source: the public Steam store web API.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
/**
 * How big a Steam title actually is: the ownership bracket SteamSpy estimates,
 * the players online right now, the positive and negative review split and the
 * median playtime. This is the only place a game's real reach is published.
 */
export async function steamReach(args) {
    const appId = String(args.app_id ?? "").trim();
    if (!/^\d{1,10}$/.test(appId))
        throw new RawgError(`"${appId}" is not a Steam app id.`);
    const spy = await steamSpyApp(appId);
    if (!spy) {
        throw new RawgError(`SteamSpy has no ownership record for app ${appId}. It covers games with at least 100,000 owners, so a small title will not appear.`);
    }
    const positive = spy.positive ?? 0;
    const negative = spy.negative ?? 0;
    const total = positive + negative;
    const ratio = total > 0 ? (positive / total) * 100 : 0;
    const ownersMin = spy.owners_min ?? 0;
    const ownersMax = spy.owners_max ?? 0;
    const hours = (value) => (typeof value === "number" ? `${Math.round(value)} h` : "not reported");
    const tags = Object.entries(spy.tags ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const languages = Object.entries(spy.languages ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return [
        `Steam reach: ${spy.name ?? `app ${appId}`}`,
        `  developer: ${spy.developer || "not reported"} | publisher: ${spy.publisher || "not reported"} | genre: ${spy.genre || "not reported"}`,
        "",
        `  estimated owners: ${spy.owners ?? "not reported"}${ownersMax > 0 ? ` (bracket ${ownersMin.toLocaleString()} to ${ownersMax.toLocaleString()})` : ""}`,
        `  concurrent players right now: ${(spy.ccu ?? 0).toLocaleString()}`,
        spy.ccu && ownersMax ? `  peak concurrency as a share of the ownership bracket: ${((spy.ccu / ownersMax) * 100).toFixed(1)}%` : "",
        "",
        `  reviews: ${positive.toLocaleString()} positive, ${negative.toLocaleString()} negative — ${ratio.toFixed(1)}% positive`,
        `  median playtime: ${hours(spy.median_forever)} | average playtime: ${hours(spy.average_forever)}`,
        `  last two weeks: median ${hours(spy.median_2weeks)}, average ${hours(spy.average_2weeks)}`,
        ratio > 0 && ratio < 70
            ? "  a sub-70% positive rate is what players complain about most in the store."
            : ratio >= 90
                ? "  a 90%-plus positive rate is a well-regarded title."
                : "",
        "",
        `  price now: ${spy.price || "not reported"}${spy.initialprice && spy.initialprice !== spy.price ? ` (originally ${spy.initialprice})` : ""}${spy.discount && spy.discount !== "0%" ? `, ${spy.discount} off` : ""}`,
        tags.length ? `  community tags: ${tags.map(([name, n]) => `${name} ${n}`).join(", ")}` : "  community tags: none recorded",
        languages.length ? `  languages by share: ${languages.map(([code, n]) => `${code} ${(n * 100).toFixed(0)}%`).join(", ")}` : "",
        "",
        "SteamSpy figures are sampled from SteamSpy's own server logs and are estimates on brackets, not exact counts. Games under 100,000 owners are not covered at all.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
