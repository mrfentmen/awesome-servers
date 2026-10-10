export class IfAndCoError extends Error {
    constructor(message) {
        super(message);
        this.name = "IfAndCoError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://ifandco.com/products.json";
const SUGGEST = "https://ifandco.com/search/suggest.json";
const PRODUCT_BASE = "https://ifandco.com/products";
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
        throw new IfAndCoError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new IfAndCoError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
    return pretty({ store: "IF & Co.", query, returned: out.length, truncated: out.length >= n, listings: out });
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
    return pretty({ store: "IF & Co.", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
        store: "IF & Co.", ...sl, price_usd: dollar, variants, images,
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
        throw new IfAndCoError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
        store: "IF & Co.", currency: "USD", unpriced, sample: a.length,
        min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
        p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
        note: "Storefront asking prices. Not affiliated with IF & Co..",
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
        throw new IfAndCoError("No available priced products found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const JUNK = /protection plan|warranty|gift card|shipping|handling fee|service plan/i;
    const deals = all
        .filter((s) => s.price_usd < median && !JUNK.test(s.title))
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        store: "IF & Co.", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals. Not affiliated with IF & Co..",
    });
}
export async function listCategories() {
    const counts = {};
    for (const p of await sampleCatalog(500, [1, 2])) {
        const t = p.product_type || "unknown";
        counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "IF & Co.", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
}
// ---- batch-4 tools: collections and stock (2026-09-27) ----
const COLLECTIONS = "https://ifandco.com/collections";
export async function listCollections(limit) {
    const n = Math.min(Number(limit ?? 40) || 40, 250);
    const data = await getJson(`${COLLECTIONS}.json`);
    const rows = (Array.isArray(data.collections) ? data.collections : [])
        .filter((c) => typeof c?.handle === "string" && c.handle)
        .map((c) => ({
        title: String(c.title ?? c.handle),
        handle: c.handle,
        products_count: typeof c.products_count === "number" ? c.products_count : null,
        url: `${COLLECTIONS}/${c.handle}`,
    }))
        .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0));
    if (!rows.length)
        throw new IfAndCoError("The store returned no collections.");
    return pretty({
        store: "IF & Co.", collections: rows.length, returned: Math.min(rows.length, n),
        listings: rows.slice(0, n),
        note: "Longest collections first; call collection_products with a handle.",
    });
}
export async function collectionProducts(handle, limit, sort) {
    const clean = String(handle ?? "").trim();
    if (!clean)
        throw new IfAndCoError("Provide a collection handle - call list_collections first.");
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const data = await getJson(`${COLLECTIONS}/${encodeURIComponent(clean)}/products.json?limit=250`);
    const items = Array.isArray(data.products) ? data.products : [];
    if (!items.length)
        throw new IfAndCoError(`Collection "${clean}" is empty or unknown - call list_collections.`);
    const rows = items.map((p) => slim(p));
    const order = String(sort ?? "featured").toLowerCase();
    if (order === "price_low")
        rows.sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity));
    else if (order === "price_high")
        rows.sort((a, b) => (b.price_usd ?? -Infinity) - (a.price_usd ?? -Infinity));
    else if (order === "newest")
        rows.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    const inStock = rows.filter((r) => r.available).length;
    const priced = rows.map((r) => r.price_usd).filter((p) => p !== null);
    return pretty({
        store: "IF & Co.", collection: clean, sort: order, products: rows.length, in_stock: inStock,
        price_usd: priced.length ? { min: Math.min(...priced), max: Math.max(...priced) } : null,
        returned: Math.min(rows.length, n), listings: rows.slice(0, n),
    });
}
export async function restockCheck(handles) {
    const list = String(handles ?? "")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
    if (!list.length)
        throw new IfAndCoError("Provide up to 10 product handles, comma separated.");
    const rows = [];
    const problems = [];
    // One handle at a time: the storefront rejects bursts of .js requests.
    for (const h of list) {
        try {
            const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(h)}.js`);
            const variants = Array.isArray(p.variants) ? p.variants : [];
            const live = variants.filter((v) => v.available === true);
            const prices = variants.map((v) => Math.round(Number(v.price)) / 100).filter((n) => Number.isFinite(n) && n > 0);
            rows.push({
                handle: h,
                title: p.title ?? h,
                in_stock: live.length > 0,
                variants: variants.length,
                variants_in_stock: live.length,
                min_price_usd: prices.length ? Math.min(...prices) : null,
                options_in_stock: live.slice(0, 6).map((v) => String(v.title ?? "").trim()).filter(Boolean),
                url: `${PRODUCT_BASE}/${h}`,
            });
        }
        catch (e) {
            problems.push(`${h}: ${errorMessage(e)}`);
        }
    }
    if (!rows.length)
        throw new IfAndCoError(`No handle could be read. ${problems.join("; ")}`);
    return pretty({
        store: "IF & Co.", checked: rows.length, in_stock: rows.filter((r) => r.in_stock).length,
        listings: rows, problems,
        note: "Availability is the storefront's own flag, read at request time.",
    });
}
// ---- muxG tools:
const IFCO_PAGES = [1, 2, 3, 4];
// The catalogue states its material in the title and in the variant titles,
// so a census over that text is a census over what the house actually sells.
const MATERIALS = [
    { key: "14k-gold", label: "14k gold", pattern: /\b14k\b|\b14 carat\b/i },
    { key: "18k-gold", label: "18k gold", pattern: /\b18k\b|\b18 carat\b/i },
    { key: "solid-gold", label: "solid gold (unqualified karat)", pattern: /\bsolid gold\b/i },
    { key: "sterling", label: "sterling silver / 925", pattern: /\b925\b|\bsterling\b/i },
    { key: "platinum", label: "platinum", pattern: /\bplatinum\b|\bplat\b/i },
    { key: "vermeil", label: "vermeil", pattern: /\bvermeil\b/i },
    { key: "gold-filled", label: "gold filled", pattern: /\bgold[- ]filled\b/i },
    { key: "diamond", label: "diamond", pattern: /\bdiamond(s)?\b/i },
    { key: "lab-diamond", label: "lab grown or lab created diamond", pattern: /\blab[- ](grown|created)\b/i },
    { key: "sapphire", label: "sapphire", pattern: /\bsapphire(s)?\b/i },
    { key: "emerald", label: "emerald", pattern: /\bemerald(s)?\b/i },
    { key: "ruby", label: "ruby", pattern: /\bruby\b|\brubies\b/i },
    { key: "pearl", label: "pearl", pattern: /\bpearl(s)?\b/i },
    { key: "morganite", label: "morganite", pattern: /\bmorganite\b/i },
    { key: "moissanite", label: "moissanite", pattern: /\bmoissanite\b/i },
    { key: "turquoise", label: "turquoise", pattern: /\bturquoise\b/i },
    { key: "onyx", label: "onyx", pattern: /\bonyx\b/i },
];
const PERSONALISATION = [
    { key: "engraving", label: "engraving mentioned", pattern: /\bengrav/i },
    { key: "initial", label: "initial or letter", pattern: /\binitial(s)?\b|\bletter(s)?\b|\bmonogram/i },
    { key: "birthstone", label: "birthstone", pattern: /\bbirthstone\b/i },
    { key: "custom-size", label: "custom or made to order sizing", pattern: /\bmade to order\b|\bcustom size\b|\bsize guide\b/i },
    { key: "gift-box", label: "gift packaging", pattern: /\bgift box\b|\bgift packaging\b/i },
    { key: "stackable", label: "stackable", pattern: /\bstackable\b/i },
    { key: "hypoallergenic", label: "hypoallergenic", pattern: /\bhypoallergenic\b|\bnickel[- ]free\b/i },
    { key: "waterproof", label: "waterproof", pattern: /\bwaterproof\b|\bwater[- ]resistant\b/i },
];
const stripHtml = (html) => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
const ifcoMedian = (values) => {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
function censusOver(products, terms, textOf) {
    const out = terms.map((term) => ({ label: term.label, products: new Set(), prices: [] }));
    for (const product of products) {
        const handle = String(product.handle ?? product.id ?? "?");
        const text = textOf(product);
        for (const [i, term] of terms.entries()) {
            if (!term.pattern.test(text))
                continue;
            out[i].products.add(handle);
            const variantPrices = (Array.isArray(product.variants) ? product.variants : [])
                .map((variant) => Math.round(Number(variant?.price)))
                .filter((price) => Number.isFinite(price) && price > 0);
            const top = Math.round(Number(product.price));
            if (variantPrices.length)
                out[i].prices.push(...variantPrices);
            else if (Number.isFinite(top) && top > 0)
                out[i].prices.push(top);
        }
    }
    return out;
}
const censusLines = (rows, total, unit, n) => {
    const lines = [`${total} product(s) scanned, matches are per listing and a listing can carry several`, ""];
    for (const row of rows.filter((entry) => entry.products.size).sort((a, b) => b.products.size - a.products.size).slice(0, n)) {
        const median = ifcoMedian(row.prices);
        const share = ((row.products.size / Math.max(total, 1)) * 100).toFixed(1);
        lines.push(`  ${row.label}: ${row.products.size} listing(s) (${share}%) · ${row.prices.length} priced ${unit} · median ${median === null ? "not reported" : `$${median.toLocaleString("en-US")}`}`);
    }
    const missing = rows.filter((entry) => !entry.products.size).map((entry) => entry.label);
    if (missing.length)
        lines.push(`  not found in the sample: ${missing.join(", ")}`);
    return lines;
};
