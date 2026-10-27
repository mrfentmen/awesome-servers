export class SaintLaurentError extends Error {
    constructor(message) {
        super(message);
        this.name = "SaintLaurentError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const VENDORS = ["saint laurent", "yves saint laurent", "ysl"];
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
        throw new SaintLaurentError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new SaintLaurentError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
        throw new SaintLaurentError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Saint Laurent", query, returned: out.length, truncated: out.length >= n, condition_filter: cond ?? null, listings: out.slice(0, n) });
}
export async function listNewest(limit, page, productType, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new SaintLaurentError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Saint Laurent", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
export async function getListing(handle, source) {
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new SaintLaurentError(`Unknown source '${source}'. Use fashionphile or rebag.`);
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
                brand: "Saint Laurent", ...sl, price_usd: dollar, variants, images,
                description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
                tags: p.tags,
            });
        }
        catch { /* try next source */ }
    }
    throw new SaintLaurentError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`);
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
        throw new SaintLaurentError("No priced listings found.");
    const stats = (arr) => {
        const a = [...arr].sort((x, y) => x - y);
        const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
        return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] };
    };
    const condStats = {};
    for (const [c, arr] of Object.entries(byCondition))
        condStats[c] = stats(arr);
    return pretty({
        brand: "Saint Laurent", currency: "USD", unpriced, overall: stats(prices), by_condition: condStats,
        note: "Asking prices on resale sources, not appraisals. Not affiliated with Saint Laurent.",
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
    return pretty({ brand: "Saint Laurent", query, groups: rows.length, rows: rows.slice(0, 15) });
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
        throw new SaintLaurentError("No available priced listings found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        brand: "Saint Laurent", sample: all.length, brand_median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Saint Laurent.",
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
        brand: "Saint Laurent", catalog_sample: total, by_source: bySource,
        by_product_type: byType, by_condition: byCondition,
        note: "Sample of newest ~500 listings per source. Not affiliated with Saint Laurent.",
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
        brand: "Saint Laurent", query: query ?? null, returned: rows.length,
        note: "Collection handles feed browse_collection. store_products counts the whole collection.",
        collections: rows.slice(0, 60),
    });
}
export async function browseCollection(handle, source, limit, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new SaintLaurentError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new SaintLaurentError(`Unknown source '${source}'. Use ${SOURCES.map((s) => s.name).join(" or ")}.`);
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
        throw new SaintLaurentError(`Collection '${handle}' has no Saint Laurent listings on ${sources.map((s) => s.name).join(", ")}.`);
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({
        brand: "Saint Laurent", collection: handle, brand_items_matched: brandItems,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_attribute(color, material, condition, maxPrice, limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new SaintLaurentError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const wantColor = color ? color.trim().toLowerCase() : null;
    const wantMaterial = material ? material.trim().toLowerCase() : null;
    if (!wantColor && !wantMaterial && !cond)
        throw new SaintLaurentError("Give at least one of color, material or condition.");
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
        brand: "Saint Laurent", color: wantColor, material: wantMaterial, condition: cond ?? null,
        sample: per, attributes_known: tagged, top_colors: top(colors), top_materials: top(materials),
        note: "Structured colour/material tags where the source publishes them, listing-title match otherwise.",
        matched: all.length, returned: Math.min(all.length, n), listings: all.slice(0, n).sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity)),
    });
}
// ---- muxH tools:
// Every tool above reads a Saint Laurent listing as a title and a price. What
// actually decides the value of a Saint Laurent piece is the line it belongs to
// and what it is made of, and both are written into the title and the
// description prose, so they can be read out and grouped.
const YSL_UA = "mcfentmen-saintlaurent-mcp/1.1 (https://github.com/mcfentmen/saintlaurent-mcp)";
// Ordered longest-first, so "Sac de Jour" wins over a bare "Jour" and
// "Classic Monogram Kate" wins over a bare "Kate".
const YSL_LINES = [
    ["Cabas Chyc", /chyc/i],
    ["Sac de Jour", /sac\s+de\s+jour|sac\s+de\s+j[ou]r/i],
    ["Monogram Kate", /classic\s+monogram\s+kate|monogram\s+kate/i],
    ["Sunset", /sunset/i],
    ["Kate", /\bkate\b/i],
    ["Loulou", /loulou/i],
    ["Niki", /\bniki\b/i],
    ["L Authentic", /l[\s-]?authentic/i],
    ["Manhattan", /manhattan/i],
    ["Paris", /paris\s+(mini|grand|large)/i],
    ["Baguette", /baguette/i],
    ["Toy", /\btoy\b/i],
    ["Cabas", /cabas/i],
    ["Grace", /grace/i],
    ["Wyatt", /wyatt/i],
    ["Envelope", /envelope/i],
    ["Jackie", /jackie/i],
    ["Belle", /belle/i],
    ["Lyn", /lyn\b/i],
    ["Lou", /\blou\b/i],
    ["Coussin", /coussin/i],
    ["Bear", /bear/i],
    ["Teddy", /teddy/i],
    ["Cassandre", /cassandre/i],
    ["Biker", /biker/i],
    ["Bombé", /bombe|bombé/i],
    ["Vintage", /vintage/i],
    ["SL 550", /\bsl\s*550\b/i],
    ["SL 364", /\bsl\s*364\b/i],
];
// The execution, which is what separates a monogram piece from a plain one.
const YSL_MATERIALS = [
    ["monogram canvas or jacquard", /monogram|jacquard|monogramme/i],
    ["crocodile embossed", /crocodile embossed|croc embossed|crocodile/i],
    ["grained leather", /grained leather|pebbled/i],
    ["matelasse leather", /matelasse|matelassé/i],
    ["suede", /suede/i],
    ["shearling", /shearling|sherpa/i],
    ["denim", /denim/i],
    ["nylon or teddy", /\bnylon\b|teddy/i],
    ["silk", /silk/i],
    ["acetate eyewear", /acetate|sunglass|eyewear/i],
    ["leather, unspecified", /calfskin|leather/i],
    ["wool or suiting", /wool|flannel|tweed/i],
];
const money = (value) => (value === null ? "not reported" : `$${Math.round(value).toLocaleString()}`);
function median(values) {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function lineOf(listing) {
    const haystack = `${listing.title} ${listing.body}`;
    for (const [name, pattern] of YSL_LINES) {
        if (pattern.test(haystack))
            return name;
    }
    return "line not stated";
}
function materialOf(listing) {
    const haystack = `${listing.title} ${listing.body}`;
    for (const [name, pattern] of YSL_MATERIALS) {
        if (pattern.test(haystack))
            return name;
    }
    return "material not stated";
}
async function yslListings() {
    const out = [];
    const queries = ["saint laurent", "ysl", "saint laurent bag", "ysl sunglasses"];
    for (const source of SOURCES) {
        for (const query of queries) {
            let body;
            try {
                body = await getJson(`${source.suggest}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=25`);
            }
            catch {
                continue;
            }
            const rows = body
                ?.resources?.results?.products;
            if (!Array.isArray(rows))
                continue;
            for (const row of rows) {
                if (!matchesBrand(row.vendor))
                    continue;
                const handle = String(row.handle ?? "");
                if (!handle || out.some((l) => l.handle === handle))
                    continue;
                const price = Number(row.price);
                const compare = Number(row.compare_at_price_max);
                out.push({
                    handle,
                    title: String(row.title ?? ""),
                    body: String(row.body ?? ""),
                    price: Number.isFinite(price) ? price : null,
                    compareAt: Number.isFinite(compare) && compare > 0 ? compare : null,
                    available: row.available !== false,
                    source: source.name,
                    productType: String(row.type ?? row.product_type ?? ""),
                });
            }
        }
    }
    return out;
}
function summarise(items) {
    const prices = items.map((i) => i.price).filter((p) => p !== null);
    return {
        n: items.length,
        priced: prices.length,
        min: prices.length ? Math.min(...prices) : null,
        med: prices.length ? median(prices) : null,
        max: prices.length ? Math.max(...prices) : null,
    };
}
/**
 * The Saint Laurent range by line, not by price: every named silhouette in the
 * listings, with how many are listed and what each line asks.
 */
export async function lineMatrix(args) {
    const size = Math.min(Math.max(Number(args?.limit) || 12 || 12, 1), 30);
    const materialFilter = (args?.material ?? "").trim().toLowerCase();
    const listings = await yslListings();
    if (!listings.length)
        return "Neither storefront returned a Saint Laurent listing.";
    const wanted = materialFilter
        ? listings.filter((l) => materialOf(l).toLowerCase().includes(materialFilter))
        : listings;
    if (!wanted.length) {
        const seen = [...new Set(listings.map(materialOf))].join(", ");
        throw new SaintLaurentError(`No Saint Laurent listing uses a material matching "${args?.material}". Materials present: ${seen}.`);
    }
    const groups = new Map();
    for (const item of wanted) {
        const line = lineOf(item);
        groups.set(line, [...(groups.get(line) ?? []), item]);
    }
    const rows = [...groups.entries()]
        .map(([line, items]) => ({ line, ...summarise(items) }))
        .sort((a, b) => (b.med ?? 0) - (a.med ?? 0));
    const storeSplit = new Map();
    for (const item of wanted)
        storeSplit.set(item.source, (storeSplit.get(item.source) ?? 0) + 1);
    return [
        `Saint Laurent line matrix (${wanted.length} listing(s)${materialFilter ? ` in ${materialFilter}` : ""})`,
        `  across ${storeSplit.size} storefront(s): ${[...storeSplit.entries()].map(([s, n]) => `${s} ${n}`).join(", ")}`,
        `  ${rows.length} distinct line(s) identified, ${wanted.filter((l) => l.available).length} currently available`,
        "",
        "Line                         n  priced    asking range              median",
        ...rows.slice(0, size).map((row) => `  ${row.line.slice(0, 27).padEnd(27)} ${String(row.n).padStart(2)}  ${String(row.priced).padStart(5)}  ${`${money(row.min)} to ${money(row.max)}`.padEnd(23)} ${money(row.med)}`),
        rows.length > size ? `  (+${rows.length - size} more lines)` : "",
        "",
        "A line is only named when the title or the description says so; anything else is grouped as 'line not stated' rather than guessed.",
        "Not affiliated with Saint Laurent, Fashionphile or Rebag.",
    ].join("\n");
}
/**
 * The execution behind each piece, which is what decides a Saint Laurent's
 * price: monogram canvas against plain leather, real crocodile embossing
 * against a printed crocodile, and which of those is actually on the shelf.
 */
export async function materialCensus(args) {
    const size = Math.min(Math.max(Number(args?.limit) || 12 || 12, 1), 30);
    const lineFilter = (args?.line ?? "").trim().toLowerCase();
    const listings = await yslListings();
    if (!listings.length)
        return "Neither storefront returned a Saint Laurent listing.";
    const wanted = lineFilter
        ? listings.filter((l) => lineOf(l).toLowerCase().includes(lineFilter))
        : listings;
    if (!wanted.length) {
        throw new SaintLaurentError(`No Saint Laurent listing belongs to a line matching "${args?.line}".`);
    }
    const groups = new Map();
    for (const item of wanted) {
        const material = materialOf(item);
        groups.set(material, [...(groups.get(material) ?? []), item]);
    }
    const rows = [...groups.entries()]
        .map(([material, items]) => ({ material, ...summarise(items) }))
        .sort((a, b) => (b.med ?? 0) - (a.med ?? 0));
    const discounted = wanted.filter((l) => l.compareAt !== null && l.price !== null && l.compareAt > l.price);
    const monogram = wanted.filter((l) => materialOf(l).startsWith("monogram")).length;
    const special = wanted.filter((l) => materialOf(l).startsWith("crocodile")).length;
    return [
        `Saint Laurent material census (${wanted.length} listing(s)${lineFilter ? ` on the ${args?.line} line` : ""})`,
        `  ${rows.length} distinct execution(s) identified from the title and description prose`,
        "",
        "Execution                        n  priced    asking range              median",
        ...rows.slice(0, size).map((row) => `  ${row.material.slice(0, 29).padEnd(29)} ${String(row.n).padStart(2)}  ${String(row.priced).padStart(5)}  ${`${money(row.min)} to ${money(row.max)}`.padEnd(23)} ${money(row.med)}`),
        rows.length > size ? `  (+${rows.length - size} more)` : "",
        "",
        `  monogram canvas or jacquard pieces: ${monogram} of ${wanted.length}`,
        `  crocodile embossed pieces: ${special} of ${wanted.length}`,
        `  listings sitting below a strike-through price: ${discounted.length}${discounted.length ? ` — the deepest cut is ${((1 - Math.min(...discounted.map((l) => l.compareAt / l.price))) * 100).toFixed(0)}%` : ""}`,
        "",
        "Crocodile embossing is a finish on ordinary calfskin, not real crocodile; a listing is only read as monogram when the text says so.",
        "Not affiliated with Saint Laurent, Fashionphile or Rebag.",
    ].join("\n");
}
