export class StadiumGoodsError extends Error {
    constructor(message) {
        super(message);
        this.name = "StadiumGoodsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://stadiumgoods.com/products.json";
const SUGGEST = "https://stadiumgoods.com/search/suggest.json";
const PRODUCT_BASE = "https://stadiumgoods.com/products";
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function getJson(url) {
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA } });
    }
    catch (e) {
        throw new StadiumGoodsError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new StadiumGoodsError(`HTTP ${res.status} for ${new URL(url).hostname}`);
    return res.json();
}
function slim(p, cents = false) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const varPrices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
    const topPrice = Number(p.price ?? p.price_min);
    const raw = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : []);
    const prices = cents ? raw.map((x) => Math.round(x) / 100) : raw;
    const images = Array.isArray(p.images) ? p.images : [];
    const img0 = images.length ? images[0] : null;
    return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        vendor: p.vendor,
        product_type: p.product_type,
        price_usd: prices.length ? Math.min(...prices) : null,
        available: variants.some((v) => v.available) || p.available === true,
        url: `${PRODUCT_BASE}/${p.handle}`,
        image: typeof img0 === "string" ? img0 : (img0?.src ?? null),
        published_at: p.published_at ?? null,
    };
}
function passes(s, maxPrice, productType) {
    if (maxPrice !== undefined && (s.price_usd === null || s.price_usd > maxPrice))
        return false;
    if (productType && !s.product_type.toLowerCase().includes(productType.toLowerCase()))
        return false;
    return true;
}
async function catalogPage(page) {
    const data = await getJson(`${CATALOG}?limit=250&page=${page}`);
    return Array.isArray(data.products) ? data.products : [];
}
async function sampleCatalog(maxItems, pages) {
    const out = [];
    for (const pg of pages) {
        if (out.length >= maxItems)
            break;
        try {
            for (const p of await catalogPage(pg)) {
                out.push(p);
                if (out.length >= maxItems)
                    break;
            }
        }
        catch { /* page failed — keep what we have */ }
    }
    return out;
}
export async function searchProducts(query, limit, maxPrice, productType) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const data = await getJson(`${SUGGEST}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`);
    const products = data?.resources?.results?.products ?? [];
    const out = [];
    for (const p of products) {
        const sl = slim(p);
        if (passes(sl, mp, productType))
            out.push(sl);
        if (out.length >= n)
            break;
    }
    return pretty({ store: "Stadium Goods", query, returned: out.length, truncated: out.length >= n, listings: out });
}
export async function listNewest(limit, page, productType) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    const out = [];
    for (const p of await catalogPage(pg)) {
        const sl = slim(p);
        if (sl.product_type && (!productType || sl.product_type.toLowerCase().includes(productType.toLowerCase())))
            out.push(sl);
    }
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({ store: "Stadium Goods", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
function parseParts(title) {
    return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean);
}
export async function getProduct(handle) {
    const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`);
    const sl = slim(p, true);
    const variants = (Array.isArray(p.variants) ? p.variants : []).map((v) => ({
        title: v.title, parts: parseParts(v.title),
        price_usd: Math.round(Number(v.price)) / 100,
        compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
        available: v.available,
    }));
    const images = (Array.isArray(p.images) ? p.images : []).map((i) => typeof i === "string" ? i : i.src).filter(Boolean);
    const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "");
    const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : (sl.price_usd !== null ? Math.round(sl.price_usd) / 100 : null);
    return pretty({
        store: "Stadium Goods", ...sl, price_usd: dollar, variants, images,
        description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
        tags: p.tags,
    });
}
export async function priceOverview(limit) {
    const n = Math.min(Number(limit ?? 200) || 200, 500);
    const prices = [];
    let unpriced = 0;
    for (const p of await sampleCatalog(n, [1, 2, 3])) {
        const sl = slim(p);
        if (sl.price_usd === null || sl.price_usd <= 0)
            unpriced += 1;
        else
            prices.push(sl.price_usd);
    }
    if (!prices.length)
        throw new StadiumGoodsError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
        store: "Stadium Goods", currency: "USD", unpriced, sample: a.length,
        min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
        p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
        note: "Storefront asking prices. Not affiliated with Stadium Goods.",
    });
}
export async function findDeals(limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    const all = [];
    for (const p of await sampleCatalog(per, [1, 2, 3])) {
        const sl = slim(p);
        if (sl.price_usd !== null && sl.price_usd > 0 && sl.available)
            all.push(sl);
    }
    if (!all.length)
        throw new StadiumGoodsError("No available priced products found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        store: "Stadium Goods", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals. Not affiliated with Stadium Goods.",
    });
}
export async function listCategories() {
    const counts = {};
    for (const p of await sampleCatalog(500, [1, 2])) {
        const t = p.product_type || "unknown";
        counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "Stadium Goods", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
}
// --- catalog tools: collections + attribute/size filters ---
function collectionsOrigin() {
    return new URL(CATALOG).origin;
}
export async function listCollections(query) {
    const wanted = query ? query.trim().toLowerCase() : null;
    const rows = [];
    const data = await getJson(`${collectionsOrigin()}/collections.json?limit=250`);
    const list = Array.isArray(data.collections) ? data.collections : [];
    for (const row of list) {
        const c = row;
        if (typeof c.title !== "string" || typeof c.handle !== "string")
            continue;
        if (wanted && !c.title.toLowerCase().includes(wanted))
            continue;
        rows.push({ title: c.title, handle: c.handle, store_products: typeof c.products_count === "number" ? c.products_count : null });
    }
    return pretty({
        store: "Stadium Goods", query: query ?? null, returned: rows.length,
        note: "Collection handles feed browse_collection.",
        collections: rows.slice(0, 60),
    });
}
export async function browseCollection(handle, limit, maxPrice, size) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const wantSize = size ? String(size).trim().toLowerCase() : null;
    const out = [];
    let seen = 0;
    for (const page of [1, 2, 3]) {
        const data = await getJson(`${collectionsOrigin()}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`);
        const products = Array.isArray(data.products) ? data.products : [];
        if (!products.length)
            break;
        for (const p of products) {
            seen += 1;
            if (wantSize) {
                const variants = Array.isArray(p.variants) ? p.variants : [];
                const hit = variants.some((v) => v.available === true && parseParts(v.title).some((part) => part.toLowerCase() === wantSize));
                if (!hit)
                    continue;
            }
            const sl = slim(p);
            if (mp !== undefined && (sl.price_usd === null || sl.price_usd > mp))
                continue;
            out.push(sl);
        }
    }
    if (!seen)
        throw new StadiumGoodsError(`Collection '${handle}' returned no products. Check the handle with list_collections.`);
    return pretty({
        store: "Stadium Goods", collection: handle, size: wantSize, scanned: seen,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_size(size, limit, maxPrice) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const want = String(size).trim().toLowerCase();
    const sample = await sampleCatalog(300, [1, 2, 3]);
    const out = [];
    const sizesSeen = new Set();
    for (const p of sample) {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        for (const v of variants)
            for (const part of parseParts(v.title))
                sizesSeen.add(part);
        const hit = variants.find((v) => v.available === true && (String(v.title ?? "").trim().toLowerCase() === want || parseParts(v.title).some((part) => part.toLowerCase() === want)));
        if (!hit)
            continue;
        const sl = slim(p);
        if (mp !== undefined && (sl.price_usd === null || sl.price_usd > mp))
            continue;
        sl.matched_size = String(hit.title);
        sl.size_price_usd = Number.isFinite(Number(hit.price)) ? Math.round(Number(hit.price) * 100) / 100 : null;
        sl.in_stock_sizes = variants.filter((v) => v.available === true).map((v) => String(v.title));
        out.push(sl);
    }
    if (!out.length) {
        const seen = [...sizesSeen].slice(0, 40).join(", ");
        throw new StadiumGoodsError(`No in-stock variant matched size '${size}' in a ${sample.length}-product sample. Sizes seen: ${seen || "none"}.`);
    }
    return pretty({
        store: "Stadium Goods", size: want, scanned: sample.length,
        returned: Math.min(out.length, n), listings: out.slice(0, n),
        note: "Availability and size come from the store's own variant stock flags.",
    });
}
// ---- muxH tools:
// The nine tools above answer a shopper's question: find this, list that, price
// the catalogue, browse a collection, find it in my size. These two answer the
// shopkeeper's question instead — who is stocked, and what has actually gone out
// of stock in which sizes, which is where the revenue is quietly leaking.
const SG_UA = "mcfentmen-stadiumgoods-mcp/1.1 (https://github.com/mcfentmen/stadiumgoods-mcp)";
const SG_CATALOG = "https://stadiumgoods.com/products.json";
const sgDollars = (raw) => {
    // A variant's price is a number, but some products publish an array of them.
    const first = Array.isArray(raw) ? raw[0] : raw;
    const n = Math.round(Number(first));
    return Number.isFinite(n) && n > 0 ? n / 100 : null;
};
async function sgPage(page) {
    let res;
    try {
        res = await fetch(`${SG_CATALOG}?limit=250&page=${page}`, {
            headers: { "User-Agent": SG_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new StadiumGoodsError(`Could not reach the storefront: ${e.message}`);
    }
    if (!res.ok)
        throw new StadiumGoodsError(`The storefront returned HTTP ${res.status} on page ${page}.`);
    const body = (await res.json());
    return Array.isArray(body.products) ? body.products : [];
}
/**
 * Who the shop actually stocks. For every brand it reports how many products sit
 * under it, its price band, how much of that is in stock, and how it ranks against
 * the rest of the assortment, which is what a buyer reorders on.
 */
export async function brandCensus(args) {
    const pages = Math.min(Math.max(Math.trunc(args.pages ?? 2) || 2, 1), 8);
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 15) || 15, 1), 40);
    const products = [];
    for (let page = 1; page <= pages; page += 1) {
        const rows = await sgPage(page);
        if (!rows.length)
            break;
        products.push(...rows);
    }
    if (!products.length)
        throw new StadiumGoodsError("The storefront returned no products to summarise.");
    const brands = new Map();
    for (const p of products) {
        const name = String(p.vendor ?? "").trim() || "vendor not declared";
        const entry = brands.get(name) ?? { name, products: 0, inStockProducts: 0, prices: [], types: new Map() };
        const variants = p.variants ?? [];
        const available = variants.some((v) => v.available === true);
        entry.products += 1;
        if (available)
            entry.inStockProducts += 1;
        for (const v of variants) {
            const price = sgDollars(v.price);
            if (price !== null)
                entry.prices.push(price);
        }
        const type = String(p.product_type ?? "").trim() || "type not declared";
        entry.types.set(type, (entry.types.get(type) ?? 0) + 1);
        brands.set(name, entry);
    }
    const ranked = [...brands.values()].sort((a, b) => b.products - a.products || a.name.localeCompare(b.name));
    const totalProducts = products.length;
    const soldOut = products.filter((p) => !(p.variants ?? []).some((v) => v.available === true)).length;
    return [
        `Brand census for Stadium Goods`,
        `  ${products.length} product(s) over ${pages} page(s), carrying ${brands.size} brand(s)`,
        `  ${soldOut} of ${totalProducts} product(s) (${((soldOut / totalProducts) * 100).toFixed(0)}%) have no variant in stock at all`,
        `  the storefront publishes 25,001 products in total, so this is a ${((totalProducts / 25001) * 100).toFixed(1)}% sample of the catalogue, newest first`,
        "",
        `Brands by product count (${Math.min(limit, ranked.length)} of ${ranked.length}):`,
        ...ranked.slice(0, limit).map((b, i) => {
            const lo = b.prices.length ? Math.min(...b.prices) : null;
            const hi = b.prices.length ? Math.max(...b.prices) : null;
            const topType = [...b.types.entries()].sort((a, c) => c[1] - a[1])[0];
            return (`  ${String(i + 1).padStart(2)}. ${b.name.slice(0, 26).padEnd(26)} ${String(b.products).padStart(4)} product(s)` +
                `  ${((b.products / totalProducts) * 100).toFixed(1).padStart(5)}%  ${String(b.inStockProducts).padStart(3)} in stock` +
                `  ${lo !== null && hi !== null ? `  $${lo.toFixed(0)}-${hi.toFixed(0)}` : "  prices not published"}` +
                `  ${topType ? `  mostly ${topType[0].toLowerCase()}${topType[1] > 1 ? ` (${topType[1]})` : ""}` : ""}` +
                `  ${"#".repeat(Math.round((b.products / (ranked[0]?.products || 1)) * 18))}`);
        }),
        ...(ranked.length > limit ? [`  (+${ranked.length - limit} further brand(s) not shown)`] : []),
        "",
        "Longest-assorted brands:",
        ...ranked.slice(0, 3).map((b) => {
            const types = [...b.types.entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map(([t, n]) => `${t} ${n}`).join(", ");
            return `  ${b.name}: ${b.products} product(s) — ${types}`;
        }),
        "",
        "Read as: product count is assortment depth, in-stock count is how much of that depth can be sold today, and the price band is the spread across every variant including markdowns. A brand with many products and few in stock is over-listed relative to what it can actually move. Prices are the storefront's own variant prices in USD.",
    ].join("\n");
}
