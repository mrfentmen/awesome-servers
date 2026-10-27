export class AvianneError extends Error {
    constructor(message) {
        super(message);
        this.name = "AvianneError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "mrfentmen-avianne-mcp/1.0 (https://github.com/mrfentmen)" };
const CATALOG = "https://avianneandco.com/products.json";
const SUGGEST = "https://avianneandco.com/search/suggest.json";
const PRODUCT_BASE = "https://avianneandco.com/products";
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
        throw new AvianneError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new AvianneError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
    return pretty({ store: "Avianne", query, returned: out.length, truncated: out.length >= n, listings: out });
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
    return pretty({ store: "Avianne", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
        store: "Avianne", ...sl, price_usd: dollar, variants, images,
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
        throw new AvianneError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
        store: "Avianne", currency: "USD", unpriced, sample: a.length,
        min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
        p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
        note: "Storefront asking prices. Not affiliated with Avianne.",
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
        throw new AvianneError("No available priced products found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const JUNK = /protection plan|warranty|gift card|shipping|handling fee|service plan/i;
    const deals = all
        .filter((s) => s.price_usd < median && !JUNK.test(s.title))
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        store: "Avianne", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals. Not affiliated with Avianne.",
    });
}
export async function listCategories() {
    const counts = {};
    for (const p of await sampleCatalog(500, [1, 2])) {
        const t = p.product_type || "unknown";
        counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "Avianne", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
}
// ---- batch-3 tools: collections + size search (2026-09-26) ----
function storeOrigin() {
    return new URL(CATALOG).origin;
}
// Variant titles are "<colour> / <size>" or "<size>", so a size matches the whole part
// or a part that starts with it: "18" matches "18 inches - 6.3 grams", "7" does not match
// "7.5". Compared case-insensitively.
function sizeMatches(part, want) {
    const p = part.trim().toLowerCase();
    return p === want || p.startsWith(`${want} `);
}
export async function listCollections(query) {
    const wanted = query ? query.trim().toLowerCase() : null;
    const rows = [];
    for (const page of [1, 2, 3]) {
        const data = await getJson(`${storeOrigin()}/collections.json?limit=250&page=${page}`);
        const list = Array.isArray(data.collections) ? data.collections : [];
        if (!list.length)
            break;
        for (const row of list) {
            const c = row;
            if (typeof c.title !== "string" || typeof c.handle !== "string")
                continue;
            if (wanted && !c.title.toLowerCase().includes(wanted))
                continue;
            rows.push({ title: c.title, handle: c.handle, store_products: typeof c.products_count === "number" ? c.products_count : null });
        }
    }
    return pretty({
        store: "Avianne", query: query ?? null, returned: rows.length,
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
        const data = await getJson(`${storeOrigin()}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`);
        const products = Array.isArray(data.products) ? data.products : [];
        if (!products.length)
            break;
        for (const p of products) {
            seen += 1;
            if (wantSize) {
                const variants = Array.isArray(p.variants) ? p.variants : [];
                const hit = variants.some((v) => v.available === true && parseParts(v.title).some((part) => sizeMatches(part, wantSize)));
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
        throw new AvianneError(`Collection '${handle}' returned no products. Check the handle with list_collections.`);
    return pretty({
        store: "Avianne", collection: handle, size: wantSize, scanned: seen,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_size(size, limit, maxPrice) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const want = String(size).trim().toLowerCase();
    const sample = await sampleCatalog(300, [1, 2, 3]);
    const out = [];
    const seenSizes = new Set();
    for (const p of sample) {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        for (const v of variants)
            for (const part of parseParts(v.title))
                seenSizes.add(part);
        const hit = variants.find((v) => v.available === true && parseParts(v.title).some((part) => sizeMatches(part, want)));
        if (!hit)
            continue;
        const sl = slim(p);
        if (mp !== undefined && (sl.price_usd === null || sl.price_usd > mp))
            continue;
        out.push({
            ...sl,
            matched_size: String(hit.title),
            size_price_usd: Number.isFinite(Number(hit.price)) ? Math.round(Number(hit.price) * 100) / 100 : null,
            in_stock_sizes: variants.filter((v) => v.available === true).map((v) => String(v.title)),
        });
    }
    if (!out.length) {
        const seen = [...seenSizes].slice(0, 40).join(", ");
        throw new AvianneError(`No in-stock variant matched size '${size}' in a ${sample.length}-product sample. Sizes seen: ${seen || "none"}.`);
    }
    return pretty({
        store: "Avianne", size: want, scanned: sample.length,
        returned: Math.min(out.length, n), listings: out.slice(0, n),
        note: "Availability and size come from the store's own variant stock flags.",
    });
}
// ---- muxC tools:
function cents(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n / 100 : null;
}
// ---- muxF tools:
function medianOf(values) {
    const a = [...values].sort((x, y) => x - y);
    if (!a.length)
        return null;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
function round2(n) {
    const v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
}
function skuHead(skus) {
    const clean = skus.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
    if (!clean.length)
        return null;
    const head = clean[0].split("-")[0];
    return clean.every((s) => s.split("-")[0] === head) ? head : null;
}
export async function variantDetail(handle) {
    const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`);
    if (!p || typeof p !== "object" || !Array.isArray(p.variants)) {
        throw new AvianneError(`No product json for handle '${handle}'. Check the handle with search_products or list_newest.`);
    }
    const options = (Array.isArray(p.options) ? p.options : [])
        .map((o) => (typeof o === "string" ? o : (o?.name ?? null)))
        .filter(Boolean);
    const variants = p.variants.map((v) => ({
        title: v.title,
        parts: parseParts(v.title),
        sku: v.sku ?? null,
        price_usd: round2(v.price),
        compare_at_usd: round2(v.compare_at_price),
        on_sale: v.compare_at_price !== null && v.compare_at_price !== undefined && Number(v.compare_at_price) > Number(v.price),
        available: v.available === true,
    }));
    const inStock = variants.filter((v) => v.available);
    return pretty({
        store: "Avianne",
        handle: p.handle ?? handle,
        title: p.title ?? null,
        product_type: p.product_type ?? null,
        url: `${PRODUCT_BASE}/${p.handle ?? handle}`,
        options,
        variant_count: variants.length,
        available_count: inStock.length,
        all_sold_out: variants.length > 0 && inStock.length === 0,
        sku_prefix: skuHead(variants.map((v) => v.sku)),
        variants,
        note: "Every variant with its own stock flag, sku and both prices, read from the store's own product json.",
    });
}
export async function catalogByPage(page, limit) {
    const pg = Math.max(Math.floor(Number(page ?? 1)) || 1, 1);
    const n = Math.min(Math.max(Math.floor(Number(limit ?? 50)) || 50, 1), 250);
    const data = await getJson(`${CATALOG}?limit=${n}&page=${pg}`);
    const products = Array.isArray(data.products) ? data.products : [];
    if (!products.length) {
        throw new AvianneError(`Page ${pg} returned no products. The catalog has fewer pages than that.`);
    }
    const listings = products.map((p) => slim(p));
    const prices = listings.map((s) => s.price_usd).filter((x) => typeof x === "number" && x > 0);
    return pretty({
        store: "Avianne",
        page: pg,
        per_page: n,
        returned: listings.length,
        available_count: listings.filter((s) => s.available).length,
        price_band_usd: prices.length ? { min: round2(Math.min(...prices)), median: round2(medianOf(prices)), max: round2(Math.max(...prices)) } : null,
        listings,
        note: "One catalog page read directly from the store's products json, in the store's own order rather than by publish date.",
    });
}
