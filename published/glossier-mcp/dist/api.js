export class GlossierError extends Error {
    constructor(message) {
        super(message);
        this.name = "GlossierError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://www.glossier.com/products.json";
const SUGGEST = "https://www.glossier.com/search/suggest.json";
const PRODUCT_BASE = "https://www.glossier.com/products";
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
        throw new GlossierError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new GlossierError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
    return pretty({ store: "Glossier", query, returned: out.length, truncated: out.length >= n, listings: out });
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
    return pretty({ store: "Glossier", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
        store: "Glossier", ...sl, price_usd: dollar, variants, images,
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
        throw new GlossierError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
        store: "Glossier", currency: "USD", unpriced, sample: a.length,
        min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
        p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
        note: "Storefront asking prices. Not affiliated with Glossier.",
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
        throw new GlossierError("No available priced products found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        store: "Glossier", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals. Not affiliated with Glossier.",
    });
}
export async function listCategories() {
    const counts = {};
    for (const p of await sampleCatalog(500, [1, 2])) {
        const t = p.product_type || "unknown";
        counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "Glossier", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
}
// ---- batch-4 tools: collections and stock (2026-09-27) ----
const COLLECTIONS = "https://www.glossier.com/collections";
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
        throw new GlossierError("The store returned no collections.");
    return pretty({
        store: "Glossier", collections: rows.length, returned: Math.min(rows.length, n),
        listings: rows.slice(0, n),
        note: "Longest collections first; call collection_products with a handle.",
    });
}
export async function collectionProducts(handle, limit, sort) {
    const clean = String(handle ?? "").trim();
    if (!clean)
        throw new GlossierError("Provide a collection handle - call list_collections first.");
    const n = Math.min(Number(limit ?? 20) || 20, 50);
    const data = await getJson(`${COLLECTIONS}/${encodeURIComponent(clean)}/products.json?limit=250`);
    const items = Array.isArray(data.products) ? data.products : [];
    if (!items.length)
        throw new GlossierError(`Collection "${clean}" is empty or unknown - call list_collections.`);
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
        store: "Glossier", collection: clean, sort: order, products: rows.length, in_stock: inStock,
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
        throw new GlossierError("Provide up to 10 product handles, comma separated.");
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
        throw new GlossierError(`No handle could be read. ${problems.join("; ")}`);
    return pretty({
        store: "Glossier", checked: rows.length, in_stock: rows.filter((r) => r.in_stock).length,
        listings: rows, problems,
        note: "Availability is the storefront's own flag, read at request time.",
    });
}
// ---- muxG tools:
async function glFetchText(url, max = 4_000_000) {
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA } });
    }
    catch (e) {
        throw new GlossierError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new GlossierError(`HTTP ${res.status} for ${new URL(url).hostname}`);
    const body = await res.text();
    if (!body.trim())
        throw new GlossierError(`${new URL(url).hostname} returned an empty body.`);
    return body.length > max ? body.slice(0, max) : body;
}
const daysSince = (iso) => {
    const at = Date.parse(iso);
    if (!Number.isFinite(at))
        return null;
    return Math.round((Date.now() - at) / 86_400_000);
};
/**
 * The storefront's own product sitemap, which is the one surface that says
 * *when* a product page last changed rather than what it costs.
 */
export async function catalogSitemap(limit, days) {
    const n = Math.min(Math.max(Number(limit ?? 12) || 12, 1), 40);
    const window = Math.min(Math.max(Number(days ?? 30) || 30, 1), 3650);
    const index = await glFetchText("https://www.glossier.com/sitemap.xml", 400_000);
    const locs = Array.from(index.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].replace(/&amp;/g, "&").trim());
    // the index repeats a sitemap per locale; the unprefixed one is the canonical store
    const productMap = locs.find((l) => /glossier\.com\/sitemap_products_\d+\.xml/i.test(l));
    if (!productMap)
        throw new GlossierError("The sitemap index lists no product sitemap - the storefront layout may have changed.");
    const xml = await glFetchText(productMap);
    const entries = Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g)).map((m) => m[1]);
    const rows = entries.map((block) => {
        const loc = (block.match(/<loc>([^<]+)<\/loc>/) ?? [])[1] ?? "";
        const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) ?? [])[1] ?? "";
        const image = (block.match(/<image:title>([^<]*)<\/image:title>/) ?? [])[1] ?? "";
        return { url: loc.trim(), lastmod: lastmod.trim(), image: image.trim() };
    }).filter((r) => r.url);
    if (!rows.length)
        throw new GlossierError("The product sitemap returned no URLs.");
    const timed = rows.filter((r) => Number.isFinite(Date.parse(r.lastmod)));
    const ages = timed.map((r) => daysSince(r.lastmod)).filter((a) => a !== null);
    const fresh = ages.filter((a) => a <= window).length;
    const times = timed.map((r) => Date.parse(r.lastmod)).filter((t) => Number.isFinite(t));
    const lines = [
        `Glossier product sitemap: ${rows.length} product page(s), ${timed.length} of them carry a lastmod date`,
        `Changed in the last ${window} day(s): ${fresh} · oldest lastmod ${times.length ? new Date(Math.min(...times)).toISOString().slice(0, 10) : "not reported"} · newest ${times.length ? new Date(Math.max(...times)).toISOString().slice(0, 10) : "not reported"}`,
        "",
    ];
    const ranked = [...timed].sort((a, b) => Date.parse(b.lastmod) - Date.parse(a.lastmod));
    for (const [i, row] of (ranked.length ? ranked : rows).slice(0, n).entries()) {
        lines.push(`  ${i + 1}. ${row.image || row.url.replace("https://www.glossier.com/", "")}`);
        lines.push(`     ${row.url} · lastmod ${row.lastmod || "not reported"}${row.lastmod ? ` (${daysSince(row.lastmod)} days ago)` : ""}`);
    }
    if (ranked.length > n)
        lines.push(`  ...and ${ranked.length - n} more product page(s) in this sitemap.`);
    return lines.join("\n");
}
export async function collectionDetail(handle) {
    const clean = String(handle ?? "").trim();
    if (!clean)
        throw new GlossierError("Provide a collection handle - call list_collections first.");
    const data = await getJson(`https://www.glossier.com/collections/${encodeURIComponent(clean)}.json`);
    const c = data?.collection;
    if (!c || typeof c !== "object")
        throw new GlossierError(`Collection "${clean}" is empty or unknown - call list_collections.`);
    const image = c.image;
    const imageUrl = typeof image === "string" ? image : (image && typeof image === "object" ? image.src : null);
    const lines = [
        `${c.title ?? clean} (handle ${c.handle ?? clean})`,
        c.description ? String(c.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) : "No description published.",
        `Products in the collection: ${c.products_count ?? "not reported"}`,
        `Published ${String(c.published_at ?? "not reported").slice(0, 10)} · last updated ${String(c.updated_at ?? "not reported").slice(0, 19).replace("T", " ")}`,
    ];
    if (typeof c.sort_order === "string")
        lines.push(`Sort order: ${c.sort_order}`);
    if (imageUrl)
        lines.push(`Image: ${String(imageUrl).slice(0, 160)}`);
    lines.push(`URL: https://www.glossier.com/collections/${c.handle ?? clean}`);
    lines.push(`Call collection_products with the handle for the products themselves.`);
    return lines.join("\n");
}
