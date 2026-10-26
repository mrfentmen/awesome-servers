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
const STEAM_REVIEWS = "https://store.steampowered.com/appreviews/";
const shown = (v) => (v === undefined || v === null || v === "" ? "not published" : String(v));
const listOf = (arr, key = "description") => (Array.isArray(arr) ? arr.map((x) => (typeof x === "string" ? x : x?.[key])).filter(Boolean) : []);
const hours = (minutes) => {
    const n = Number(minutes);
    if (!Number.isFinite(n) || n <= 0)
        return "not published";
    return `${(n / 60).toFixed(1)} h`;
};
async function steamReviews(appId) {
    try {
        const res = await fetch(`${STEAM_REVIEWS}${encodeURIComponent(appId)}?json=1&language=all&purchase_type=all&num_per_page=0`, {
            headers: { Accept: "application/json", "User-Agent": RAWG_UA },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            return null;
        const body = (await res.json());
        return body?.success ? body.query_summary ?? null : null;
    }
    catch {
        return null;
    }
}
/**
 * Steam's own store record, which is the canonical answer to "what is this
 * title" for anything sold on Steam, and needs no key.
 */
export async function steamStoreInfo(appId) {
    const id = String(appId ?? "").trim();
    const { app } = await steamApp(id);
    const platforms = app.platforms ?? {};
    const onPlatforms = [platforms.windows && "Windows", platforms.mac && "macOS", platforms.linux && "Linux"].filter(Boolean);
    const genres = listOf(app.genres);
    const features = listOf(app.categories);
    const price = app.price_overview;
    const priceLine = app.is_free
        ? "free to play"
        : price
            ? `${(price.final / 100).toFixed(2)} ${price.currency}${price.discount_percent ? ` (${price.discount_percent}% off, was ${(price.initial / 100).toFixed(2)})` : ""}`
            : "no price published";
    const release = app.release_date?.date ? `${app.release_date.date}${app.release_date.coming_soon ? " (coming soon)" : ""}` : "not published";
    const content = app.content_descriptors;
    const contentNotes = content?.notes ? stripTags(content.notes) : "";
    const rows = [
        `${shown(app.name)} (app ${id}) — ${shown(app.type)}`,
        `  developer        ${listOf(app.developers).join(", ") || "not published"}`,
        `  publisher        ${listOf(app.publishers).join(", ") || "not published"}`,
        `  released         ${release}`,
        `  platforms        ${onPlatforms.length ? onPlatforms.join(", ") : "none listed"}`,
        `  genres           ${genres.length ? genres.slice(0, 8).join(", ") : "not published"}`,
        `  features         ${features.length ? features.slice(0, 10).join(", ") : "not published"}`,
        `  price            ${priceLine}`,
        `  reviews          ${app.recommendations?.total ?? "not published"} total on Steam`,
        `  metacritic       ${app.metacritic?.score ?? "not published"}`,
        `  achievements     ${app.achievements?.total ?? "not published"}`,
        `  content notes    ${contentNotes || (content?.ids ? `descriptor ids ${content.ids.join(", ")}` : "none")}`,
    ];
    if (app.short_description)
        rows.push(`  summary          ${stripTags(app.short_description).slice(0, 240)}`);
    rows.push("", "note: read from store.steampowered.com for the English storefront; prices outside this region, delisted apps and review-bomb periods will not match what a local store page shows.");
    return rows.join("\n");
}
/**
 * SteamSpy publishes the ownership and concurrency estimates Valve never does,
 * and Steam's review summary gives the split. Together they size a title.
 */
export async function steamReach(appId) {
    const id = String(appId ?? "").trim();
    const { app } = await steamApp(id);
    const spy = await steamSpyApp(id);
    const reviews = await steamReviews(id);
    const positive = reviews?.total_positive ?? spy?.positive;
    const negative = reviews?.total_negative ?? spy?.negative;
    const total = reviews?.total_reviews ?? (Number(positive) || 0) + (Number(negative) || 0);
    const split = Number(total) > 0
        ? `${Number(positive)} positive / ${Number(negative)} negative — ${((Number(positive) / Number(total)) * 100).toFixed(1)}% positive${reviews?.review_score_desc ? ` (${reviews.review_score_desc})` : ""}`
        : "no reviews published";
    const tags = spy?.tags && typeof spy.tags === "object"
        ? Object.entries(spy.tags).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 12)
        : [];
    const rows = [
        `${shown(app.name)} (app ${id}) — reach`,
        `  owners (estimate)  ${spy?.owners ?? "SteamSpy did not answer"}`,
        `  players online     ${spy?.ccu !== undefined ? spy.ccu.toLocaleString("en-US") : "SteamSpy did not answer"}`,
        `  reviews            ${split}`,
        `  median playtime    ${hours(spy?.median_forever)}`,
        `  average playtime   ${hours(spy?.average_forever)}`,
        `  userscore          ${spy?.userscore ? `${spy.userscore}/100` : "not published"}`,
        `  tags               ${tags.length ? tags.map(([t, n]) => `${t} (${n})`).join(", ") : "not published"}`,
    ];
    if (Number(spy?.discount ?? 0) > 0 && spy?.price)
        rows.push(`  current price      ${(Number(spy.price) / 100).toFixed(2)} USD, ${spy.discount}% off (initial ${(Number(spy.initialprice) / 100).toFixed(2)})`);
    rows.push("", "note: online players and the ownership bracket are SteamSpy estimates, not Valve figures; the review split is Steam's own summary across all languages and purchase types. A very new or very small title often has no estimate at all, which is shown rather than guessed.");
    return rows.join("\n");
}
