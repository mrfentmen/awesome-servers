export class CartierError extends Error {
    constructor(message) {
        super(message);
        this.name = "CartierError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const VENDORS = ["cartier"];
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
        throw new CartierError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new CartierError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
        throw new CartierError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Cartier", query, returned: out.length, truncated: out.length >= n, condition_filter: cond ?? null, listings: out.slice(0, n) });
}
export async function listNewest(limit, page, productType, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new CartierError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Cartier", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
export async function getListing(handle, source) {
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new CartierError(`Unknown source '${source}'. Use fashionphile or rebag.`);
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
                brand: "Cartier", ...sl, price_usd: dollar, variants, images,
                description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
                tags: p.tags,
            });
        }
        catch { /* try next source */ }
    }
    throw new CartierError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`);
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
        throw new CartierError("No priced listings found.");
    const stats = (arr) => {
        const a = [...arr].sort((x, y) => x - y);
        const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
        return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] };
    };
    const condStats = {};
    for (const [c, arr] of Object.entries(byCondition))
        condStats[c] = stats(arr);
    return pretty({
        brand: "Cartier", currency: "USD", unpriced, overall: stats(prices), by_condition: condStats,
        note: "Asking prices on resale sources, not appraisals. Not affiliated with Cartier.",
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
    return pretty({ brand: "Cartier", query, groups: rows.length, rows: rows.slice(0, 15) });
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
        throw new CartierError("No available priced listings found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        brand: "Cartier", sample: all.length, brand_median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Cartier.",
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
        brand: "Cartier", catalog_sample: total, by_source: bySource,
        by_product_type: byType, by_condition: byCondition,
        note: "Sample of newest ~500 listings per source. Not affiliated with Cartier.",
    });
}
// ---- muxD tools:
function medianOf(values) {
    const a = [...values].sort((x, y) => x - y);
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
// Public Cartier product-line names, matched against listing titles only. The
// grouping says "this title mentions the line", not that the source confirms it.
const LINE_KEYWORDS = [
    { family: "Love", match: /\blove\b/i },
    { family: "Tank", match: /\btank\b/i },
    { family: "Santos", match: /\bsantos\b/i },
    { family: "Ballon Bleu", match: /\bballon\s*bleu\b/i },
    { family: "Panthere", match: /panth(è|e)re/i },
    { family: "Trinity", match: /\btrinity\b/i },
    { family: "Juste un Clou", match: /juste\s*un\s*clou/i },
    { family: "Colliers", match: /\bcolliers?\b/i },
    { family: "Signature", match: /\bsignature\b/i },
    { family: "Vintage", match: /\bvintage\b/i },
    { family: "Must de Cartier", match: /must\s*de\s*cartier/i },
    { family: "Pasha", match: /\bpasha\b/i },
    { family: "Divine", match: /\bdivine\b/i },
];
/** Which Cartier product line the sample is mostly made of, with prices per line. */
export async function lineFamilyMix(args) {
    const per = Math.min(Math.max(Number(args.sample ?? 150) || 150, 1), 400);
    const floor = Math.max(Number(args.min_items ?? 1) || 1, 1);
    const rows = await sampleCatalog(per, [1, 2, 3]);
    if (!rows.length)
        throw new CartierError("No Cartier listings were returned by either store.");
    const groups = new Map();
    let matched = 0;
    let unmatched = 0;
    for (const { source: s, p } of rows) {
        const sl = slim(s.name, s.base, p);
        const hit = LINE_KEYWORDS.find((k) => k.match.test(sl.title));
        if (!hit) {
            unmatched += 1;
            continue;
        }
        matched += 1;
        const b = groups.get(hit.family) ?? { prices: [], total: 0, available: 0, sample: sl };
        b.total += 1;
        if (sl.available)
            b.available += 1;
        if (sl.price_usd !== null && sl.price_usd > 0)
            b.prices.push(sl.price_usd);
        groups.set(hit.family, b);
    }
    if (!matched) {
        return `None of the ${rows.length} sampled Cartier listings had a title matching a known product-line name, so there is no line mix to report.`;
    }
    const ladder = [...groups.entries()]
        .map(([family, b]) => {
        const a = [...b.prices].sort((x, y) => x - y);
        return {
            line: family,
            listings: b.total,
            share_of_matched_pct: Math.round((b.total / matched) * 1000) / 10,
            available: b.available,
            priced: a.length,
            min_usd: a.length ? a[0] : null,
            median_usd: a.length ? Math.round(medianOf(a) * 100) / 100 : null,
            max_usd: a.length ? a[a.length - 1] : null,
            example_title: b.sample.title,
        };
    })
        .filter((r) => r.listings >= floor)
        .sort((a, b) => b.listings - a.listings);
    return pretty({
        brand: "Cartier", currency: "USD", sampled_listings: rows.length,
        listings_matching_a_line_name: matched, listings_not_matching: unmatched,
        min_items_per_line: floor, lines_found: groups.size, by_line: ladder,
        note: "Grouped by product-line keywords appearing in the listing title. The stores do not publish a line field, so this is a title match, not a verified model. Not affiliated with Cartier.",
    });
}
