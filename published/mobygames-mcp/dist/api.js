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
const STEAM_UA = { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" };
async function steamJson(url) {
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...STEAM_UA } });
    }
    catch (e) {
        throw new MobyError(`Steam network error: ${e.message}`);
    }
    if (!res.ok)
        throw new MobyError(`Steam returned ${res.status}`);
    const body = (await res.text()).trim();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new MobyError(`Steam answered ${url.split("?")[0]} with something that is not JSON, which usually means the endpoint is throttling.`);
    }
}
function steamMoney(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) / 100 : null;
}
function steamLanguages(value) {
    if (!value)
        return [];
    if (typeof value === "string")
        return value.replace(/<[^>]+>/g, ", ").split(/,\s*/).map((s) => s.trim()).filter(Boolean);
    if (typeof value === "object")
        return Object.values(value).map(String).filter(Boolean);
    return [];
}
export async function steamGameProfile(appid, limit) {
    const id = Number(appid);
    if (!Number.isFinite(id) || id <= 0)
        throw new MobyError(`Not a Steam app id: "${appid}". Try 400 for Portal.`);
    const n = Math.min(Math.max(Number(limit ?? 8) || 8, 1), 20);
    const body = await steamJson(`${STEAM_STORE}/appdetails?appids=${id}&cc=us&l=en`);
    const entry = body?.[String(id)];
    if (!entry || entry.success !== true || !entry.data)
        throw new MobyError(`Steam has no store entry for app id ${id} (it may be region-locked or delisted).`);
    const d = entry.data;
    const price = d.price_overview ?? null;
    const achievements = d.achievements ?? null;
    const languages = steamLanguages(d.supported_languages);
    const lines = [
        `${d.name ?? `app ${id}`} (app ${id})${d.type ? ` — ${d.type}` : ""}`,
        `${String(d.short_description ?? "").trim()}`,
        "",
        `Developers: ${(d.developers ?? []).join(", ") || "not published"}`,
        `Publishers: ${(d.publishers ?? []).join(", ") || "not published"}`,
        `Genres: ${(d.genres ?? []).map((g) => g.description).filter(Boolean).join(", ") || "not published"}`,
        `Release: ${d.release_date?.date ?? "not published"}${d.release_date?.coming_soon ? " (coming soon)" : ""}`,
        `Platforms: ${["windows", "mac", "linux"].filter((p) => d.platforms?.[p]).join(", ") || "none listed"}`,
    ];
    if (price) {
        const initial = steamMoney(price.initial);
        const final = steamMoney(price.final);
        lines.push(`Price (US): ${price.final_formatted ?? (final !== null ? `$${final.toFixed(2)}` : "not published")}${price.discount_percent ? ` (${price.discount_percent}% off ${initial !== null ? `$${initial.toFixed(2)}` : "list"})` : ""}`);
    }
    else {
        lines.push("Price (US): not published (free, unreleased, or region-restricted)");
    }
    if (d.recommendations?.total !== undefined)
        lines.push(`Review recommendations: ${Number(d.recommendations.total).toLocaleString()}`);
    if (d.metacritic?.score !== undefined)
        lines.push(`Metacritic: ${d.metacritic.score}`);
    if (achievements?.total !== undefined) {
        lines.push(`Achievements: ${achievements.total}`);
        const highlighted = Array.isArray(achievements.highlighted) ? achievements.highlighted : [];
        for (const a of highlighted.slice(0, n))
            lines.push(`  ${a.name ?? "(unnamed)"}${a.path ? " (" + String(a.path).replace(/^.*\//, "") + ")" : ""}`);
        if (!highlighted.length)
            lines.push("  Steam did not mark any achievements as highlighted.");
    }
    else {
        lines.push("Achievements: Steam publishes none for this app.");
    }
    const categories = (d.categories ?? []).map((c) => c.description).filter(Boolean);
    if (categories.length)
        lines.push(`Categories: ${categories.slice(0, 12).join(", ")}${categories.length > 12 ? ", ..." : ""}`);
    if (languages.length)
        lines.push(`Languages: ${languages.slice(0, 16).join(", ")}${languages.length > 16 ? ", ..." : ""}`);
    lines.push("", "Read from Valve's public appdetails endpoint for the US storefront; prices and reviews change without notice.");
    return lines.join("\n");
}
export async function steamSpecialsCensus(limit) {
    const n = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 40);
    const body = await steamJson(`${STEAM_STORE}/featuredcategories?cc=us&l=en`);
    const items = Array.isArray(body?.specials?.items) ? body.specials.items : [];
    const deals = items
        .map((it) => {
        const percent = Number(it.discount_percent ?? 0) || 0;
        const was = steamMoney(it.original_price);
        const now = steamMoney(it.final_price);
        return {
            id: it.id,
            name: String(it.name ?? `app ${it.id}`),
            percent,
            was,
            now,
            saving: was !== null && now !== null ? Math.round((was - now) * 100) / 100 : null,
            currency: it.currency ?? "USD",
        };
    })
        .filter((d) => d.percent > 0 && d.now !== null)
        .sort((a, b) => b.percent - a.percent || (b.saving ?? 0) - (a.saving ?? 0));
    if (!deals.length)
        throw new MobyError("Steam's featured specials feed is empty right now; the store rotates it, so try again later.");
    const percents = deals.map((d) => d.percent).sort((a, b) => a - b);
    const mid = percents.length % 2 ? percents[(percents.length - 1) / 2] : (percents[percents.length / 2 - 1] + percents[percents.length / 2]) / 2;
    const bands = [[1, 24], [25, 49], [50, 74], [75, 100]].map(([lo, hi]) => ({
        label: `${lo}-${hi}%`,
        count: deals.filter((d) => d.percent >= lo && d.percent <= hi).length,
    }));
    const lines = [
        `Steam specials (US storefront): ${deals.length} discounted title(s)`,
        `Median discount ${mid}% | deepest ${percents[percents.length - 1]}% | shallowest ${percents[0]}%`,
        `Bands: ${bands.map((b) => `${b.label} ${b.count}`).join(" | ")}`,
        "",
        `Top ${Math.min(n, deals.length)} by depth of discount:`,
    ];
    for (const d of deals.slice(0, n)) {
        const price = d.now !== null ? `$${d.now.toFixed(2)}` : "price not published";
        const was = d.was !== null ? ` (was $${d.was.toFixed(2)})` : "";
        lines.push(`  ${d.percent}% off — ${d.name} — ${price}${was} — app ${d.id}`);
    }
    lines.push("", "Read from Valve's public featured-categories feed; it is a curated rotation, not the whole store, and prices are the US storefront.");
    return lines.join("\n");
}
