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
const CATALOG = "https://noahny.com/products.json";
const SUGGEST = "https://noahny.com/search/suggest.json";
const PRODUCT_BASE = "https://noahny.com/products";
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
        return pretty({ store: "Noah NYC", query, returned: out.length, truncated: out.length >= n, listings: out });
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
        return pretty({ store: "Noah NYC", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
            store: "Noah NYC", ...sl, price_usd: dollar, variants, images,
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
            store: "Noah NYC", currency: "USD", unpriced, sample: a.length,
            min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
            p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
            note: "Storefront asking prices. Not affiliated with Noah NYC.",
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
            store: "Noah NYC", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
            deals: deals.slice(0, n),
            note: "Below-median asks, not appraisals. Not affiliated with Noah NYC.",
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
        return pretty({ store: "Noah NYC", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
    });
}
// ---- muxF tools:
const NY_SEASON = /\b(SS|FW|AW|SPR|FALL|WINTER|SPRING|SUMMER|AUTUMN)\s?(\d{2,4})\b/i;
const NY_DROP = /\b(?:drop|delivery|release)[-_ ]?(\d{4}[-_/]\d{2}(?:[-_/]\d{2})?|\d{1,2}[-_/]\d{4})\b/i;
const NY_DOT_DATE = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
const NY_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "OS", "ONE SIZE"];
function tagList(p) {
    const t = p?.tags;
    if (Array.isArray(t))
        return t.map((x) => String(x).trim()).filter(Boolean);
    return String(t ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}
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
// Drops are tagged either as ISO-ish strings or as the store's own MM.DD.YY.
function dropSortKey(code) {
    const iso = String(code).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso)
        return Number(`${iso[1]}${iso[2]}${iso[3]}`);
    const dot = String(code).match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (dot)
        return Number(`20${dot[3].length === 2 ? dot[3] : dot[3].slice(2)}${dot[1].padStart(2, "0")}${dot[2].padStart(2, "0")}`);
    const ym = String(code).match(/^(\d{4})-(\d{2})$/);
    if (ym)
        return Number(`${ym[1]}${ym[2]}00`);
    return 0;
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
export function seasonCalendarCensus(sample, limit) {
    const lim = Math.min(Number(limit ?? 12) || 12, 40);
    return catalogSample(sample, 600).then((products) => {
        const seasons = {};
        const drops = {};
        for (const p of products) {
            const s = slim(p);
            const price = s.price_usd === null ? null : s.price_usd;
            const tags = tagList(p);
            const seenSeasons = new Set();
            const seenDrops = new Set();
            for (const tag of tags) {
                const sm = tag.match(NY_SEASON);
                if (sm) {
                    const code = `${sm[1].toUpperCase()}${sm[2]}`;
                    if (!seenSeasons.has(code)) {
                        seenSeasons.add(code);
                        const row = (seasons[code] ??= { season: code, products: 0, available: 0, prices: [], types: {} });
                        row.products += 1;
                        if (s.available)
                            row.available += 1;
                        if (price !== null && price > 0)
                            row.prices.push(price);
                        const type = String(s.product_type || "unknown");
                        row.types[type] = (row.types[type] ?? 0) + 1;
                    }
                }
                const dm = tag.match(NY_DROP);
                if (dm || NY_DOT_DATE.test(tag)) {
                    const code = (dm ? dm[1] : tag).replace(/[_/]/g, "-");
                    if (!seenDrops.has(code)) {
                        seenDrops.add(code);
                        const row = (drops[code] ??= { date: code, products: 0, available: 0 });
                        row.products += 1;
                        if (s.available)
                            row.available += 1;
                    }
                }
            }
        }
        const seasonRows = Object.values(seasons)
            .sort((a, b) => b.products - a.products)
            .slice(0, lim)
            .map((r) => ({
            season: r.season,
            products: r.products,
            available: r.available,
            price_usd: r.prices.length
                ? { min: round2(Math.min(...r.prices)), median: round2(median(r.prices)), max: round2(Math.max(...r.prices)) }
                : null,
            main_type: topKey(r.types),
        }));
        const dropRows = Object.values(drops)
            .sort((a, b) => dropSortKey(b.date) - dropSortKey(a.date))
            .slice(0, lim);
        const untagged = products.filter((p) => !tagList(p).some((t) => NY_SEASON.test(t))).length;
        return pretty({
            store: "Noah NYC",
            sample: products.length,
            seasons_found: Object.keys(seasons).length,
            seasons: seasonRows,
            drops_found: Object.keys(drops).length,
            drops: dropRows,
            untagged_products: untagged,
            note: "Season and drop codes come from the store's own product tags; a product can carry several.",
        });
    });
}
export function colourSizeMatrix(sample, limit) {
    const lim = Math.min(Number(limit ?? 12) || 12, 30);
    return catalogSample(sample, 500).then((products) => {
        const sizes = {};
        const colours = {};
        let variantTotal = 0;
        for (const p of products) {
            const s = slim(p);
            const price = s.price_usd === null ? null : s.price_usd;
            const variants = Array.isArray(p.variants) ? p.variants : [];
            const coloursSeen = new Set();
            for (const v of variants) {
                variantTotal += 1;
                const parts = parseParts(v.title);
                const size = parts.find((x) => NY_SIZES.includes(x.toUpperCase())) ?? null;
                const colour = parts.filter((x) => x !== size).join(" / ") || null;
                const unit = {
                    available: Boolean(v.available),
                    price: Number.isFinite(Number(v.price)) ? Number(v.price) : price,
                };
                const key = size ?? "one size";
                const srow = (sizes[key] ??= { size: key, units: 0, in_stock: 0, prices: [] });
                srow.units += 1;
                if (unit.available)
                    srow.in_stock += 1;
                if (unit.price !== null && Number.isFinite(unit.price) && unit.price > 0)
                    srow.prices.push(unit.price);
                if (colour) {
                    const crow = (colours[colour] ??= { colorway: colour, products: new Set(), units: 0, sizes_in_stock: new Set(), sizes_seen: new Set() });
                    crow.products.add(p.id ?? p.handle);
                    crow.units += 1;
                    if (size)
                        crow.sizes_seen.add(size);
                    if (unit.available && size)
                        crow.sizes_in_stock.add(size);
                    coloursSeen.add(colour);
                }
            }
        }
        const order = (a, b) => NY_SIZES.indexOf(a.size.toUpperCase()) - NY_SIZES.indexOf(b.size.toUpperCase());
        const sizeRows = Object.values(sizes)
            .map((r) => ({
            size: r.size,
            units: r.units,
            in_stock_pct: r.units ? Math.round((r.in_stock / r.units) * 1000) / 10 : 0,
            median_usd: round2(median(r.prices)),
        }))
            .sort(order);
        const colourRows = Object.values(colours)
            .map((r) => ({
            colorway: r.colorway,
            products: r.products.size,
            units: r.units,
            sizes_in_stock: r.sizes_in_stock.size,
            sizes_total: r.sizes_seen.size,
        }))
            .sort((a, b) => b.products - a.products)
            .slice(0, lim);
        if (!variantTotal)
            throw new StoreError("No variants found in the catalog sample.");
        return pretty({
            store: "Noah NYC",
            sample: products.length,
            variants: variantTotal,
            sizes: sizeRows,
            colorways_found: Object.keys(colours).length,
            colorways: colourRows,
            note: "Size and colourway come from each variant's own title; a size is 'in stock' when at least one variant of it can be bought.",
        });
    });
}
