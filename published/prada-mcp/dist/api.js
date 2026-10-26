export class PradaError extends Error {
    constructor(message) {
        super(message);
        this.name = "PradaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const VENDORS = ["prada"];
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
        throw new PradaError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new PradaError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
        throw new PradaError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Prada", query, returned: out.length, truncated: out.length >= n, condition_filter: cond ?? null, listings: out.slice(0, n) });
}
export async function listNewest(limit, page, productType, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new PradaError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Prada", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
export async function getListing(handle, source) {
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new PradaError(`Unknown source '${source}'. Use fashionphile or rebag.`);
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
                brand: "Prada", ...sl, price_usd: dollar, variants, images,
                description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
                tags: p.tags,
            });
        }
        catch { /* try next source */ }
    }
    throw new PradaError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`);
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
        throw new PradaError("No priced listings found.");
    const stats = (arr) => {
        const a = [...arr].sort((x, y) => x - y);
        const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
        return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] };
    };
    const condStats = {};
    for (const [c, arr] of Object.entries(byCondition))
        condStats[c] = stats(arr);
    return pretty({
        brand: "Prada", currency: "USD", unpriced, overall: stats(prices), by_condition: condStats,
        note: "Asking prices on resale sources, not appraisals. Not affiliated with Prada.",
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
    return pretty({ brand: "Prada", query, groups: rows.length, rows: rows.slice(0, 15) });
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
        throw new PradaError("No available priced listings found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        brand: "Prada", sample: all.length, brand_median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Prada.",
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
        brand: "Prada", catalog_sample: total, by_source: bySource,
        by_product_type: byType, by_condition: byCondition,
        note: "Sample of newest ~500 listings per source. Not affiliated with Prada.",
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
        brand: "Prada", query: query ?? null, returned: rows.length,
        note: "Collection handles feed browse_collection. store_products counts the whole collection.",
        collections: rows.slice(0, 60),
    });
}
export async function browseCollection(handle, source, limit, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new PradaError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new PradaError(`Unknown source '${source}'. Use ${SOURCES.map((s) => s.name).join(" or ")}.`);
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
        throw new PradaError(`Collection '${handle}' has no Prada listings on ${sources.map((s) => s.name).join(", ")}.`);
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({
        brand: "Prada", collection: handle, brand_items_matched: brandItems,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_attribute(color, material, condition, maxPrice, limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new PradaError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const wantColor = color ? color.trim().toLowerCase() : null;
    const wantMaterial = material ? material.trim().toLowerCase() : null;
    if (!wantColor && !wantMaterial && !cond)
        throw new PradaError("Give at least one of color, material or condition.");
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
        brand: "Prada", color: wantColor, material: wantMaterial, condition: cond ?? null,
        sample: per, attributes_known: tagged, top_colors: top(colors), top_materials: top(materials),
        note: "Structured colour/material tags where the source publishes them, listing-title match otherwise.",
        matched: all.length, returned: Math.min(all.length, n), listings: all.slice(0, n).sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity)),
    });
}
// ---- muxH tools:
// Every tool above reads one listing or one price list. These two read the
// shape of the Prada inventory itself: which sizes are actually on the shelf
// and at what price, and which merchandising flags the storefronts have
// attached to their stock.
const PRADA_UA = "prada-mcp/1.2 (https://github.com/mcfentmen/prada-mcp)";
const FACET_SIZE_PREFIXES = ["meta-size-", "custom-size-apparel-", "plp_size_"];
const FLAG_TAGS = new Set([
    "in-stock", "outlet", "new-arrivals", "promo-eligible", "final_sale_return_protection",
    "no-accessories", "sitewideselect", "whnew", "dropshipB2C",
]);
const usd = (value) => value === null ? "not reported" : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/**
 * A per-listing price taken from the cheapest variant, which is the figure a
 * shopper actually sees. Reads the same row shape the file already uses.
 */
function facetPrice(p) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const varPrices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
    if (varPrices.length)
        return Math.min(...varPrices);
    const top = Number(p.price ?? p.price_min);
    return Number.isFinite(top) ? top : null;
}
function tagList(p) {
    return Array.isArray(p.tags) ? p.tags.map((t) => String(t)) : [];
}
/**
 * Which Prada sizes are actually on the shelf right now, and what they cost.
 * Size is the one attribute the storefront tags consistently and the existing
 * filters ignore, and it is the attribute that decides whether a piece is
 * buyable at all.
 */
export async function sizeMatrix(args) {
    const want = Math.min(Math.max(Number(args.sample ?? 400) || 400, 20), 1200);
    const typeFilter = (args.productType ?? "").trim().toLowerCase();
    const items = await sampleCatalog(want, [1, 2, 3, 4]);
    if (!items.length)
        throw new PradaError("Neither storefront returned a Prada catalog page.");
    const sizes = new Map();
    const colours = new Map();
    let sized = 0;
    let priced = 0;
    for (const { p } of items) {
        if (typeFilter && !String(p.product_type ?? "").toLowerCase().includes(typeFilter))
            continue;
        const price = facetPrice(p);
        if (price !== null)
            priced += 1;
        for (const tag of tagList(p)) {
            const lower = tag.toLowerCase();
            const sizePrefix = FACET_SIZE_PREFIXES.find((prefix) => lower.startsWith(prefix));
            if (sizePrefix) {
                const value = tag.slice(sizePrefix.length).replace(/[_,]/g, " ").trim() || "unparsed";
                sized += 1;
                const bucket = sizes.get(value) ?? { tag: value, count: 0, prices: [] };
                bucket.count += 1;
                if (price !== null)
                    bucket.prices.push(price);
                sizes.set(value, bucket);
                continue;
            }
            if (lower.startsWith("meta-color-") || lower.startsWith("bc-filter-exterior-color-")) {
                const value = parseTag(tag, lower.startsWith("meta-color-") ? "meta-color-" : "bc-filter-exterior-color-") ?? "unparsed";
                const bucket = colours.get(value) ?? { tag: value, count: 0, prices: [] };
                bucket.count += 1;
                if (price !== null)
                    bucket.prices.push(price);
                colours.set(value, bucket);
            }
        }
    }
    if (!sizes.size) {
        throw new PradaError(`None of the ${items.length} Prada listings sampled carry a size tag. This storefront files size as meta-size- or custom-size-apparel-, so nothing was reported rather than guessed.`);
    }
    const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
    const rank = (facets) => [...facets.values()].sort((a, b) => b.count - a.count);
    const sizeRows = rank(sizes).slice(0, 25);
    const colourRows = rank(colours).slice(0, 15);
    return [
        `Prada size and colour matrix`,
        `  ${items.length} listing(s) sampled, ${priced} with a price, ${sized} size tag(s) found`,
        typeFilter ? `  restricted to product type containing "${args.productType}"` : "  all product types",
        "",
        `Sizes in stock (${sizes.size} distinct):`,
        ...sizeRows.map((s, i) => {
            const m = mean(s.prices);
            return `  ${String(i + 1).padStart(2)}. ${String(s.tag).slice(0, 40).padEnd(40)} ${String(s.count).padStart(3)} listing(s)${m === null ? "" : ` | mean ${usd(Math.round(m * 100) / 100)} | range ${usd(Math.min(...s.prices))} to ${usd(Math.max(...s.prices))}`}`;
        }),
        sizes.size > sizeRows.length ? `  (+${sizes.size - sizeRows.length} more sizes)` : "",
        "",
        `Colours in stock (${colours.size} distinct):`,
        ...colourRows.map((c, i) => `  ${String(i + 1).padStart(2)}. ${String(c.tag).slice(0, 40).padEnd(40)} ${String(c.count).padStart(3)} listing(s)`),
        colours.size > colourRows.length ? `  (+${colours.size - colourRows.length} more colours)` : "",
        "",
        "Counts are how many sampled listings carry each tag, not units in stock; a listing is one SKU.",
        "Not affiliated with Prada, Fashionphile or Rebag.",
    ].join("\n");
}
/**
 * The merchandising flags the two storefronts attach to their Prada stock:
 * which pieces are outlet, final sale, new arrivals or promo eligible, and what
 * those pieces cost against the rest of the sample.
 */
export async function flagReport(args) {
    const want = Math.min(Math.max(Number(args.sample ?? 400) || 400, 20), 1200);
    const size = Math.min(Math.max(Number(args.limit ?? 8) || 8, 1), 20);
    const items = await sampleCatalog(want, [1, 2, 3, 4]);
    if (!items.length)
        throw new PradaError("Neither storefront returned a Prada catalog page.");
    const flags = new Map();
    const baseline = [];
    const withCompareAt = [];
    for (const { p } of items) {
        const price = facetPrice(p);
        if (price !== null)
            baseline.push(price);
        for (const tag of tagList(p)) {
            const lower = tag.toLowerCase();
            if (FLAG_TAGS.has(lower)) {
                const bucket = flags.get(lower) ?? { tag: lower, count: 0, prices: [] };
                bucket.count += 1;
                if (price !== null)
                    bucket.prices.push(price);
                flags.set(lower, bucket);
            }
            if (lower.startsWith("bc-filter-") || lower.startsWith("dropship"))
                continue;
        }
        const variants = Array.isArray(p.variants) ? p.variants : [];
        for (const v of variants) {
            const was = Number(v.compare_at_price);
            const now = Number(v.price);
            if (Number.isFinite(was) && was > 0 && Number.isFinite(now) && was > now) {
                withCompareAt.push({ title: `${p.title} — ${String(v.title ?? "variant")}`.slice(0, 70), price: now, was, handle: String(p.handle) });
            }
        }
    }
    const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
    const median = (values) => {
        if (!values.length)
            return null;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = sorted.length >> 1;
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    const baseMean = mean(baseline);
    const baseMedian = median(baseline);
    const rows = [...flags.values()].sort((a, b) => b.count - a.count).slice(0, size);
    const withCompare = withCompareAt.sort((a, b) => (b.was - b.price) - (a.was - a.price));
    return [
        `Prada merchandising flags`,
        `  ${items.length} listing(s) sampled, ${baseline.length} with a price, median ${usd(baseMedian === null ? null : Math.round(baseMedian * 100) / 100)}`,
        "",
        "Flags on the sample:",
        ...(rows.length
            ? rows.map((f, i) => {
                const m = mean(f.prices);
                const delta = m !== null && baseMean ? ((m - baseMean) / baseMean) * 100 : null;
                return `  ${String(i + 1).padStart(2)}. ${f.tag.padEnd(30)} ${String(f.count).padStart(3)} listing(s)${m === null ? "" : ` | mean ${usd(Math.round(m * 100) / 100)}${delta === null ? "" : `, ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% against the sample mean`}`}`;
            })
            : ["  no merchandising flags found in this sample"]),
        flags.size > rows.length ? `  (+${flags.size - rows.length} more flags)` : "",
        "",
        `Listings with a strike-through price: ${withCompare.length}`,
        ...withCompare.slice(0, 8).map((r, i) => `  ${String(i + 1).padStart(2)}. ${r.title} — ${usd(r.price)} from ${usd(r.was)} (${(((r.price - r.was) / r.was) * 100).toFixed(0)}% off)`),
        "",
        "Flags come from the storefronts' own tags. 'final_sale_return_protection' means the piece cannot be returned.",
        "Not affiliated with Prada, Fashionphile or Rebag.",
    ].join("\n");
}
