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
const CATALOG = "https://jacquesmariemage.com/products.json";
const SUGGEST = "https://jacquesmariemage.com/search/suggest.json";
const PRODUCT_BASE = "https://jacquesmariemage.com/products";
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
        return pretty({ store: "Jacques Marie Mage", query, returned: out.length, truncated: out.length >= n, listings: out });
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
        return pretty({ store: "Jacques Marie Mage", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
            store: "Jacques Marie Mage", ...sl, price_usd: dollar, variants, images,
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
            store: "Jacques Marie Mage", currency: "USD", unpriced, sample: a.length,
            min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
            p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
            note: "Storefront asking prices. Not affiliated with Jacques Marie Mage.",
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
            store: "Jacques Marie Mage", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
            deals: deals.slice(0, n),
            note: "Below-median asks, not appraisals. Not affiliated with Jacques Marie Mage.",
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
        return pretty({ store: "Jacques Marie Mage", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
    });
}
// ---- muxG tools:
// The frame colour is the first token of a "CODE-NAME / LENS" option value.
const JM_TITLE_SPLIT = /\s+[-–—]\s+/;
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
    const max = Math.min(Number(n ?? cap) || cap, 1500);
    const pages = [];
    for (let i = 1; i <= Math.ceil(max / 250); i++)
        pages.push(i);
    return sampleCatalog(max, pages);
}
// A variant title reads "CODE-NAME / LENS"; the colour is the first token of
// the part before the slash and the lens is whatever follows it.
function readCode(variant) {
    const parts = parseParts(variant?.title);
    if (parts.length < 2)
        return null;
    const lens = parts[parts.length - 1].trim();
    const code = parts.slice(0, -1).join(" / ").trim();
    const colour = code.split(/\s+/)[0] || null;
    return { lens: lens || null, colour: colour || null, code: code || null };
}
function variantPrice(v) {
    const n = Number(v?.price);
    return Number.isFinite(n) && n > 0 ? n : null;
}
// The label after the slash mixes colour into the lens name ("ORANGE CR39"),
// so a lens type is the technology words it contains, not the whole label.
const LENS_TECH = [
    ["CR39", /\bCR-?39\b/],
    ["POLARIZED", /\bPOLARI[SZ]ED\b/],
    ["PRESCRIPTION", /\b(PRESCRIPTION|RX)\b/],
    ["PHOTOCHROMIC", /\bPHOTOCHROMIC\b/],
    ["MIRROR", /\bMIRROR(ED)?\b/],
    ["BLUE LIGHT", /\bBLUE[- ]?LIGHT\b/],
    ["DEMO LENS", /\bDEMO\b/],
];
function lensTypeOf(label) {
    const up = String(label ?? "").toUpperCase();
    const hits = LENS_TECH.filter(([, re]) => re.test(up)).map(([name]) => name);
    if (hits.length)
        return hits.join(" + ");
    const words = up.split(/\s+/).filter(Boolean);
    return words.length ? words[words.length - 1] : "unspecified";
}
export function lensMatrix(sample, limit) {
    const lim = Math.min(Number(limit ?? 12) || 12, 30);
    return catalogSample(sample, 300).then((products) => {
        const lenses = {};
        const colours = new Set();
        const prices = [];
        let variantTotal = 0;
        let unparsed = 0;
        for (const p of products) {
            const variants = Array.isArray(p.variants) ? p.variants : [];
            for (const v of variants) {
                variantTotal += 1;
                const price = variantPrice(v);
                if (price !== null)
                    prices.push(price);
                const code = readCode(v);
                if (!code || !code.lens) {
                    unparsed += 1;
                    continue;
                }
                if (code.colour)
                    colours.add(code.colour);
                const type = lensTypeOf(code.lens);
                const row = (lenses[type] ??= { lens: type, labels: new Set(), variants: 0, products: new Set(), prices: [] });
                row.labels.add(code.lens);
                row.variants += 1;
                row.products.add(p.id ?? p.handle);
                if (price !== null)
                    row.prices.push(price);
            }
        }
        if (!variantTotal)
            throw new StoreError("No variants found in the catalog sample.");
        const rows = Object.values(lenses)
            .map((r) => ({
            lens: r.lens,
            variants: r.variants,
            products: r.products.size,
            labels_merged: r.labels.size,
            median_usd: round2(median(r.prices)),
        }))
            .sort((a, b) => b.variants - a.variants)
            .slice(0, lim);
        if (!rows.length)
            throw new StoreError("No lens type could be read from the variant titles in this sample.");
        return pretty({
            store: "Jacques Marie Mage",
            sample: products.length,
            variants: variantTotal,
            lens_types_found: Object.keys(lenses).length,
            lens_types: rows,
            colourways_found: colours.size,
            price_usd: prices.length
                ? { min: round2(Math.min(...prices)), median: round2(median(prices)), max: round2(Math.max(...prices)) }
                : null,
            variants_without_lens: unparsed,
            note: "Lens type is the technology named in each variant's own lens label (CR39, polarised, prescription and so on); labels_merged counts how many colour-specific labels collapsed into one type.",
        });
    });
}
export function modelFamilies(sample, limit) {
    const lim = Math.min(Number(limit ?? 15) || 15, 40);
    return catalogSample(sample, 300).then((products) => {
        const families = {};
        for (const p of products) {
            const title = String(p.title ?? "").trim();
            if (!title)
                continue;
            const family = title.split(JM_TITLE_SPLIT)[0].trim() || title;
            const row = (families[family] ??= { family, products: 0, colours: new Set(), handles: [], prices: [], newest: null });
            row.products += 1;
            if (row.handles.length < 3 && p.handle)
                row.handles.push(String(p.handle));
            if (p.published_at && String(p.published_at) > String(row.newest ?? ""))
                row.newest = p.published_at;
            const variants = Array.isArray(p.variants) ? p.variants : [];
            for (const v of variants) {
                const code = readCode(v);
                if (code?.colour)
                    row.colours.add(code.colour);
                const price = variantPrice(v);
                if (price !== null)
                    row.prices.push(price);
            }
        }
        if (!Object.keys(families).length)
            throw new StoreError("No titled products in the catalog sample.");
        const rows = Object.values(families)
            .map((r) => ({
            family: r.family,
            products: r.products,
            colourways: r.colours.size,
            from_price_usd: r.prices.length ? round2(Math.min(...r.prices)) : null,
            newest_listing: r.newest,
            example_handles: r.handles,
        }))
            .sort((a, b) => b.products - a.products || a.family.localeCompare(b.family))
            .slice(0, lim);
        return pretty({
            store: "Jacques Marie Mage",
            sample: products.length,
            families_found: Object.keys(families).length,
            families: rows,
            note: "A family is the product title up to its first dash; colourways count the distinct frame codes sold inside it.",
        });
    });
}
