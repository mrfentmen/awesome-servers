export class StoreError extends Error {
    constructor(message) {
        super(message);
        this.name = "StoreError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://missoma.com/products.json";
const SUGGEST = "https://missoma.com/search/suggest.json";
const PRODUCT_BASE = "https://missoma.com/products";
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
        throw new StoreError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new StoreError(`HTTP ${res.status} for ${new URL(url).hostname}`);
    return res.json();
}
function slim(p, cents = false) {
    const variants = (Array.isArray(p.variants) ? p.variants : []);
    const varPrices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
    const topPrice = Number(p.price ?? p.price_min);
    const raw = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : []);
    const prices = cents ? raw.map((x) => Math.round(x) / 100) : raw;
    const images = (Array.isArray(p.images) ? p.images : []);
    const img0 = images.length ? images[0] : null;
    const imgSrc = typeof img0 === "string" ? img0 : (img0?.src ?? null);
    return {
        id: p.id,
        title: String(p.title ?? ""),
        handle: String(p.handle ?? ""),
        vendor: String(p.vendor ?? ""),
        product_type: String(p.product_type ?? ""),
        price_usd: prices.length ? Math.min(...prices) : null,
        available: variants.some((v) => v.available) || p.available === true,
        url: `${PRODUCT_BASE}/${String(p.handle ?? "")}`,
        image: imgSrc,
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
        catch { /* page failed */
        }
    }
    return out;
}
function parseParts(title) {
    return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean);
}
export function searchProducts(query, limit, maxPrice, productType) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    return getJson(`${SUGGEST}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`).then((data) => {
        const d = data;
        const products = d?.resources?.results?.products ?? [];
        const out = [];
        for (const p of products) {
            const sl = slim(p);
            if (passes(sl, mp, productType))
                out.push(sl);
            if (out.length >= n)
                break;
        }
        return pretty({ store: "Missoma", query, returned: out.length, truncated: out.length >= n, listings: out });
    });
}
export function listNewest(limit, page, productType) {
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const pg = Math.max(Number(page ?? 1) || 1, 1);
    return catalogPage(pg).then((products) => {
        const out = [];
        for (const p of products) {
            const sl = slim(p);
            if (sl.product_type && (!productType || sl.product_type.toLowerCase().includes(productType.toLowerCase())))
                out.push(sl);
        }
        out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
        return pretty({ store: "Missoma", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
    });
}
export function getProduct(handle) {
    return getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`).then((p) => {
        const prod = p;
        const sl = slim(prod, true);
        const variants = (Array.isArray(prod.variants) ? prod.variants : []).map((v) => ({
            title: v.title, parts: parseParts(v.title),
            price_usd: Math.round(Number(v.price)) / 100,
            compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
            available: v.available,
        }));
        const images = (Array.isArray(prod.images) ? prod.images : []).map((i) => typeof i === "string" ? i : i.src).filter(Boolean);
        const html = typeof prod.body_html === "string" ? prod.body_html : (typeof prod.description === "string" ? prod.description : "");
        const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : (sl.price_usd !== null ? Math.round(sl.price_usd) / 100 : null);
        return pretty({
            store: "Missoma", ...sl, price_usd: dollar, variants, images,
            description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
            tags: prod.tags,
        });
    });
}
export function priceOverview(limit) {
    const n = Math.min(Number(limit ?? 200) || 200, 500);
    return sampleCatalog(n, [1, 2, 3]).then((products) => {
        const prices = [];
        let unpriced = 0;
        for (const p of products) {
            const sl = slim(p);
            if (sl.price_usd === null || sl.price_usd <= 0)
                unpriced += 1;
            else
                prices.push(sl.price_usd);
        }
        if (!prices.length)
            throw new StoreError("No priced products found.");
        const a = [...prices].sort((x, y) => x - y);
        const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
        return pretty({
            store: "Missoma", currency: "USD", unpriced, sample: a.length,
            min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
            p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
            note: "Storefront asking prices. Not affiliated with Missoma.",
        });
    });
}
export function findDeals(limit, sample) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const per = Math.min(Number(sample ?? 200) || 200, 500);
    return sampleCatalog(per, [1, 2, 3]).then((products) => {
        const all = [];
        for (const p of products) {
            const sl = slim(p);
            if (sl.price_usd !== null && sl.price_usd > 0 && sl.available)
                all.push(sl);
        }
        if (!all.length)
            throw new StoreError("No available priced products found.");
        const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
        const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
        const JUNK = /protection plan|warranty|gift card|shipping|handling fee|service plan/i;
        const deals = all
            .filter((s) => s.price_usd < median && !JUNK.test(s.title))
            .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
            .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
        return pretty({
            store: "Missoma", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
            deals: deals.slice(0, n),
            note: "Below-median asks, not appraisals. Not affiliated with Missoma.",
        });
    });
}
export function listCategories() {
    return sampleCatalog(500, [1, 2]).then((products) => {
        const counts = {};
        for (const p of products) {
            const t = String(p.product_type || "unknown");
            counts[t] = (counts[t] ?? 0) + 1;
        }
        return pretty({ store: "Missoma", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
    });
}
// ---- muxF tools:
const MS_TAG_LIMIT = 18;
function msTagList(p) {
    const t = p?.tags;
    if (Array.isArray(t))
        return t.map((x) => String(x).trim()).filter(Boolean);
    return String(t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}
function msMedian(nums) {
    const a = [...nums].sort((x, y) => x - y);
    if (!a.length)
        return null;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
function msRound(n) {
    return n === null ? null : Math.round(n * 100) / 100;
}
function msBand(prices) {
    if (!prices.length)
        return null;
    return { min: msRound(Math.min(...prices)), median: msRound(msMedian(prices)), max: msRound(Math.max(...prices)) };
}
async function msSample(n, cap) {
    const max = Math.min(Number(n ?? cap) || cap, 1000);
    const pages = [];
    for (let i = 1; i <= Math.ceil(max / 250); i++)
        pages.push(i);
    return sampleCatalog(max, pages);
}
/**
 * The facets the storefront filters on, read from the store's own colon-prefixed
 * tags (Facet: Value) rather than from product_type, which only names the garment.
 */
export async function tagTaxonomyCensus(sample, limit) {
    const lim = Math.min(Number(limit ?? 8) || 8, MS_TAG_LIMIT);
    const products = await msSample(sample, 600);
    const facets = {};
    for (const p of products) {
        const s = slim(p);
        const price = s.price_usd;
        const seen = new Set();
        for (const tag of msTagList(p)) {
            const at = tag.indexOf(":");
            if (at <= 0 || at === tag.length - 1)
                continue;
            const facet = tag.slice(0, at).trim();
            const value = tag.slice(at + 1).trim();
            if (!facet || !value || seen.has(tag))
                continue;
            seen.add(tag);
            const f = (facets[facet] ??= { facet, products: 0, values: {} });
            f.products += 1;
            const v = (f.values[value] ??= { value, products: 0, available: 0, prices: [] });
            v.products += 1;
            if (s.available)
                v.available += 1;
            if (Number.isFinite(price) && price > 0)
                v.prices.push(price);
        }
    }
    if (!Object.keys(facets).length)
        throw new StoreError("No colon-prefixed tag facets found in the catalog sample.");
    const rows = Object.values(facets)
        .sort((a, b) => b.products - a.products)
        .map((f) => ({
        facet: f.facet,
        values_found: Object.keys(f.values).length,
        values: Object.values(f.values)
            .sort((a, b) => b.products - a.products)
            .slice(0, lim)
            .map((v) => ({
            value: v.value,
            products: v.products,
            available: v.available,
            price_usd: msBand(v.prices),
        })),
    }));
    return pretty({
        store: "Missoma",
        sample: products.length,
        facets_found: rows.length,
        facets: rows,
        note: "Facets are the store's own colon-prefixed tags (Facet: Value); values per facet are capped, values_found counts them all.",
    });
}
/**
 * What each product option actually offers: products, units, stock rate and
 * median price per value, read from the variant option fields the store publishes.
 */
export async function optionVariantMatrix(sample, limit) {
    const lim = Math.min(Number(limit ?? 10) || 10, 30);
    const products = await msSample(sample, 500);
    const options = {};
    let variantTotal = 0;
    for (const p of products) {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const opts = Array.isArray(p.options) ? p.options : [];
        variantTotal += variants.length;
        for (let i = 0; i < opts.length; i += 1) {
            const name = String(opts[i]?.name ?? `option ${i + 1}`).trim() || `option ${i + 1}`;
            const row = (options[name] ??= { option: name, values: {} });
            for (const v of variants) {
                const value = String(v[`option${i + 1}`] ?? "").trim();
                if (!value)
                    continue;
                const cell = (row.values[value] ??= { value, products: new Set(), units: 0, inStock: 0, prices: [] });
                cell.products.add(p.id ?? p.handle);
                cell.units += 1;
                if (v.available)
                    cell.inStock += 1;
                const price = Number(v.price);
                if (Number.isFinite(price) && price > 0)
                    cell.prices.push(price);
            }
        }
    }
    if (!variantTotal)
        throw new StoreError("No variants found in the catalog sample.");
    const rows = Object.values(options)
        .filter((r) => Object.keys(r.values).length)
        .sort((a, b) => Object.keys(b.values).length - Object.keys(a.values).length)
        .map((r) => ({
        option: r.option,
        values_found: Object.keys(r.values).length,
        values: Object.values(r.values)
            .sort((a, b) => b.units - a.units)
            .slice(0, lim)
            .map((c) => ({
            value: c.value,
            products: c.products.size,
            units: c.units,
            in_stock_pct: c.units ? Math.round((c.inStock / c.units) * 1000) / 10 : 0,
            median_usd: msRound(msMedian(c.prices)),
        })),
    }));
    return pretty({
        store: "Missoma",
        sample: products.length,
        variants: variantTotal,
        options: rows,
        note: "Options are read from the variant option fields (option1..option3); a product counts once per value, units count every variant.",
    });
}
