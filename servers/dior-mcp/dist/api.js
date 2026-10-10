export class DiorError extends Error {
    constructor(message) {
        super(message);
        this.name = "DiorError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const VENDORS = ["christian dior", "dior"];
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
        throw new DiorError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new DiorError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
        throw new DiorError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Dior", query, returned: out.length, truncated: out.length >= n, condition_filter: cond ?? null, listings: out.slice(0, n) });
}
export async function listNewest(limit, page, productType, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new DiorError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
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
    return pretty({ brand: "Dior", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
export async function getListing(handle, source) {
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new DiorError(`Unknown source '${source}'. Use fashionphile or rebag.`);
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
                brand: "Dior", ...sl, price_usd: dollar, variants, images,
                description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
                tags: p.tags,
            });
        }
        catch { /* try next source */ }
    }
    throw new DiorError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`);
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
        throw new DiorError("No priced listings found.");
    const stats = (arr) => {
        const a = [...arr].sort((x, y) => x - y);
        const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
        return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] };
    };
    const condStats = {};
    for (const [c, arr] of Object.entries(byCondition))
        condStats[c] = stats(arr);
    return pretty({
        brand: "Dior", currency: "USD", unpriced, overall: stats(prices), by_condition: condStats,
        note: "Asking prices on resale sources, not appraisals. Not affiliated with Dior.",
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
    return pretty({ brand: "Dior", query, groups: rows.length, rows: rows.slice(0, 15) });
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
        throw new DiorError("No available priced listings found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        brand: "Dior", sample: all.length, brand_median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Dior.",
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
        brand: "Dior", catalog_sample: total, by_source: bySource,
        by_product_type: byType, by_condition: byCondition,
        note: "Sample of newest ~500 listings per source. Not affiliated with Dior.",
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
            const list = [];
            for (const page of [1, 2, 3]) {
                const data = await getJson(`${collectionsOrigin(s.catalog)}/collections.json?limit=250&page=${page}`);
                const rows = Array.isArray(data.collections) ? data.collections : [];
                if (!rows.length)
                    break;
                list.push(...rows);
            }
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
        brand: "Dior", query: query ?? null, returned: rows.length,
        note: "Collection handles feed browse_collection. store_products counts the whole collection.",
        collections: rows.slice(0, 60),
    });
}
export async function browseCollection(handle, source, limit, maxPrice, condition) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new DiorError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES;
    if (!sources.length)
        throw new DiorError(`Unknown source '${source}'. Use ${SOURCES.map((s) => s.name).join(" or ")}.`);
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
        throw new DiorError(`Collection '${handle}' has no Dior listings on ${sources.map((s) => s.name).join(", ")}.`);
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({
        brand: "Dior", collection: handle, brand_items_matched: brandItems,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_attribute(color, material, condition, maxPrice, limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const cond = condition !== undefined ? normCondition(condition) : undefined;
    if (condition !== undefined && cond === null)
        throw new DiorError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`);
    const wantColor = color ? color.trim().toLowerCase() : null;
    const wantMaterial = material ? material.trim().toLowerCase() : null;
    if (!wantColor && !wantMaterial && !cond)
        throw new DiorError("Give at least one of color, material or condition.");
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
        brand: "Dior", color: wantColor, material: wantMaterial, condition: cond ?? null,
        sample: per, attributes_known: tagged, top_colors: top(colors), top_materials: top(materials),
        note: "Structured colour/material tags where the source publishes them, listing-title match otherwise.",
        matched: all.length, returned: Math.min(all.length, n), listings: all.slice(0, n).sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity)),
    });
}
// ---- muxD tools:
/**
 * Dior lines in priority order, so a title naming both a hardware style and a bag
 * shape is credited to the most specific line rather than counted twice. The order
 * is longest-and-most-specific first; "30 Montaigne" must be tested before
 * "Montaigne" or the former is swallowed by the latter.
 */
const DIOR_LINES = [
    { name: "30 Montaigne", needles: ["30 montaigne"] },
    { name: "Lady D-Joy", needles: ["lady d-joy", "d-joy"] },
    { name: "Dior Caro", needles: ["dior caro", " caro"] },
    { name: "Lady Dior", needles: ["lady dior"] },
    { name: "Miss Dior", needles: ["miss dior"] },
    { name: "Dior Addict", needles: ["dior addict", "addict"] },
    { name: "Diorissimo", needles: ["diorissimo"] },
    { name: "D-ION", needles: ["d-ion"] },
    { name: "Bobby", needles: ["bobby"] },
    { name: "1947", needles: ["1947"] },
    { name: "Book Tote", needles: ["book tote", "booktote"] },
    { name: "Oblique", needles: ["oblique"] },
    { name: "Cannage", needles: ["cannage"] },
    { name: "Saddle", needles: ["saddle"] },
];
const lineOf = (title) => {
    const t = (title ?? "").toLowerCase();
    const matched = [];
    for (const l of DIOR_LINES) {
        if (l.needles.some((n) => t.includes(n)))
            matched.push(l.name);
    }
    // First match in priority order wins; the rest are reported so a listing that
    // genuinely spans two lines is visible rather than silently reallocated.
    return { line: matched[0] ?? null, alsoMatched: matched.slice(1) };
};
const median = (values) => {
    if (!values.length)
        return NaN;
    const a = [...values].sort((x, y) => x - y);
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};
const usd = (n) => {
    if (!Number.isFinite(n))
        return "n/a";
    if (Math.abs(n) >= 1000)
        return `$${Math.round(n).toLocaleString()}`;
    return `$${n.toFixed(0)}`;
};
/** The combined Dior inventory right now: how much there is, how much is sellable, how wide the price range is, and what arrived most recently. */
export async function inventoryDigest(args = {}) {
    const maxItems = Math.min(Math.max(Math.floor(args.sample ?? 250) || 250, 40), 500);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 10) || 10, 1), 30);
    const pages = [1, 2, 3, 4];
    const sampled = await sampleCatalog(maxItems, pages);
    const rows = sampled.map(({ source, p }) => slim(source.name, source.base, p));
    if (!rows.length) {
        return `No Dior listings came back from Fashionphile or Rebag across the first ${pages.length} catalogue pages of each.`;
    }
    const prices = rows.map((r) => r.price_usd).filter((n) => n !== null);
    const available = rows.filter((r) => r.available);
    const dated = rows.map((r) => ({ r, t: Date.parse(String(r.published_at ?? "")) })).filter((x) => Number.isFinite(x.t));
    const bySource = [...rows.reduce((m, r) => m.set(r.source, (m.get(r.source) ?? 0) + 1), new Map())];
    const under500 = prices.filter((p) => p < 500).length;
    const over3000 = prices.filter((p) => p >= 3000).length;
    const lines = [
        `Dior inventory: ${rows.length} listing(s) sampled from ${bySource.map(([s, n]) => `${s} ${n}`).join(" and ")}`,
        `${available.length} of ${rows.length} marked available (${((available.length / rows.length) * 100).toFixed(0)}%), ${rows.length - available.length} sold or unavailable`,
        prices.length
            ? `Price range ${usd(Math.min(...prices))} to ${usd(Math.max(...prices))}, median ${usd(median(prices))} across ${prices.length} priced listing(s)`
            : "No listing in this sample carried a price",
        `Below $500: ${under500} | at or above $3,000: ${over3000}`,
    ];
    if (dated.length) {
        const sorted = [...dated].sort((a, b) => b.t - a.t);
        const oldest = sorted[sorted.length - 1];
        lines.push(`Published dates run from ${new Date(oldest.t).toISOString().slice(0, 10)} to ${new Date(sorted[0].t).toISOString().slice(0, 10)} across ${dated.length} listing(s).`);
        lines.push("", "Most recently published:");
        for (const { r, t } of sorted.slice(0, limit)) {
            lines.push(`  ${new Date(t).toISOString().slice(0, 10)}  ${r.available ? "in stock " : "unavailable"}  ${usd(r.price_usd).padStart(9)}  ${r.source.padEnd(12)} ${r.title.slice(0, 56)}`);
        }
    }
    else {
        lines.push("", "No listing in this sample published a date, so recency cannot be reported.");
    }
    const byType = [...rows.reduce((m, r) => m.set(r.product_type || "(none)", (m.get(r.product_type || "(none)") ?? 0) + 1), new Map())]
        .sort((a, b) => b[1] - a[1]);
    lines.push("", "By product type as each site labels it:", ...byType.map(([t, n]) => `  ${t.padEnd(20)} ${n}`));
    lines.push("", "The two sites label the same kind of bag differently, so these counts are not directly comparable. Run source_coverage to see both vocabularies side by side.");
    return lines.join("\n");
}
