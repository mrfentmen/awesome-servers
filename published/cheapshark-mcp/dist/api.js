const BASE = "https://www.cheapshark.com/api/1.0";
const UA = "mrfentmen-cheapshark-mcp/1.0 (https://github.com/mrfentmen)";
export class CheapsharkError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new CheapsharkError("CheapShark rate limit hit, wait and retry");
    if (!res.ok)
        throw new CheapsharkError(`CheapShark error ${res.status}`);
    return (await res.json());
}
// storeID -> storeName, so prices can be labelled with a real shop name.
let storeCache = null;
async function storeNames() {
    if (!storeCache) {
        const stores = await get(`${BASE}/stores`);
        storeCache = new Map(stores.map((s) => [String(s?.storeID ?? ""), String(s?.storeName ?? "?")]));
    }
    return storeCache;
}
const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : "?";
};
export async function deals(args) {
    const title = (args.title ?? "").trim();
    const limit = Math.min(args.limit ?? 8, 30);
    const maxPrice = Number.isFinite(args.maxPrice) ? args.maxPrice : 60;
    const store = (args.storeID ?? "").trim();
    const q = title ? `&title=${encodeURIComponent(title)}` : "";
    const s = store ? `&storeID=${encodeURIComponent(store)}` : "";
    const d = await get(`${BASE}/deals?pageSize=${limit}${q}${s}&upperPrice=${maxPrice}`);
    if (!Array.isArray(d) || !d.length)
        return "No deals found";
    const names = await storeNames();
    return d.map((x, i) => {
        const pct = x?.savings ? Math.round(Number(x.savings)) : 0;
        const shop = names.get(String(x?.storeID ?? "")) ?? `store ${x?.storeID ?? "?"}`;
        const meta = x?.metacriticScore && x.metacriticScore !== "0" ? ` | metacritic ${x.metacriticScore}` : "";
        return `${i + 1}. ${x?.title ?? "Untitled"}\n   ${money(x?.salePrice)} (was ${money(x?.normalPrice)}) | ${pct}% off | ${shop}${meta}\n   dealID ${x?.dealID ?? ""}${x?.gameID ? ` | gameID ${x.gameID}` : ""}`;
    }).join("\n\n");
}
export async function storeList(_args) {
    const d = await get(`${BASE}/stores`);
    if (!d.length)
        return "No stores";
    return d.map((s) => `${s?.storeID ?? "?"}. ${s?.storeName ?? "n/a"} (${s?.isActive === "1" ? "active" : "inactive"})`).join("\n");
}
export async function searchGames(args) {
    const title = (args.title ?? "").trim();
    if (!title)
        return "Provide a game title.";
    const limit = Math.min(args.limit ?? 8, 20);
    const d = await get(`${BASE}/games?title=${encodeURIComponent(title)}&limit=${limit}`);
    if (!Array.isArray(d) || !d.length)
        return `No games matching "${title}".`;
    return `Games matching "${title}":\n` + d.map((g, i) => `${i + 1}. ${g?.external ?? "?"} — cheapest ${money(g?.cheapest)} | gameID ${g?.gameID ?? "?"}`).join("\n");
}
export async function gameDetails(args) {
    const id = String(args.gameID ?? "").trim();
    if (!id)
        return "Provide a gameID (see search_games).";
    const d = await get(`${BASE}/games?id=${encodeURIComponent(id)}`);
    const info = d?.info ?? {};
    const dealsList = Array.isArray(d?.deals) ? d.deals : [];
    if (!info?.title && !dealsList.length)
        return `No game with gameID ${id}.`;
    const names = await storeNames();
    const lines = [`${info?.title ?? `game ${id}`} (gameID ${id})`];
    if (d?.cheapestPriceEver?.price) {
        lines.push(`Cheapest ever: ${money(d.cheapestPriceEver.price)} on ${new Date(Number(d.cheapestPriceEver.date) * 1000).toISOString().slice(0, 10)}`);
    }
    const rows = dealsList
        .map((x) => ({ shop: names.get(String(x?.storeID ?? "")) ?? `store ${x?.storeID}`, price: Number(x?.price ?? NaN), retail: Number(x?.retailPrice ?? NaN) }))
        .filter((r) => Number.isFinite(r.price))
        .sort((a, b) => a.price - b.price);
    if (!rows.length)
        lines.push("No store currently lists this game.");
    for (const r of rows)
        lines.push(`  ${money(r.price)}${Number.isFinite(r.retail) ? ` (retail ${money(r.retail)})` : ""} — ${r.shop}`);
    return lines.join("\n");
}
export async function topDeals(args) {
    const limit = Math.min(args.limit ?? 8, 25);
    const store = (args.storeID ?? "").trim();
    const s = store ? `&storeID=${encodeURIComponent(store)}` : "";
    const d = await get(`${BASE}/deals?sortBy=Deal%20Rating&pageSize=${limit}${s}`);
    if (!Array.isArray(d) || !d.length)
        return "No deals found";
    const names = await storeNames();
    return "Best deals right now (by deal rating):\n" + d.map((x, i) => {
        const pct = x?.savings ? Math.round(Number(x.savings)) : 0;
        return `${i + 1}. ${x?.title ?? "?"} — ${money(x?.salePrice)} (was ${money(x?.normalPrice)}), ${pct}% off at ${names.get(String(x?.storeID ?? "")) ?? "?"}`;
    }).join("\n");
}
export async function freeGames(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/deals?upperPrice=0&pageSize=${limit}`);
    if (!Array.isArray(d) || !d.length)
        return "No free games right now.";
    const names = await storeNames();
    return "Free games right now:\n" + d.map((x, i) => `${i + 1}. ${x?.title ?? "?"} — free at ${names.get(String(x?.storeID ?? "")) ?? "?"} (was ${money(x?.normalPrice)})`).join("\n");
}
// ---- batch-3 tools: Steam AppID lookup + filtered deals (2026-09-27) ----
export async function steamLookup(args) {
    const id = String(args.appID ?? "").trim();
    if (!/^\d{2,10}$/.test(id))
        throw new CheapsharkError("Provide a numeric Steam AppID, e.g. 1245620 for ELDEN RING");
    const limit = Math.min(args.limit ?? 5, 20);
    const d = await get(`${BASE}/games?steamAppID=${encodeURIComponent(id)}`);
    if (!Array.isArray(d) || !d.length) {
        return `CheapShark has no Steam-linked entry for AppID ${id}. Not every game is linked to its Steam AppID — try search_games with the title instead.`;
    }
    return `Steam AppID ${id} — ${d.length} CheapShark game(s):\n` + d.slice(0, limit).map((g, i) => `${i + 1}. ${g?.external ?? "?"} — cheapest ${money(g?.cheapest)} | gameID ${g?.gameID ?? "?"}`).join("\n");
}
const DEAL_SORTS = ["Deal Rating", "Price", "Savings", "Metacritic", "Reviews", "Release", "Recent"];
export async function filterDeals(args) {
    const limit = Math.min(args.limit ?? 10, 25);
    const params = new URLSearchParams();
    if (typeof args.minPrice === "number" && Number.isFinite(args.minPrice))
        params.set("lowerPrice", String(args.minPrice));
    if (typeof args.maxPrice === "number" && Number.isFinite(args.maxPrice))
        params.set("upperPrice", String(args.maxPrice));
    if (typeof args.metacritic === "number" && Number.isFinite(args.metacritic))
        params.set("metacritic", String(args.metacritic));
    if (typeof args.steamRating === "number" && Number.isFinite(args.steamRating))
        params.set("steamRating", String(args.steamRating));
    if (args.onSale === true)
        params.set("onSale", "1");
    if (args.aaa === true)
        params.set("AAA", "1");
    const sort = (args.sort ?? "").trim();
    if (sort) {
        const match = DEAL_SORTS.find((s) => s.toLowerCase() === sort.toLowerCase());
        if (!match)
            throw new CheapsharkError(`sort must be one of ${DEAL_SORTS.join(", ")}`);
        params.set("sortBy", match);
        params.set("desc", "0");
    }
    params.set("pageSize", String(limit));
    const d = await get(`${BASE}/deals?${params.toString()}`);
    if (!Array.isArray(d) || !d.length)
        return "No deals matched those filters.";
    const names = await storeNames();
    return `Filtered deals (${d.length} shown):\n` + d.map((x, i) => {
        const pct = x?.savings ? Math.round(Number(x.savings)) : 0;
        const meta = x?.metacriticScore && x.metacriticScore !== "0" ? ` | metacritic ${x.metacriticScore}` : "";
        const rating = x?.steamRatingText ? ` | Steam ${x.steamRatingText}` : "";
        return `${i + 1}. ${x?.title ?? "?"} — ${money(x?.salePrice)} (was ${money(x?.normalPrice)}), ${pct}% off at ${names.get(String(x?.storeID ?? "")) ?? "?"}${meta}${rating}`;
    }).join("\n");
}
/** CheapShark caps pageSize at 60 and its page parameter no longer changes the result, so every read here is one page. */
async function dealPage() {
    const d = await get(`${BASE}/deals?pageSize=60`);
    return Array.isArray(d) ? d : [];
}
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
};
function medianOf(values) {
    const a = [...values].sort((x, y) => x - y);
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
/** Bucket labels and the value each deal falls into. */
function bucketise(values, edges) {
    const out = edges.map((e, i) => ({
        label: i === edges.length - 1 ? `${e}+` : `${edges[i]}-${edges[i + 1] - 1}`,
        n: 0,
    }));
    for (const v of values) {
        let idx = out.length - 1;
        for (let i = 0; i < edges.length - 1; i += 1) {
            if (v.value < edges[i + 1]) {
                idx = i;
                break;
            }
        }
        out[idx].n += 1;
    }
    return out;
}
/** The cheapest and the best-value titles on the page, by absolute price and by discount. */
export async function valuePicks(args) {
    const top = Math.max(1, Math.min(Math.floor(Number(args.top ?? 8) || 8), 25));
    const rows = await dealPage();
    if (!rows.length)
        return "CheapShark returned no deals to pick from.";
    const names = await storeNames();
    const priced = rows.map((d) => ({ d, price: num(d.salePrice), normal: num(d.normalPrice), save: num(d.savings) }))
        .filter((x) => Number.isFinite(x.price));
    if (!priced.length)
        throw new CheapsharkError("No deal in this page carried a usable price.");
    const free = priced.filter((x) => x.price === 0);
    const paid = priced.filter((x) => x.price > 0);
    const perDollar = priced
        .filter((x) => Number.isFinite(x.save) && x.save > 0 && x.price > 0)
        .map((x) => ({ ...x, ratio: x.save / x.price }))
        .sort((a, b) => b.ratio - a.ratio);
    const label = (x) => names.get(String(x.d.storeID ?? "")) ?? "?";
    const lines = [
        `Value picks from ${rows.length} deal(s) in the current CheapShark page`,
        "",
        `Cheapest paid titles (${Math.min(top, paid.length)} of ${paid.length}):`,
    ];
    if (!paid.length)
        lines.push("  (every deal on this page is free)");
    for (const x of paid.slice(0, top)) {
        lines.push(`  ${money(x.price)} — ${x.d.title ?? "?"}${Number.isFinite(x.save) ? ` (${x.save.toFixed(0)}% off, was ${money(x.normal)})` : ""} | ${label(x)}`);
    }
    lines.push("", `Most discount per dollar spent (${Math.min(top, perDollar.length)} of ${perDollar.length}):`);
    if (!perDollar.length)
        lines.push("  (no deal reports a discount with a paid price)");
    for (const x of perDollar.slice(0, top)) {
        lines.push(`  ${x.ratio.toFixed(2)}x — ${money(x.price)} giving ${x.save.toFixed(0)}% off, was ${money(x.normal)} | ${x.d.title ?? "?"} | ${label(x)}`);
    }
    lines.push("", `Free titles with a real retail price (${free.length}):`);
    if (!free.length)
        lines.push("  (none on this page)");
    for (const x of free.slice(0, top)) {
        lines.push(`  ${money(x.price)} vs ${money(x.normal)} retail — ${x.d.title ?? "?"} | ${label(x)}`);
    }
    return lines.join("\n");
}
// ---- muxF tools:
const prettyJson = (obj) => {
    const t = JSON.stringify(obj, null, 2);
    return t.length > 12000 ? `${t.slice(0, 12000)}\n…(truncated)` : t;
};
const DISC_EDGES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
const PRICE_EDGES = [0, 5, 10, 20, 40, 60, 120];
/** Shape of the current deal page: what is on sale, how deep, and how good the games are. */
export async function dealMarketScan(_args) {
    const rows = await dealPage();
    if (!rows.length)
        throw new CheapsharkError("CheapShark returned no deals to scan.");
    const priced = rows
        .map((d) => ({ d, sale: num(d.salePrice), normal: num(d.normalPrice), save: num(d.savings), meta: num(d.metacriticScore), steam: num(d.steamRatingPercent) }))
        .filter((x) => Number.isFinite(x.sale));
    if (!priced.length)
        throw new CheapsharkError("No deal on this page carried a usable price.");
    const names = await storeNames();
    const discounts = priced.filter((x) => Number.isFinite(x.save)).map((x) => ({ value: x.save }));
    const salePrices = priced.map((x) => ({ value: x.sale }));
    const onSale = priced.filter((x) => x.sale < x.normal);
    const free = priced.filter((x) => x.sale === 0);
    const rated = priced.filter((x) => Number.isFinite(x.meta) && x.meta > 0);
    const steamRated = priced.filter((x) => Number.isFinite(x.steam) && x.steam > 0);
    const biggest = priced
        .filter((x) => Number.isFinite(x.normal) && x.normal > x.sale)
        .map((x) => ({ ...x, off: x.normal - x.sale }))
        .sort((a, b) => b.off - a.off)
        .slice(0, 5)
        .map((x) => ({
        title: x.d.title ?? null,
        store: names.get(String(x.d.storeID ?? "")) ?? null,
        sale_usd: Math.round(x.sale * 100) / 100,
        was_usd: Math.round(x.normal * 100) / 100,
        off_usd: Math.round(x.off * 100) / 100,
        off_pct: Number.isFinite(x.save) ? x.save : null,
    }));
    const steamBands = {};
    for (const x of steamRated) {
        const band = x.steam >= 95 ? "95-100" : x.steam >= 90 ? "90-94" : x.steam >= 80 ? "80-89" : x.steam >= 70 ? "70-79" : "below 70";
        steamBands[band] = (steamBands[band] ?? 0) + 1;
    }
    return prettyJson({
        deals_on_page: rows.length,
        priced_deals: priced.length,
        actually_discounted: onSale.length,
        discounted_pct: Math.round((onSale.length / priced.length) * 1000) / 10,
        free_titles: free.length,
        discount_buckets_pct: bucketise(discounts, DISC_EDGES),
        sale_price_bands_usd: bucketise(salePrices, PRICE_EDGES),
        reviewed_by_metacritic: rated.length,
        median_metacritic: rated.length ? Math.round(medianOf(rated.map((x) => x.meta))) : null,
        metacritic_80_plus: rated.filter((x) => x.meta >= 80).length,
        steam_rated: steamRated.length,
        median_steam_positive_pct: steamRated.length ? Math.round(medianOf(steamRated.map((x) => x.steam))) : null,
        steam_rating_bands: steamBands,
        biggest_absolute_discounts: biggest,
        note: "CheapShark serves one page of up to 60 deals; the page is a rotating sample, not the whole catalogue.",
    });
}
/** Which shops discount hardest on the current page. */
export async function storeLeaderboard(args) {
    const top = Math.max(1, Math.min(Math.trunc(Number(args.top ?? 12)) || 12, 35));
    const rows = await dealPage();
    if (!rows.length)
        throw new CheapsharkError("CheapShark returned no deals to rank.");
    const names = await storeNames();
    const groups = new Map();
    for (const d of rows) {
        const id = String(d.storeID ?? "");
        if (!groups.has(id))
            groups.set(id, []);
        groups.get(id).push(d);
    }
    const table = [...groups.entries()].map(([id, list]) => {
        const sales = list.map((d) => num(d.salePrice)).filter(Number.isFinite);
        const saves = list.map((d) => num(d.savings)).filter(Number.isFinite);
        const steams = list.map((d) => num(d.steamRatingPercent)).filter((n) => Number.isFinite(n) && n > 0);
        return {
            store: names.get(id) ?? `store ${id}`,
            store_id: id,
            deals: list.length,
            free_titles: sales.filter((p) => p === 0).length,
            median_discount_pct: saves.length ? Math.round(medianOf(saves) * 10) / 10 : null,
            median_sale_usd: sales.length ? Math.round(medianOf(sales) * 100) / 100 : null,
            median_steam_positive_pct: steams.length ? Math.round(medianOf(steams)) : null,
        };
    });
    table.sort((a, b) => (b.median_discount_pct ?? -1) - (a.median_discount_pct ?? -1) || b.deals - a.deals);
    return prettyJson({
        deals_on_page: rows.length,
        stores_on_page: table.length,
        returned: Math.min(table.length, top),
        stores: table.slice(0, top),
        note: "Ranked by median discount across this page only; a store with one deep cut can outrank a store with many small ones.",
    });
}
