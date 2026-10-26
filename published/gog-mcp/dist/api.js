const CATALOG = "https://catalog.gog.com/v1/catalog";
const PRODUCTS = "https://api.gog.com/products";
const UA = "mrfentmen-gog-mcp/1.0 (https://github.com/mrfentmen)";
const LOCALE = "countryCode=US&locale=en-US&currencyCode=USD";
export class GogError extends Error {
}
async function getJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new GogError(`Not found (404): ${url}`);
    if (!res.ok)
        throw new GogError(`GOG returned ${res.status}`);
    return (await res.json());
}
const clamp = (n, def, max) => Math.min(Math.max(Number(n) || def, 1), max);
const PLATFORMS = { windows: "Windows", mac: "macOS", linux: "Linux" };
function fmtProduct(p, i) {
    const pre = i === undefined ? "" : `${i + 1}. `;
    const price = p.price?.final ? `${p.price.final}${p.price.discount ? ` (${p.price.discount} off ${p.price.base ?? ""})` : ""}` : "price n/a";
    const meta = [
        p.productType,
        p.operatingSystems?.length ? p.operatingSystems.map((o) => PLATFORMS[o] ?? o).join("/") : "",
        p.genres?.length ? p.genres.slice(0, 3).map((g) => g.name).filter(Boolean).join(", ") : "",
        // GOG exposes reviewsRating on a 0-50 scale, i.e. 43 -> 4.3 out of 5.
        typeof p.reviewsRating === "number" && p.reviewsRating > 0 ? `${(p.reviewsRating / 10).toFixed(1)}/5 (${p.reviewsCount ?? 0} reviews)` : "",
    ].filter(Boolean);
    const lines = [`${pre}${p.title ?? "Untitled"} — ${price}`];
    if (meta.length)
        lines.push(`   ${meta.join(" | ")}`);
    const dev = p.developers?.length ? `   by ${p.developers.slice(0, 2).join(", ")}` : "";
    if (dev)
        lines.push(dev);
    if (p.storeLink)
        lines.push(`   ${p.storeLink}`);
    return lines.join("\n");
}
const ORDERS = {
    trending: "desc:trending",
    newest: "desc:releaseDate",
    discount: "desc:discount",
    cheapest: "asc:price",
    rating: "desc:rating",
};
export async function browseGames(args) {
    const limit = clamp(args.limit, 10, 20);
    const order = ORDERS[args.order ?? "trending"] ?? ORDERS.trending;
    const d = await getJson(`${CATALOG}?limit=${limit}&order=${order}&${LOCALE}`);
    const items = d.products ?? [];
    if (!items.length)
        return "No GOG products returned.";
    return `GOG games (${args.order ?? "trending"}), ${(d.productCount ?? items.length).toLocaleString()} in catalog:\n\n${items.map((p, i) => fmtProduct(p, i)).join("\n\n")}`;
}
export async function searchGames(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        return "Provide a search query.";
    const limit = clamp(args.limit, 10, 20);
    const d = await getJson(`${CATALOG}?query=like%3A${encodeURIComponent(q)}&limit=${limit}&order=${ORDERS.trending}&${LOCALE}`);
    const items = d.products ?? [];
    if (!items.length)
        return `No GOG games match "${q}".`;
    return `GOG games matching "${q}" (${(d.productCount ?? items.length).toLocaleString()} found):\n\n${items.map((p, i) => fmtProduct(p, i)).join("\n\n")}`;
}
export async function deals(args) {
    const limit = clamp(args.limit, 10, 20);
    const min = Math.min(Math.max(Number(args.minDiscount) || 50, 1), 99);
    const d = await getJson(`${CATALOG}?limit=20&order=${ORDERS.discount}&${LOCALE}`);
    const items = (d.products ?? []).filter((p) => {
        const pct = Math.abs(Number(String(p.price?.discount ?? "").replace(/[^0-9.-]/g, "")));
        return Number.isFinite(pct) && pct >= min;
    });
    if (!items.length)
        return `No GOG deals at ${min}% off or more right now.`;
    return `GOG deals (${min}%+ off):\n\n${items.slice(0, limit).map((p, i) => fmtProduct(p, i)).join("\n\n")}`;
}
export async function topRated(args) {
    const limit = clamp(args.limit, 10, 20);
    const d = await getJson(`${CATALOG}?limit=${limit}&order=${ORDERS.rating}&${LOCALE}`);
    const items = d.products ?? [];
    if (!items.length)
        return "No GOG products returned.";
    return `Top-rated GOG games:\n\n${items.map((p, i) => fmtProduct(p, i)).join("\n\n")}`;
}
export async function gamesByIds(args) {
    const ids = String(args.ids ?? "")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s))
        .slice(0, 20);
    if (!ids.length)
        return "Provide one or more numeric product IDs, comma separated.";
    const list = await getJson(`${PRODUCTS}?ids=${ids.join(",")}`);
    if (!Array.isArray(list) || !list.length)
        return `No GOG products for ids ${ids.join(", ")}.`;
    return (`${list.length} GOG product(s) (catalog metadata; call game_details for prices):\n\n` +
        // This endpoint returns catalog metadata only — no prices. Call
        // game_details for pricing.
        list
            .map((p, i) => {
            const platforms = Object.entries(p?.content_system_compatibility ?? {})
                .filter(([, v]) => v === true)
                .map(([k]) => PLATFORMS[k] ?? k);
            return [
                `${i + 1}. ${p?.title ?? "Untitled"}`,
                platforms.length ? `   ${platforms.join("/")}` : "",
                p?.slug ? `   https://www.gog.com/game/${p.slug}` : "",
            ]
                .filter(Boolean)
                .join("\n");
        })
            .join("\n\n"));
}
export async function gameDetails(args) {
    const id = Math.floor(Number(args.product_id ?? 0));
    if (!id)
        return "Provide a numeric product id (see search_games).";
    const d = await getJson(`${PRODUCTS}/${id}?expand=description`);
    if (!d?.title)
        return `No GOG product with id ${id}.`;
    const lines = [`${d.title}${d.is_coming_soon ? " [coming soon]" : ""}`];
    const price = d.price?.finalAmount ? `$${d.price.finalAmount}${Number(d.price.discount) > 0 ? ` (was $${d.price.baseAmount}, ${d.price.discount}% off)` : ""}` : "";
    if (price)
        lines.push(price);
    const platforms = Object.entries(d.content_system_compatibility ?? {})
        .filter(([, v]) => v === true)
        .map(([k]) => PLATFORMS[k] ?? k);
    if (platforms.length)
        lines.push(`Platforms: ${platforms.join("/")}`);
    const devs = Array.isArray(d.developers) ? d.developers.map((x) => x?.name).filter(Boolean) : [];
    if (devs.length)
        lines.push(`Developer: ${devs.join(", ")}`);
    const genres = Array.isArray(d.genres) ? d.genres.map((g) => g?.name).filter(Boolean) : [];
    if (genres.length)
        lines.push(`Genres: ${genres.join(", ")}`);
    if (d.rating)
        lines.push(`ESRB: ${d.rating}`);
    if (d.release_date)
        lines.push(`Released: ${d.release_date}`);
    const lead = d.description?.lead ? String(d.description.lead) : "";
    const clean = lead.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (clean)
        lines.push("", clean);
    if (d.links?.purchase_link)
        lines.push("", `Buy: ${d.links.purchase_link}`);
    else if (d.purchase_link)
        lines.push("", `Buy: ${d.purchase_link}`);
    return lines.join("\n");
}
// ---- batch-4 tools: product-type browse and batch prices (2026-09-27) ----
const PRICES = "https://api.gog.com/products/prices";
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
/** Product kinds the catalog filter accepts. */
const PRODUCT_TYPES = {
    game: "game", games: "game",
    dlc: "dlc", addon: "dlc", addons: "dlc",
    pack: "pack", packs: "pack", bundle: "pack", bundles: "pack",
};
function priceRows(items) {
    const num = (s) => {
        const n = Number(String(s ?? "").replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) && n > 0 ? n : null;
    };
    return items.map((row) => {
        const price = row?._embedded?.prices?.[0];
        const base = num(price?.basePrice);
        const final = num(price?.finalPrice);
        const pct = base && final !== null && base > final ? Math.round((1 - final / base) * 1000) / 10 : 0;
        return {
            id: Number(row?._embedded?.product?.id ?? price?.product?.id ?? 0),
            base_usd: base,
            final_usd: final,
            discount_pct: final !== null ? pct : null,
        };
    });
}
export async function priceCheck(args) {
    const ids = String(args?.ids ?? "")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s))
        .slice(0, 20);
    if (!ids.length)
        return "Provide one or more numeric product ids, comma separated (search_games and games_by_ids return them).";
    const d = await getJson(`${PRICES}?ids=${ids.join(",")}&countryCode=US&currency=USD`);
    const rows = priceRows(d?._embedded?.items ?? []).filter((r) => r.id);
    if (!rows.length)
        return `No GOG prices for ids ${ids.join(", ")}.`;
    const missing = ids.filter((id) => !rows.some((r) => r.id === Number(id)));
    const onSale = rows.filter((r) => (r.discount_pct ?? 0) > 0);
    const priced = rows.map((r) => r.final_usd).filter((v) => v !== null);
    return [
        `GOG prices for ${rows.length} product(s), USD (${onSale.length} on sale):`,
        "",
        ...rows.map((r) => `  ${r.id}  $${(r.final_usd ?? 0).toFixed(2)}` +
            `${r.base_usd && r.final_usd !== null && r.base_usd > r.final_usd ? ` (was $${r.base_usd.toFixed(2)}, ${r.discount_pct}% off)` : ""}`),
        "",
        priced.length ? `Cheapest: $${Math.min(...priced).toFixed(2)} | most expensive: $${Math.max(...priced).toFixed(2)}` : "",
        missing.length ? `No price returned for: ${missing.join(", ")} - some ids are region-locked or retired.` : "",
        "Prices are US storefront asks in USD; game_details shows the same figures on the product page.",
    ].filter((line) => line !== "").join("\n");
}
export async function browseByType(args) {
    const raw = String(args?.product_type ?? "dlc").trim().toLowerCase();
    const type = PRODUCT_TYPES[raw];
    if (!type) {
        return `Unknown product type "${raw}". Use one of: ${[...new Set(Object.values(PRODUCT_TYPES))].join(", ")}.`;
    }
    const limit = clamp(args?.limit, 10, 20);
    const order = ORDERS[args?.order ?? "newest"] ?? ORDERS.newest;
    const d = await getJson(`${CATALOG}?limit=${limit}&productType=${type}&order=${order}&${LOCALE}`);
    const items = d.products ?? [];
    if (!items.length)
        return `No GOG ${type} products returned.`;
    return (`GOG ${type} listing (${(d.productCount ?? items.length).toLocaleString()} in catalog, ` +
        `${(d.pages ?? 1).toLocaleString()} page(s) of ${d.currentlyShownProductCount ?? limit}):\n\n` +
        items.map((p, i) => fmtProduct(p, i)).join("\n\n"));
}
// ---- muxG tools:
const STEAM_APP = "https://store.steampowered.com/api/appdetails";
const STEAM_SUGGEST = "https://store.steampowered.com/search/suggest";
const stripTags = (html) => String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
/** GOG's own news feed: what the store is currently telling customers about. */
export async function gogNews(args) {
    const n = clamp(args.limit ?? 10, 10, 30);
    const data = await getJson(`https://api.gog.com/news?limit=${n}&page=0`);
    const items = Array.isArray(data?.items) ? data.items : [];
    if (!items.length)
        throw new GogError("The GOG news feed returned no items.");
    const lines = [
        `GOG news: showing ${items.length} of the ${data.total_count ?? items.length} item(s) the feed reports`,
    ];
    for (const [i, item] of items.slice(0, n).entries()) {
        lines.push(`  ${i + 1}. ${stripTags(item.title) || "untitled post"} — ${String(item.publish_date ?? "date not reported").slice(0, 10)} · ${item.comments_count ?? "0"} comment(s)`);
        const body = stripTags(item.body);
        if (body)
            lines.push(`     ${body.slice(0, 260)}`);
        if (item.forum_thread_link)
            lines.push(`     thread: ${item.forum_thread_link}`);
    }
    return lines.join("\n");
}
async function steamSuggest(term) {
    const url = `${STEAM_SUGGEST}?term=${encodeURIComponent(term)}&f=games&cc=US&l=english`;
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(20000) });
    }
    catch (e) {
        throw new GogError(`Network error from the Steam suggestion endpoint: ${e.message}`);
    }
    if (!res.ok)
        throw new GogError(`Steam suggestion search returned ${res.status}`);
    const html = await res.text();
    const out = [];
    const blocks = html.split('<a class="match').slice(1);
    for (const block of blocks.slice(0, 5)) {
        const appid = (block.match(/data-ds-appid="(\d+)"/) ?? [])[1];
        const name = (block.match(/<div class="match_name">([\s\S]*?)<\/div>/) ?? [])[1];
        if (!appid)
            continue;
        out.push({
            appid,
            name: stripTags(name) || "name not reported",
            price: stripTags((block.match(/<div class="match_price">([\s\S]*?)<\/div>/) ?? [])[1]) || "price not reported",
        });
    }
    return out;
}
/**
 * Reception of the same game on the other big PC storefront. The GOG catalogue
 * publishes no review scores, so this answers a question the catalogue cannot.
 */
export async function steamReception(args) {
    const term = (args.game ?? "").trim();
    if (!term)
        throw new GogError("Provide a game name to look for, e.g. \"The Witcher 3\".");
    const wanted = clamp(args.limit ?? 1, 1, 3);
    const matches = await steamSuggest(term);
    if (!matches.length)
        throw new GogError(`The Steam suggestion search found no game called "${term}".`);
    const lines = [`"${term}" on Steam — ${matches.length} storefront match(es):`];
    for (const [i, match] of matches.slice(0, wanted).entries()) {
        let detail;
        try {
            const res = await fetch(`${STEAM_APP}?appids=${encodeURIComponent(match.appid)}&l=english&cc=US`, {
                headers: { "User-Agent": UA, Accept: "application/json" },
                signal: AbortSignal.timeout(20000),
            });
            if (res.ok) {
                const body = (await res.json());
                detail = body[match.appid]?.data;
            }
        }
        catch {
            detail = undefined;
        }
        if (!detail) {
            lines.push(`  ${i + 1}. ${match.name} (app ${match.appid}) — Steam published no detail record`);
            continue;
        }
        const platforms = Object.entries(detail.platforms ?? {})
            .filter(([, on]) => on)
            .map(([os]) => os)
            .join(", ");
        const genres = (detail.genres ?? []).map((g) => g.description ?? "?").join(", ");
        lines.push(`  ${i + 1}. ${detail.name ?? match.name} (app ${match.appid}${detail.required_age ? `, age ${detail.required_age}` : ""})`);
        lines.push(`     Metacritic ${detail.metacritic?.score ?? "not reported"} · ${detail.recommendations?.total?.toLocaleString() ?? "0"} Steam user recommendation(s)`);
        lines.push(`     ${detail.price_overview?.final_formatted ?? match.price}${detail.price_overview?.discount_percent ? ` (${detail.price_overview.discount_percent}% off)` : ""}`);
        lines.push(`     Released ${detail.release_date?.date ?? "not reported"}${detail.release_date?.coming_soon ? " (coming soon)" : ""} · platforms ${platforms || "not reported"}`);
        if (detail.developers?.length)
            lines.push(`     Developer ${detail.developers.join(", ")} · publisher ${(detail.publishers ?? []).join(", ") || "not reported"}`);
        if (genres)
            lines.push(`     Genres: ${genres}`);
        if (detail.short_description)
            lines.push(`     ${stripTags(detail.short_description).slice(0, 200)}`);
    }
    if (matches.length > wanted)
        lines.push(`  ...and ${matches.length - wanted} more storefront match(es); call again with a higher limit to see them.`);
    return lines.join("\n");
}
