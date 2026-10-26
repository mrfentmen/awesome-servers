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
const CATALOG = "https://sportyandrich.com/products.json";
const SUGGEST = "https://sportyandrich.com/search/suggest.json";
const PRODUCT_BASE = "https://sportyandrich.com/products";
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
        return pretty({ store: "Sporty & Rich", query, returned: out.length, truncated: out.length >= n, listings: out });
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
        return pretty({ store: "Sporty & Rich", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
            store: "Sporty & Rich", ...sl, price_usd: dollar, variants, images,
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
            store: "Sporty & Rich", currency: "USD", unpriced, sample: a.length,
            min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
            p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
            note: "Storefront asking prices. Not affiliated with Sporty & Rich.",
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
            store: "Sporty & Rich", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
            deals: deals.slice(0, n),
            note: "Below-median asks, not appraisals. Not affiliated with Sporty & Rich.",
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
        return pretty({ store: "Sporty & Rich", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
    });
}
// ---- muxH tools:
// The six tools above read products: search, list, fetch one, price, deals,
// categories. Nothing here reads the store's own structure — how it files its
// catalogue, and what it has published as policy. Both are Shopify endpoints the
// storefront serves to anyone, and neither is a repackaging of a product list.
const SR_UA = "mcfentmen-sportyandrich-mcp/1.1 (https://github.com/mcfentmen/sportyandrich-mcp)";
const STORE = "https://sportyandrich.com";
async function srGet(path) {
    let res;
    try {
        res = await fetch(`${STORE}/${path}`, {
            headers: { "User-Agent": SR_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new StoreError(`Could not reach the storefront: ${e.message}`);
    }
    if (!res.ok)
        throw new StoreError(`The storefront returned HTTP ${res.status} for ${path}.`);
    return (await res.json());
}
const text = (html) => String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
/**
 * What the store has published as policy, plus the shop facts those policies are
 * read against. Two shoppers get different answers about returns and shipping, and
 * the answer is written down here rather than inferred from product data.
 */
export async function storePolicies(args) {
    const limit = Math.min(Math.max(Number(args.limit ?? 8) || 8, 1), 30);
    const chars = Math.min(Math.max(Number(args.chars ?? 400) || 400, 80), 1200);
    const [{ pages }, meta] = await Promise.all([
        srGet("pages.json"),
        srGet("meta.json"),
    ]);
    const list = (pages ?? []).filter((p) => p.handle);
    if (!list.length)
        throw new StoreError("The storefront published no pages.");
    const POLICY = /shipping|return|refund|exchange|warranty|privacy|terms|accessib|care|size|contact|faq|policy|guarantee|delivery/i;
    const scored = list
        .map((p) => {
        const body = text(p.body_html);
        const hay = `${p.title ?? ""} ${p.handle ?? ""}`;
        let score = 0;
        if (POLICY.test(hay))
            score += 2;
        if (POLICY.test(body))
            score += 1;
        if (body.length > 200)
            score += 1;
        return { page: p, body, score };
    })
        .sort((a, b) => b.score - a.score || (b.body.length - a.body.length));
    const shipList = Array.isArray(meta.ships_to_countries) ? meta.ships_to_countries : [];
    const facts = [
        `  shop: ${meta.name ?? "not reported"} (${meta.domain ?? "not reported"})`,
        `  located: ${[meta.city, meta.province, meta.country].filter(Boolean).join(", ") || "not reported"}`,
        `  currency: ${meta.currency ?? "not reported"} (${meta.money_format ?? "money format not reported"})`,
        `  ships to: ${shipList.length ? `${shipList.length} destination(s)` : "not reported"}`,
        `  catalogue: ${(meta.published_products_count ?? 0).toLocaleString()} product(s) in ${(meta.published_collections_count ?? 0).toLocaleString()} collection(s)`,
    ];
    return [
        `Published policy for ${meta.name ?? "the storefront"}`,
        "",
        "Shop facts the policies are read against:",
        ...facts,
        "",
        `Pages found: ${list.length} published, ${scored.filter((s) => s.score >= 3).length} of them read as policy rather than as a landing page.`,
        "",
        ...scored
            .filter((s) => s.score >= 3)
            .slice(0, limit)
            .map((entry, i) => {
            const p = entry.page;
            return [
                `  ${i + 1}. ${p.title ?? p.handle} (/${p.handle})`,
                `     published ${String(p.published_at ?? "not reported").slice(0, 10)} | last updated ${String(p.updated_at ?? p.published_at ?? "not reported").slice(0, 10)} | ${entry.body.length} characters of text`,
                `     ${entry.body.slice(0, chars) || "the page carries no readable text, only markup"}${entry.body.length > chars ? ` …(${entry.body.length - chars} more characters)` : ""}`,
            ].join("\n");
        }),
        ...(scored.filter((s) => s.score >= 3).length > limit ? [`  (+${scored.filter((s) => s.score >= 3).length - limit} further policy page(s) not shown)`] : []),
        "",
        ...scored
            .filter((s) => s.score < 3)
            .slice(0, 6)
            .map((entry) => `  not policy: /${entry.page.handle} — ${entry.page.title ?? "untitled"}, ${entry.body.length} characters`),
        "",
        "This is the storefront's own published text, extracted and shortened, with the tags stripped; it is not legal advice and it is not a summary written by anyone, so a shopper still needs the page itself for the exact wording. Not affiliated with the store.",
    ].join("\n");
}
