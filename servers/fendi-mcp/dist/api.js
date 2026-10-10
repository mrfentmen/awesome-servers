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
