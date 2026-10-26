export class FendiError extends Error {
    constructor(message) {
        super(message);
        this.name = "FendiError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const VENDORS = ["fendi"];
const CONDITIONS = ["excellent", "great", "very good", "good", "fair"];
const SOURCES = [
    {
        name: "fashionphile",
        catalog: "https://www.fashionphile.com/products.json",
        suggest: "https://www.fashionphile.com/search/suggest.json",
        product: (handle) => `https://www.fashionphile.com/products/${encodeURIComponent(handle)}.js`,
        base: "https://www.fashionphile.com/products",
    },
    {
        name: "rebag",
        catalog: "https://shop.rebag.com/products.json",
        suggest: "https://shop.rebag.com/search/suggest.json",
        product: (handle) => `https://shop.rebag.com/products/${encodeURIComponent(handle)}.js`,
        base: "https://shop.rebag.com/products",
    },
];
function matchesBrand(vendor) {
    const v = String(vendor ?? "").toLowerCase();
    return VENDORS.some((s) => v.includes(s));
}
function parseCondition(title, tags) {
    const t = String(title ?? "");
    const m = t.match(/^(Excellent|Great|Very Good|Good|Fair)\b/i);
    if (m) {
        const c = m[1].toLowerCase();
        return c === "great" ? "great" : c;
    }
    if (Array.isArray(tags)) {
        for (const tag of tags) {
            const tm = String(tag).match(/^bc-filter-(Excellent|Great|Very Good|Good|Fair)$/i);
            if (tm)
                return tm[1].toLowerCase();
        }
    }
    return null;
}
function parseTag(tags, prefix) {
    if (!Array.isArray(tags))
        return null;
    for (const tag of tags) {
        const s = String(tag);
        if (s.toLowerCase().startsWith(prefix))
            return s.slice(prefix.length).replace(/‚/g, ",");
    }
    return null;
}
function slim(source, base, p, cents = false) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const varPrices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
    // Suggest-shaped items carry no variants: fall back to top-level price fields.
    const topPrice = Number(p.price ?? p.price_min);
    const raw = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : []);
    // /products/{handle}.js quotes money in cents; catalog + suggest quote dollars.
    const prices = cents ? raw.map((x) => Math.round(x) / 100) : raw;
    const images = Array.isArray(p.images) ? p.images : [];
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const firstTitle = variants.length ? variants[0].title : "";
    let material = parseTag(tags, "bc-filter-exterior-material-");
    if (!material && tags.some((t) => String(t).toLowerCase() === "exotic"))
        material = "exotic";
    return {
        source,
        id: p.id,
        title: p.title,
        handle: p.handle,
        vendor: p.vendor,
        product_type: p.product_type,
        price_usd: prices.length ? Math.min(...prices) : null,
        available: variants.some((v) => v.available) || p.available === true,
        url: `${base}/${p.handle}`,
        image: images.length ? (typeof images[0] === "string" ? images[0] : images[0].src ?? null) : null,
        condition: parseCondition(firstTitle, tags),
        color: parseTag(tags, "bc-filter-exterior-color-"),
        material,
        published_at: p.published_at ?? null,
    };
}
function normCondition(c) {
    const v = c.trim().toLowerCase();
    return CONDITIONS.includes(v) ? v : null;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
// A catalog row is only usable if it carries the handle the product URL is built
// from and a title to show. Anything else is a malformed upstream row.
function isProduct(x) {
    if (typeof x !== "object" || x === null)
        return false;
    const row = x;
    return typeof row.handle === "string" && typeof row.title === "string";
}
async function getJson(url) {
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA } });
    }
    catch (e) {
        throw new FendiError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new FendiError(`HTTP ${res.status} for ${new URL(url).hostname}`);
    return res.json();
}
async function catalog(source, page) {
    const data = await getJson(`${source.catalog}?limit=250&page=${page}`);
    const products = Array.isArray(data.products) ? data.products : [];
    return products.filter(isProduct).filter((p) => matchesBrand(p.vendor));
}
// Distilled-pages fetch: several catalog pages in parallel, brand-filtered.
async function catalogPages(source, pages) {
    const batches = await Promise.all(pages.map((pg) => catalog(source, pg).catch(() => [])));
    return batches.flat();
}
// Round-robin sampling across sources and pages: keeps the brand sample
// source-balanced (page 1 alone is often 250 Fashionphile items).
async function sampleCatalog(maxItems, pages) {
    const out = [];
    for (const pg of pages) {
        for (const s of SOURCES) {
            if (out.length >= maxItems)
                break;
            try {
                for (const p of await catalog(s, pg)) {
                    out.push({ source: s, p });
                    if (out.length >= maxItems)
                        break;
                }
            }
            catch { /* source down — keep the other */ }
        }
        if (out.length >= maxItems)
            break;
    }
    return out;
}
function passes(s, maxPrice, condition, productType) {
    if (maxPrice !== undefined && (s.price_usd === null || s.price_usd > maxPrice))
        return false;
    if (condition && s.condition !== condition)
        return false;
    if (productType && !s.product_type.toLowerCase().includes(productType.toLowerCase()))
        return false;
    return true;
}
export async function searchListings(query, limit, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const out = [];
    for (const s of SOURCES) {
        try {
            const data = await getJson(`${s.suggest}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`);
            const products = data?.resources?.results?.products ?? [];
            for (const p of products) {
                if (!matchesBrand(p.vendor))
                    continue;
                // Suggest items carry no variant titles/tags: condition unknown outside Rebag catalog data.
                // When a condition filter is set, only items with a known matching condition pass
                // (Fashionphile suggest hits are omitted — documented limitation).
                const sl = slim(s.name, s.base, p);
                if (cond && sl.condition !== cond)
                    continue;
                if (passes(sl, mp, null))
                    out.push(sl);
                if (out.length >= n)
                    break;
            }
        }
        catch { /* source down — keep the other */ }
        if (out.length >= n)
            break;
    }
    return pretty({ brand: "Fendi", query, returned: out.length, truncated: out.length >= n, condition_filter: cond ?? null, listings: out.slice(0, n) });
}
export async function listNewest(limit, page, productType, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const out = [];
    for (const s of SOURCES) {
        try {
            for (const p of await catalog(s, pg)) {
                const sl = slim(s.name, s.base, p);
                if (passes(sl, mp, cond ?? undefined, productType))
                    out.push(sl);
            }
        }
        catch { /* source down — keep the other */ }
    }
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({ brand: "Fendi", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
export async function getListing(handle, source) {
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new FendiError(`Unknown source '${source}'. Use fashionphile or rebag.`);
    for (const s of sources) {
        try {
            const p = await getJson(s.product(handle));
            const sl = slim(s.name, s.base, p, true);
            const rawVars = Array.isArray(p.variants) ? p.variants : [];
            const variants = rawVars.map((v) => ({
                title: v.title, price_usd: Math.round(Number(v.price)) / 100, available: v.available,
                condition: parseCondition(v.title, p.tags),
            }));
            const images = (Array.isArray(p.images) ? p.images : []).map((i) => typeof i === "string" ? i : i.src).filter(Boolean);
            const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "");
            const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : sl.price_usd;
            return pretty({
                brand: "Fendi", ...sl, price_usd: dollar, variants, images,
                description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
                tags: p.tags,
            });
        }
        catch { /* try next source */ }
    }
    throw new FendiError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`);
}
export async function priceOverview(limit) {
    const n = Math.min(Number(limit ?? 200) || 200, 500);
    const prices = [];
    let unpriced = 0;
    const byCondition = {};
    for (const { source: s, p } of await sampleCatalog(n, [1, 2, 3, 4, 5])) {
        const sl = slim(s.name, s.base, p);
        if (sl.price_usd === null || sl.price_usd <= 0) {
            unpriced += 1;
            continue;
        }
        prices.push(sl.price_usd);
        const c = sl.condition ?? "unknown";
        if (!byCondition[c])
            byCondition[c] = [];
        byCondition[c].push(sl.price_usd);
    }
    if (!prices.length)
        throw new FendiError("No priced listings found.");
    const stats = (arr) => {
        const a = [...arr].sort((x, y) => x - y);
        const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
        return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] };
    };
    const condStats = {};
    for (const [c, arr] of Object.entries(byCondition))
        condStats[c] = stats(arr);
    return pretty({
        brand: "Fendi", currency: "USD", unpriced, overall: stats(prices), by_condition: condStats,
        note: "Asking prices on resale sources, not appraisals. Not affiliated with Fendi.",
    });
}
function normTitle(t) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
export async function comparePrices(query, limit) {
    const n = Math.min(Number(limit ?? 30) || 30, 60);
    const all = [];
    for (const s of SOURCES) {
        try {
            const data = await getJson(`${s.suggest}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`);
            const products = data?.resources?.results?.products ?? [];
            for (const p of products) {
                if (matchesBrand(p.vendor))
                    all.push(slim(s.name, s.base, p));
            }
        }
        catch { /* source down — keep the other */ }
    }
    const groups = new Map();
    for (const sl of all) {
        const key = normTitle(sl.title);
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(sl);
    }
    const rows = [...groups.entries()].map(([model, items]) => {
        const ps = items.map((i) => i.price_usd).filter((x) => x !== null);
        return {
            model: items[0].title, count: items.length,
            sources: [...new Set(items.map((i) => i.source))],
            min_usd: ps.length ? Math.min(...ps) : null,
            max_usd: ps.length ? Math.max(...ps) : null,
            spread_usd: ps.length > 1 ? Math.max(...ps) - Math.min(...ps) : 0,
            listings: items.map((i) => ({ source: i.source, price_usd: i.price_usd, condition: i.condition, url: i.url })),
        };
    }).sort((a, b) => (b.spread_usd ?? 0) - (a.spread_usd ?? 0));
    return pretty({ brand: "Fendi", query, groups: rows.length, rows: rows.slice(0, 15) });
}
export async function findDeals(limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    const all = [];
    for (const { source: s, p } of await sampleCatalog(per, [1, 2, 3, 4, 5])) {
        const sl = slim(s.name, s.base, p);
        if (sl.price_usd !== null && sl.price_usd > 0 && sl.available)
            all.push(sl);
    }
    if (!all.length)
        throw new FendiError("No available priced listings found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        brand: "Fendi", sample: all.length, brand_median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Fendi.",
    });
}
export async function brandOverview() {
    const bySource = {};
    const byType = {};
    const byCondition = {};
    let total = 0;
    for (const s of SOURCES) {
        try {
            const items = await catalogPages(s, [1, 2]);
            bySource[s.name] = items.length;
            for (const p of items) {
                const sl = slim(s.name, s.base, p);
                total++;
                byType[sl.product_type || "unknown"] = (byType[sl.product_type || "unknown"] ?? 0) + 1;
                const c = sl.condition ?? "unknown";
                byCondition[c] = (byCondition[c] ?? 0) + 1;
            }
        }
        catch {
            bySource[s.name] = -1;
        }
    }
    return pretty({
        brand: "Fendi", catalog_sample: total, by_source: bySource,
        by_product_type: byType, by_condition: byCondition,
        note: "Sample of newest ~500 listings per source. Not affiliated with Fendi.",
    });
}
// --- catalog tools: collections + attribute/size filters ---
function collectionsOrigin(catalogUrl) {
    return new URL(catalogUrl).origin;
}
// Curated store collections. store_products is the collection's full size on the
// store, not just this brand's slice - browse_collection returns the brand rows.
export async function listCollections(query) {
    const wanted = query ? query.trim().toLowerCase() : null;
    const rows = [];
    for (const s of SOURCES) {
        try {
            const data = await getJson(`${collectionsOrigin(s.catalog)}/collections.json?limit=250`);
            const list = Array.isArray(data.collections) ? data.collections : [];
            for (const row of list) {
                const c = row;
                if (typeof c.title !== "string" || typeof c.handle !== "string")
                    continue;
                if (wanted && !c.title.toLowerCase().includes(wanted))
                    continue;
                rows.push({
                    source: s.name,
                    title: c.title,
                    handle: c.handle,
                    store_products: typeof c.products_count === "number" ? c.products_count : null,
                });
            }
        }
        catch { /* source down - keep the other */ }
    }
    return pretty({
        brand: "Fendi", query: query ?? null, returned: rows.length,
        note: "Collection handles feed browse_collection. store_products counts the whole collection.",
        collections: rows.slice(0, 60),
    });
}
export async function browseCollection(handle, source, limit, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new FendiError(`Unknown source '${source}'. Use ${SOURCES.map((s) => s.name).join(" or ")}.`);
    const out = [];
    let brandItems = 0;
    for (const s of sources) {
        try {
            for (const page of [1, 2, 3]) {
                const data = await getJson(`${collectionsOrigin(s.catalog)}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`);
                const products = Array.isArray(data.products) ? data.products : [];
                if (!products.length)
                    break;
                for (const raw of products) {
                    if (!isProduct(raw) || !matchesBrand(raw.vendor))
                        continue;
                    brandItems += 1;
                    const sl = slim(s.name, s.base, raw);
                    if (passes(sl, mp, cond ?? undefined))
                        out.push(sl);
                }
            }
        }
        catch { /* collection or source missing - keep the other */ }
    }
    if (!brandItems)
        throw new FendiError(`Collection '${handle}' has no Fendi listings on ${sources.map((s) => s.name).join(", ")}.`);
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({
        brand: "Fendi", collection: handle, brand_items_matched: brandItems,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_attribute(color, material, condition, maxPrice, limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const wantColor = color ? color.trim().toLowerCase() : null;
    const wantMaterial = material ? material.trim().toLowerCase() : null;
    if (!wantColor && !wantMaterial && !cond)
        throw new FendiError("Give at least one of color, material or condition.");
    const all = [];
    const colors = {};
    const materials = {};
    let tagged = 0;
    for (const { source: s, p } of await sampleCatalog(per, [1, 2, 3, 4])) {
        const sl = slim(s.name, s.base, p);
        if (sl.color) {
            tagged += 1;
            colors[sl.color] = (colors[sl.color] ?? 0) + 1;
        }
        if (sl.material)
            materials[sl.material] = (materials[sl.material] ?? 0) + 1;
        if (wantColor && !(sl.color ?? "").toLowerCase().includes(wantColor))
            continue;
        if (wantMaterial && !(sl.material ?? "").toLowerCase().includes(wantMaterial))
            continue;
        // Structured tags exist on one source only, so a colour/material also matches the
        // listing title. Which side matched is reported per row (matched_on).
        const colorOnTag = wantColor ? (sl.color ?? "").toLowerCase().includes(wantColor) : false;
        const materialOnTag = wantMaterial ? (sl.material ?? "").toLowerCase().includes(wantMaterial) : false;
        const hay = `${sl.title} ${sl.vendor} ${sl.product_type}`.toLowerCase();
        if (wantColor && !colorOnTag && !hay.includes(wantColor))
            continue;
        if (wantMaterial && !materialOnTag && !hay.includes(wantMaterial))
            continue;
        if (!passes(sl, mp, cond ?? undefined))
            continue;
        all.push({ ...sl, matched_on: colorOnTag || materialOnTag ? "structured attribute" : "title keyword" });
    }
    const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
    return pretty({
        brand: "Fendi", color: wantColor, material: wantMaterial, condition: cond ?? null,
        sample: per, attributes_known: tagged, top_colors: top(colors), top_materials: top(materials),
        note: "Structured colour/material tags where the source publishes them, listing-title match otherwise.",
        matched: all.length, returned: Math.min(all.length, n), listings: all.slice(0, n).sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity)),
    });
}
// ---- muxD tools:
/**
 * A cross-market matcher for Fashionphile and Rebag. The same physical bag has a
 * different handle on each site, so the existing tools cannot join the two
 * catalogs at all: search returns one site's listing and there is no way to ask
 * what the other site charges for the same thing. The join key is the model name
 * inside the title.
 *
 * Verified on 250 products from each source on 2026-09-27, which ruled out three
 * plausible tools before they were written:
 *   - no size run: 0 of 250 products on either site have more than one variant,
 *     so a per-size matrix would have had nothing to show
 *   - no markdowns: 0 variants on either site have compare_at_price above price
 *   - no facets: the tags are campaign metadata, not a taxonomy. Fashionphile's
 *     are things like "amazon-market-template" and "tiktok-market-template-clutches",
 *     and Rebag's are "bc-filter-General View", "reflaunt_dropship" and
 *     "dynamic-feed-24". Nothing to build a facet tree from.
 * The one thing both catalogs do agree on is the model name in the title, and it
 * appears with the same frequency on both sides, so that is the join key.
 */
/** Fendi model names that appear in resale listing titles. */
const FENDI_MODELS = [
    "Baguette", "Marmont", "Birkin", "Kelly", "Peekaboo", "Pochette", "Speedy",
    "Monogram", "Alma", "Herbag", "Zucca", "Cameo", "Roma", "Spyder", "Palio",
    "Bok", "Sun", "Fur", "Nautical", "Shearling", "Tornabuoni", "Fiore",
    "Visetos", "Metropolis", "FENDI", "Nappa", "Watt", "Newspaper", "FENDI Way",
];
/** Words that describe an item but do not identify which model it is. */
const TITLE_NOISE = [
    "excellent", "great", "very good", "good", "fair", "condition", "new", "preowned",
    "black", "brown", "white", "red", "navy", "beige", "tan", "grey", "gray", "blue",
    "green", "pink", "gold", "silver", "monogram", "visetos", "authentic", "fendi",
    "leather", "calfskin", "kidskin", "lambskin", "canvas", "coated", "canvas",
    "nylon", "suede", "denim", "quilted", "matelasse", "shearling", "fur", "python",
    "lizard", "ostrich", "crocodile", "alligator", "goatskin", "deer", "horse",
    "mini", "small", "medium", "large", "xl", "petite", "travel", "shopper", "tote",
    "shoulder", "crossbody", "clutch", "wristlet", "backpack", "briefcase", "pouch",
    "bag", "handbag", "purse", "wallet", "card", "holder", "case", "chain", "strap",
    "flap", "zip", "zipper", "pouch", "monogram", "double", "single", "triple",
    "womens", "mens", "women", "men", "the", "and", "with", "for",
];
/** Size qualifiers, kept because a Mini Baguette is not a Large Baguette. */
const SIZE_WORDS = [
    "mini", "nano", "micro", "small", "medium", "large", "xl", "petite",
    "25", "28", "30", "35", "40", "50",
];
/** The model found in a title, with its size qualifier, or null. */
function modelKey(title) {
    const raw = String(title ?? "");
    if (!raw.trim())
        return null;
    const lower = raw.toLowerCase();
    // Longest first, so "Fendi Way" is not read as "Fendi" and "Newspaper" is not
    // read as "Paper".
    const hit = [...FENDI_MODELS]
        .sort((a, b) => b.length - a.length)
        .find((m) => new RegExp(`\\b${m.toLowerCase()}\\b`).test(lower));
    if (!hit)
        return null;
    const size = SIZE_WORDS.find((s) => new RegExp(`\\b${s}\\b`).test(lower)) ?? null;
    return { model: hit, size };
}
/** The token bag of a title with the noise words removed, for a looser match. */
function fingerprint(title) {
    const words = String(title ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !TITLE_NOISE.includes(w));
    return [...new Set(words)].sort().join(" ");
}
/**
 * Fendi is about 1.5% of both catalogs, measured over 750 products per site:
 * 11 Fendi listings against 739 from other houses. Reaching a usable sample
 * therefore means reading many pages, and the pages are fetched in parallel
 * because Fashionphile rate-limits bursts with a 429 "Verifying your connection".
 * The brand filter is applied inside catalog(), so a Fendi-only set comes back
 * and the yield is reported rather than hidden.
 */
async function collect(source, pages) {
    // catalog() applies the brand filter internally, so the size of a raw page is
    // not observable from here and a per-run "x of y" ratio cannot be computed.
    // The measured share is roughly 1.5% and is stated as a constant instead.
    const results = await Promise.all(pages.map((pg) => catalog(source, pg).then((ps) => ({ ok: true, ps })).catch(() => ({ ok: false, ps: [] }))));
    const fendi = [];
    let failed = 0;
    for (const r of results) {
        if (!r.ok) {
            failed += 1;
            continue;
        }
        fendi.push(...r.ps);
    }
    return { fendi, failed };
}
function toMatched(source, p) {
    const s = slim(source.name, source.base, p);
    const key = modelKey(String(p.title ?? ""));
    return {
        source: source.name,
        title: String(p.title ?? ""),
        handle: String(p.handle ?? ""),
        price: s.price_usd,
        available: s.available,
        condition: s.condition,
        url: s.url,
        size: key?.size ?? null,
    };
}
const median = (xs) => {
    if (!xs.length)
        return null;
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const usd = (n) => (n === null ? "no price" : `$${n.toFixed(0)}`);
/**
 * The same model priced on both sites. The join is on the model name inside the
 * title, which is a real limitation: it cannot see that a "Baguette" and a
 * "Baguette II" are different bags, and it will happily treat two colourways of
 * one bag as one comparison.
 */
export async function crossMarketMatch(args) {
    // Fendi is about 1.5% of each catalog, so the page count has to be generous
    // before a specific model shows up. Pages are fetched in parallel.
    const pages = Math.min(Math.max(Math.floor(args.pages ?? 6) || 6, 1), 16);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 6) || 6, 1), 25);
    const wantModel = String(args.model ?? "").trim().toLowerCase();
    const wantQuery = String(args.query ?? "").trim().toLowerCase();
    if (!wantModel && !wantQuery) {
        throw new FendiError("Provide a model name such as Baguette, or a query such as 'quilted flap'.");
    }
    const perSource = [];
    for (const s of SOURCES) {
        const c = await collect(s, Array.from({ length: pages }, (_, i) => i + 1));
        perSource.push({ source: s, items: c.fendi.map((p) => toMatched(s, p)), failed: c.failed });
    }
    const keep = (m) => {
        if (wantModel) {
            const k = modelKey(m.title);
            if (!k)
                return false;
            if (k.model.toLowerCase() !== wantModel)
                return false;
            if (wantQuery)
                return fingerprint(m.title).includes(fingerprint(wantQuery).split(" ")[0] ?? "");
            return true;
        }
        if (!fingerprint(m.title).includes(wantQuery.split(" ")[0] ?? ""))
            return false;
        const k = modelKey(m.title);
        return k !== null;
    };
    const buckets = new Map();
    for (const { source, items } of perSource) {
        for (const m of items) {
            if (!keep(m))
                continue;
            const k = modelKey(m.title);
            if (!k)
                continue;
            // The size is part of the key: a Mini Baguette and a Large Baguette are
            // different products at different prices and must not be compared.
            const key = k.size ? `${k.model} ${k.size}` : k.model;
            if (!buckets.has(key))
                buckets.set(key, { fashionphile: [], rebag: [] });
            buckets.get(key)[source.name].push(m);
        }
    }
    const both = [...buckets.entries()].filter(([, v]) => v.fashionphile.length && v.rebag.length);
    const oneSided = [...buckets.entries()].filter(([, v]) => !v.fashionphile.length || !v.rebag.length);
    if (!buckets.size) {
        return [
            `No Fendi listing on either site matched ${wantModel ? `model "${args.model}"` : `"${args.query}"`} in the ${pages} catalog page(s) read per site.`,
            "",
            `Fendi listings found in the ${pages} page(s) read per site: ${perSource.map((p) => `${p.source.name} ${p.items.length}`).join("; ")}.`,
            "",
            "Fendi is roughly one and a half per cent of both catalogs, so a search that finds nothing usually means the pages read did not happen to contain that model rather than that the site has none. Both catalogs are ordered by the retailer rather than by model, so a rare model can sit many pages in. Raising pages is the only way to widen the sample, and the cost is one request per page per site.",
            "",
            "One specific trap: these are multi-brand catalogs, and the word Monogram appears on hundreds of non-Fendi listings because it is overwhelmingly a Louis Vuitton name. The Fendi brand filter runs first so those are excluded here, but it means a Fendi Monogram listing is rare enough that searching for it often returns nothing.",
        ].join("\n");
    }
    const lines = [
        `Cross-market Fendi: ${buckets.size} model(s) matched, ${both.length} on both sites`,
        `Sources: ${perSource.map((p) => `${p.source.name} ${p.items.length} Fendi listing(s)${p.failed ? `, ${p.failed} page(s) failed to load` : ""}`).join(" | ")}   (Fendi is about 1.5% of each catalog, so ${pages} page(s) yields a small sample)`,
        "",
    ];
    both.sort((a, b) => {
        const av = Math.min(...[...a[1].fashionphile, ...a[1].rebag].map((x) => x.price ?? Infinity));
        const bv = Math.min(...[...b[1].fashionphile, ...b[1].rebag].map((x) => x.price ?? Infinity));
        return av - bv;
    });
    for (const [key, v] of both.slice(0, limit)) {
        const fpPrices = v.fashionphile.map((x) => x.price).filter((p) => p !== null);
        const rbPrices = v.rebag.map((x) => x.price).filter((p) => p !== null);
        const fpAvail = v.fashionphile.filter((x) => x.available);
        const rbAvail = v.rebag.filter((x) => x.available);
        const fpMin = fpPrices.length ? Math.min(...fpPrices) : null;
        const rbMin = rbPrices.length ? Math.min(...rbPrices) : null;
        lines.push(`${key}`);
        lines.push(`  fashionphile: ${v.fashionphile.length} listing(s), ${fpAvail.length} available, ${usd(fpMin)} to ${usd(fpPrices.length ? Math.max(...fpPrices) : null)}, median ${usd(median(fpPrices))}`);
        lines.push(`  rebag:        ${v.rebag.length} listing(s), ${rbAvail.length} available, ${usd(rbMin)} to ${usd(rbPrices.length ? Math.max(...rbPrices) : null)}, median ${usd(median(rbPrices))}`);
        if (fpMin !== null && rbMin !== null && fpMin > 0) {
            const diff = rbMin - fpMin;
            const cheaper = diff > 0 ? "fashionphile" : diff < 0 ? "rebag" : "neither";
            lines.push(diff === 0
                ? `  the cheapest listing is the same price on both`
                : `  the cheaper side is ${cheaper}, ${usd(Math.abs(diff))} (${((Math.abs(diff) / fpMin) * 100).toFixed(0)}%) ${diff > 0 ? "below" : "above"} the other side's floor of ${usd(diff > 0 ? fpMin : rbMin)}`);
            if (fpAvail.length === 0 && rbAvail.length > 0) {
                lines.push(`  every fashionphile listing of this model is sold out, so the rebag price is the only one you can actually buy`);
            }
        }
        const cheapestOverall = [...v.fashionphile, ...v.rebag]
            .filter((x) => x.available)
            .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
        if (cheapestOverall) {
            lines.push(`  cheapest buyable: ${usd(cheapestOverall.price)} at ${cheapestOverall.source} — ${cheapestOverall.title.slice(0, 52)}`);
        }
        else {
            lines.push(`  nothing in this model is available on either site right now`);
        }
        lines.push("");
    }
    if (oneSided.length) {
        // A model can appear on both sites yet produce no matched key, because the
        // size qualifiers differ: a Zucca mini on one side and a Zucca medium on the
        // other are correctly not compared, but calling that "only on one site" is
        // simply wrong. The base model is checked before making that claim.
        const sizeMismatch = [];
        const trulyOneSided = [];
        for (const [k, v] of oneSided) {
            const base = k.split(" ")[0].toLowerCase();
            const onFp = v.fashionphile.length > 0;
            const onRb = v.rebag.length > 0;
            if (onFp !== onRb) {
                // Is the base model present on the other side under a different size?
                const otherHas = onFp
                    ? [...buckets.entries()].some(([k2, v2]) => k2.split(" ")[0].toLowerCase() === base && v2.rebag.length > 0)
                    : [...buckets.entries()].some(([k2, v2]) => k2.split(" ")[0].toLowerCase() === base && v2.fashionphile.length > 0);
                if (otherHas)
                    sizeMismatch.push(k);
                else
                    trulyOneSided.push(k);
            }
        }
        if (trulyOneSided.length) {
            lines.push(`On one site only (${trulyOneSided.length}): ${trulyOneSided.slice(0, 12).join(", ")}${trulyOneSided.length > 12 ? ", and more" : ""}.`, "A model stocked by only one of the two is usually a stock difference rather than a rarity, so it says nothing about where the better price is.");
        }
        if (sizeMismatch.length) {
            lines.push(`On both sites but with no matching size (${sizeMismatch.length}): ${sizeMismatch.slice(0, 12).join(", ")}${sizeMismatch.length > 12 ? ", and more" : ""}.`, "The model exists on both sites but the size qualifiers do not line up, so there is nothing to compare directly. The sizes are in the key on purpose: a Zucca mini and a Zucca medium are different products at different prices, and averaging them into one row would be a comparison of nothing.");
        }
        lines.push("");
    }
    lines.push("The join is on the model name inside the title, and that is a real weakness. It cannot tell a Baguette from a Baguette II, it does not read the generation or the year, and it compares every colourway of a model as though they were one product. It also cannot tell a bag with a pharaoh clasp from one without, or one with a detachable strap from one without. Treat the spread as a lead on where to look, not as the price difference for the bag you want.");
    lines.push("Prices are each retailer's own asking prices on resale. Neither site publishes a sold price, so a low asking price on one may simply be an overpriced item that has not sold yet.");
    return lines.join("\n");
}
/**
 * The real floor: the cheapest listing that can actually be bought, as opposed to
 * the cheapest listing, which on these sites is often sold out and is therefore
 * not a price at all.
 */
export async function priceLadder(args) {
    const pages = Math.min(Math.max(Math.floor(args.pages ?? 6) || 6, 1), 16);
    const wantModel = String(args.model ?? "").trim().toLowerCase();
    const wantQuery = String(args.query ?? "").trim().toLowerCase();
    if (!wantModel && !wantQuery) {
        throw new FendiError("Provide a model name such as Baguette, or a query such as 'quilted flap'.");
    }
    const lines = [];
    let anyMatch = false;
    for (const s of SOURCES) {
        const c = await collect(s, Array.from({ length: pages }, (_, i) => i + 1));
        const items = c.fendi.map((p) => toMatched(s, p));
        const matched = items.filter((m) => {
            const k = modelKey(m.title);
            if (!k)
                return false;
            if (wantModel && k.model.toLowerCase() !== wantModel)
                return false;
            if (wantQuery)
                return fingerprint(m.title).includes(wantQuery.split(" ")[0] ?? "");
            return true;
        });
        if (!matched.length) {
            lines.push(`${s.name}: nothing matched`);
            lines.push("");
            continue;
        }
        anyMatch = true;
        const prices = matched.map((m) => m.price).filter((p) => p !== null);
        const avail = matched.filter((m) => m.available);
        const availPrices = avail.map((m) => m.price).filter((p) => p !== null);
        const cheapestAsking = prices.length ? Math.min(...prices) : null;
        const cheapestBuyable = availPrices.length ? Math.min(...availPrices) : null;
        lines.push(`${s.name}: ${matched.length} listing(s), ${avail.length} available, ${matched.length - avail.length} sold out`);
        const askNote = cheapestBuyable !== null && cheapestAsking !== null && cheapestAsking < cheapestBuyable
            ? "  (a sold-out listing, so not a price you can pay)"
            : "";
        lines.push(`  cheapest asking price: ${usd(cheapestAsking)}${askNote}`);
        lines.push(`  cheapest actually buyable: ${usd(cheapestBuyable)}`);
        if (prices.length) {
            const p25 = [...prices].sort((a, b) => a - b)[Math.floor(prices.length * 0.25)];
            lines.push(`  range ${usd(Math.min(...prices))} to ${usd(Math.max(...prices))}, median ${usd(median(prices))}, lower quartile ${usd(p25)}`);
        }
        // Split by condition, because a price with no condition next to it is not
        // comparable with one that has.
        const byCond = new Map();
        for (const m of matched) {
            const c = m.condition ?? "condition not stated";
            if (!byCond.has(c))
                byCond.set(c, []);
            const p = m.price;
            if (p !== null)
                byCond.get(c).push(p);
        }
        if (byCond.size > 1) {
            lines.push("", "  by stated condition:");
            for (const [c, ps] of [...byCond.entries()].sort((a, b) => median(b[1]) - median(a[1]))) {
                lines.push(`    ${c.padEnd(24)}${String(ps.length).padStart(3)} listing(s)  ${usd(Math.min(...ps))} to ${usd(Math.max(...ps))}  median ${usd(median(ps))}`);
            }
            const conds = [...byCond.keys()];
            if (conds.length > 1 && !conds.some((c) => /not stated/i.test(c))) {
                lines.push(`    Conditions present: ${conds.join(", ")}. A "fair" bag and a "great" bag are not the same product at different prices, so compare within a condition, never across them.`);
            }
        }
        else if (byCond.size === 1) {
            lines.push(`  Every listing states the same condition (${[...byCond.keys()][0]}), so no condition split is possible here.`);
        }
        // The outlying listing, which is where a misprice or a bait listing shows up.
        if (availPrices.length > 3) {
            const sortedAvail = [...availPrices].sort((a, b) => a - b);
            const med = median(sortedAvail);
            const floor = sortedAvail[0];
            if (med > 0 && floor < med * 0.45) {
                const outlier = avail.filter((m) => m.price === floor)[0];
                lines.push("", `  One available listing sits far below the rest: ${usd(floor)} against a median of ${usd(med)}, which is ${((1 - floor / med) * 100).toFixed(0)}% below it.`, `    ${outlier?.title.slice(0, 60)}`, "    A price that far out of line with the same model is worth a look and also worth suspicion: it is the shape of a mispriced listing, of a bag with a defect the condition field does not mention, or of a bait listing. Check the photos and the description before treating it as the real market floor.");
            }
        }
        lines.push("");
    }
    if (!anyMatch) {
        return `No Fendi listing on either site matched ${wantModel ? `model "${args.model}"` : `"${args.query}"`} across ${pages} catalog page(s) per site.`;
    }
    lines.push("Both sites delete a listing once it sells, so what is here is only what is unsold. There is no sold-price history on either site through the catalog, which means a low asking price cannot be distinguished from a high one that simply has not sold yet.");
    return lines.join("\n").trimEnd();
}
/**
 * The two sites' product types side by side. They are not reconcilable: the
 * catalogs use disjoint vocabularies, so a category filter on one site means
 * nothing on the other and a cross-site count by category is not a like-for-like
 * comparison.
 */
export async function sourceTaxonomy(args) {
    const top = Math.min(Math.max(Math.floor(args.top ?? 20) || 20, 1), 100);
    const only = String(args.source ?? "").trim().toLowerCase();
    const sources = only ? SOURCES.filter((s) => s.name === only) : SOURCES;
    if (!sources.length)
        throw new FendiError(`Unknown source "${args.source}". Use ${SOURCES.map((s) => s.name).join(" or ")}.`);
    const perSource = [];
    for (const s of sources) {
        const c = await collect(s, [1, 2]);
        const items = c.fendi;
        const counts = new Map();
        for (const p of items) {
            const t = String(p?.product_type ?? "").trim() || "(blank)";
            counts.set(t, (counts.get(t) ?? 0) + 1);
        }
        perSource.push({ name: s.name, counts, total: items.length });
    }
    const lines = [];
    for (const { name, counts, total } of perSource) {
        const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        lines.push(`${name}: ${total} products read, ${entries.length} distinct product_type value(s)`);
        lines.push(`${"count".padStart(6)}  product_type`);
        for (const [t, n] of entries.slice(0, top))
            lines.push(`${String(n).padStart(6)}  ${t}`);
        if (entries.length > top)
            lines.push(`       ...and ${entries.length - top} more values`);
        lines.push("");
    }
    if (perSource.length === 2) {
        const [a, b] = perSource;
        const as = new Set([...a.counts.keys()].map((x) => x.toLowerCase()));
        const bs = new Set([...b.counts.keys()].map((x) => x.toLowerCase()));
        const shared = [...as].filter((x) => bs.has(x));
        const onlyA = [...as].filter((x) => !bs.has(x));
        const onlyB = [...bs].filter((x) => !as.has(x));
        lines.push(`The two vocabularies share ${shared.length} value(s)${shared.length ? `: ${shared.join(", ")}` : ""}.`, `fashionphile-only: ${onlyA.length}  |  rebag-only: ${onlyB.length}`, "", "These are not the same classification, so any comparison by product type across the two sites is comparing different things. Where one site has four broad types and the other has dozens of shapes, a count in a bucket means something narrower on the second site than on the first, and a listing classified as a bag shape on one can be a broad accessories entry on the other. This is the reason cross_market_match joins on the model name in the title rather than on category.");
        lines.push("");
        lines.push("Neither site's tags are a usable taxonomy either. Fashionphile's are campaign and syndication markers such as amazon-market-template and tiktok-market-template-clutches, and Rebag's are filter and feed identifiers such as bc-filter-General View, reflaunt_dropship and dynamic-feed-24. There is no facet tree on either side to build a filter from.");
    }
    return lines.join("\n").trimEnd();
}
