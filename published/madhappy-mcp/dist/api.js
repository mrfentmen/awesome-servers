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
const CATALOG = "https://madhappy.com/products.json";
const SUGGEST = "https://madhappy.com/search/suggest.json";
const PRODUCT_BASE = "https://madhappy.com/products";
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
        return pretty({ store: "Madhappy", query, returned: out.length, truncated: out.length >= n, listings: out });
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
        return pretty({ store: "Madhappy", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
            store: "Madhappy", ...sl, price_usd: dollar, variants, images,
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
            store: "Madhappy", currency: "USD", unpriced, sample: a.length,
            min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
            p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
            note: "Storefront asking prices. Not affiliated with Madhappy.",
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
            store: "Madhappy", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
            deals: deals.slice(0, n),
            note: "Below-median asks, not appraisals. Not affiliated with Madhappy.",
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
        return pretty({ store: "Madhappy", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
    });
}
// ---- muxF tools:
const MAD_SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const MAD_SIZE_SET = new Set([...MAD_SIZE_ORDER, "OS", "ONE SIZE"]);
function median(nums) {
    const a = [...nums].sort((x, y) => x - y);
    if (!a.length)
        return null;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
function round2(n) {
    return n === null ? null : Math.round(n * 100) / 100;
}
function catalogSample(n, cap) {
    const max = Math.min(Number(n ?? cap) || cap, 1000);
    const pages = [];
    for (let i = 1; i <= Math.ceil(max / 250); i++)
        pages.push(i);
    return sampleCatalog(max, pages);
}
function variantPrice(v) {
    const n = Number(v?.price);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function topKey(counts) {
    let best = null;
    let bestN = -1;
    for (const [k, v] of Object.entries(counts)) {
        if (v > bestN) {
            best = k;
            bestN = v;
        }
    }
    return best;
}
// Split a variant title into its size token and whatever else it names.
function readVariant(variant) {
    const parts = parseParts(variant?.title);
    const size = parts.find((x) => MAD_SIZE_SET.has(x.toUpperCase())) ?? null;
    const colour = parts.filter((x) => x !== size).join(" / ") || null;
    return { size, colour };
}
export function colorwayCensus(sample, limit) {
    const lim = Math.min(Number(limit ?? 15) || 15, 40);
    return catalogSample(sample, 500).then((products) => {
        const colours = {};
        let units = 0;
        for (const p of products) {
            const type = String(p.product_type || "unknown");
            const variants = Array.isArray(p.variants) ? p.variants : [];
            for (const v of variants) {
                units += 1;
                const { colour } = readVariant(v);
                if (!colour)
                    continue;
                const row = (colours[colour] ??= {
                    colorway: colour, products: new Set(), units: 0, sold_out: 0,
                    prices: [], types: {},
                });
                row.products.add(p.id ?? p.handle);
                row.units += 1;
                if (!v.available)
                    row.sold_out += 1;
                row.types[type] = (row.types[type] ?? 0) + 1;
                const price = variantPrice(v);
                if (price !== null)
                    row.prices.push(price);
            }
        }
        if (!units)
            throw new StoreError("No variants found in the catalog sample.");
        const rows = Object.values(colours)
            .map((r) => ({
            colorway: r.colorway,
            products: r.products.size,
            units: r.units,
            sold_out: r.sold_out,
            sold_out_pct: r.units ? Math.round((r.sold_out / r.units) * 1000) / 10 : 0,
            price_usd: r.prices.length
                ? { min: round2(Math.min(...r.prices)), median: round2(median(r.prices)), max: round2(Math.max(...r.prices)) }
                : null,
            main_type: topKey(r.types),
        }))
            .sort((a, b) => b.products - a.products || b.units - a.units)
            .slice(0, lim);
        if (!rows.length)
            throw new StoreError("No colourway could be read from the variant titles in this sample.");
        return pretty({
            store: "Madhappy",
            sample: products.length,
            variants: units,
            colorways_found: Object.keys(colours).length,
            colorways: rows,
            note: "A colourway is whatever a variant title names besides its size; sold-out counts variants that cannot be bought.",
        });
    });
}
export function sizeRunAvailability(sample, limit) {
    const lim = Math.min(Number(limit ?? 10) || 10, 25);
    return catalogSample(sample, 400).then((products) => {
        const sizes = {};
        const runs = [];
        let sized = 0;
        for (const p of products) {
            const variants = Array.isArray(p.variants) ? p.variants : [];
            const run = new Map();
            for (const v of variants) {
                const { size } = readVariant(v);
                if (!size)
                    continue;
                sized += 1;
                const row = (sizes[size] ??= { size, units: 0, in_stock: 0, prices: [] });
                row.units += 1;
                if (v.available)
                    row.in_stock += 1;
                const price = variantPrice(v);
                if (price !== null)
                    row.prices.push(price);
                const prev = run.get(size) ?? { total: 0, available: 0 };
                prev.total += 1;
                if (v.available)
                    prev.available += 1;
                run.set(size, prev);
            }
            if (!run.size)
                continue;
            const left = [...run.entries()]
                .filter(([, s]) => s.available > 0)
                .map(([size]) => size);
            runs.push({
                title: String(p.title ?? ""),
                handle: String(p.handle ?? ""),
                sizes_total: run.size,
                sizes_available: left.length,
                remaining_sizes: left,
                sold_out_sizes: [...run.keys()].filter((s) => !left.includes(s)),
            });
        }
        if (!sized)
            throw new StoreError("No sized variants found in the catalog sample.");
        const order = (a, b) => MAD_SIZE_ORDER.indexOf(a.size.toUpperCase()) - MAD_SIZE_ORDER.indexOf(b.size.toUpperCase());
        const sizeRows = Object.values(sizes)
            .map((r) => ({
            size: r.size,
            units: r.units,
            in_stock_pct: r.units ? Math.round((r.in_stock / r.units) * 1000) / 10 : 0,
            median_usd: round2(median(r.prices)),
        }))
            .sort(order);
        const thinnest = runs
            .filter((r) => r.sizes_total > 1)
            .sort((a, b) => a.sizes_available - b.sizes_available || a.sizes_total - b.sizes_total)
            .slice(0, lim);
        return pretty({
            store: "Madhappy",
            sample: products.length,
            sized_variants: sized,
            products_with_sizes: runs.length,
            sold_out_products: runs.filter((r) => r.sizes_available === 0).length,
            sizes: sizeRows,
            thinnest_runs: thinnest,
            note: "In-stock share counts sized variants that can be bought; thinnest runs are products down to the fewest sizes left.",
        });
    });
}
