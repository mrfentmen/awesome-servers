export class KithError extends Error {
    constructor(message) {
        super(message);
        this.name = "KithError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://kith.com/products.json";
const SUGGEST = "https://kith.com/search/suggest.json";
const PRODUCT_BASE = "https://kith.com/products";
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
        throw new KithError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new KithError(`HTTP ${res.status} for ${new URL(url).hostname}`);
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
const kithClamp = (value, lo, hi, dflt) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return dflt;
    return Math.min(Math.max(Math.round(n), lo), hi);
};
const kithMedian = (values) => {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
async function kithProducts(sample) {
    const wanted = kithClamp(sample, 1, 1500, 300);
    const products = await sampleCatalog(wanted, [1, 2, 3, 4, 5, 6]);
    if (!products.length)
        throw new KithError("The catalog returned no products. Kith rate-limits a shared address with HTTP 429, and when that happens every catalog tool here fails the same way; wait a minute and retry.");
    return products;
}
/**
 * Every option axis the shop sells on, with the run of values actually buyable.
 * A size run is the thing a buyer checks first, and the product tools only ever
 * print the first variant of one product.
 */
export async function sizeRunMatrix(args) {
    const limit = kithClamp(args?.limit, 1, 40, 12);
    const axisFilter = String(args?.axis ?? "").trim().toLowerCase();
    const products = await kithProducts(args?.sample);
    const axes = new Map();
    for (const product of products) {
        const options = Array.isArray(product.options) ? product.options : [];
        const variants = Array.isArray(product.variants) ? product.variants : [];
        options.forEach((option, index) => {
            const name = String(option?.name ?? "").trim();
            if (!name)
                return;
            if (axisFilter && !name.toLowerCase().includes(axisFilter))
                return;
            const axis = axes.get(name) ?? { name, values: new Map(), products: 0 };
            axis.products += 1;
            for (const variant of variants) {
                const value = String(variant[`option${index + 1}`] ?? "").trim();
                if (!value)
                    continue;
                const entry = axis.values.get(value) ?? { value, variants: 0, inStock: 0, prices: [] };
                entry.variants += 1;
                if (variant.available) {
                    entry.inStock += 1;
                    const price = Number(variant.price);
                    if (Number.isFinite(price))
                        entry.prices.push(price);
                }
                axis.values.set(value, entry);
            }
            axes.set(name, axis);
        });
    }
    if (!axes.size) {
        const names = [...new Set(products.flatMap((p) => (p.options ?? []).map((o) => o?.name).filter(Boolean)))];
        throw new KithError(axisFilter
            ? `No option axis matching "${args.axis}". This sample sells on: ${names.join(", ") || "no axes at all"}.`
            : "The sampled products declare no option axis, so there is no size run to report.");
    }
    const rows = [
        `Option axes across ${products.length} sampled product(s)`, "",
    ];
    for (const axis of [...axes.values()].sort((a, b) => b.values.size - a.values.size)) {
        const values = [...axis.values.values()].sort((a, b) => b.inStock - a.inStock || b.variants - a.variants);
        const totalVariants = values.reduce((sum, v) => sum + v.variants, 0);
        const totalInStock = values.reduce((sum, v) => sum + v.inStock, 0);
        rows.push(`  ${axis.name} — ${values.length} value(s) across ${axis.products} product(s), ${totalInStock} of ${totalVariants} variant(s) buyable (${totalVariants ? ((totalInStock / totalVariants) * 100).toFixed(1) : "0"}%)`);
        rows.push("    value          variants  buyable  coverage  median in-stock price");
        for (const value of values.slice(0, limit)) {
            const coverage = value.variants ? `${((value.inStock / value.variants) * 100).toFixed(0)}%` : "-";
            const median = kithMedian(value.prices);
            rows.push(`    ${value.value.slice(0, 14).padEnd(14)} ${String(value.variants).padStart(8)} ${String(value.inStock).padStart(8)} ${coverage.padStart(9)}  ${median === null ? "-" : `$${median.toFixed(2)}`}`);
        }
        if (values.length > limit)
            rows.push(`    ... ${values.length - limit} further value(s)`);
        const soldOut = values.filter((v) => v.inStock === 0).map((v) => v.value);
        if (soldOut.length)
            rows.push(`    nothing left in: ${soldOut.slice(0, 12).join(", ")}${soldOut.length > 12 ? ` … (+${soldOut.length - 12})` : ""}`);
        rows.push("");
    }
    rows.push(`note: counted over the first ${products.length} product(s) of the live catalog, not all of it, so a size that exists only on a later page will not appear. Coverage is per variant, not per unit: one buyable size can mean a single item left. Prices are the storefront's own, already in dollars.`);
    return rows.join("\n");
}
/** Words that start the product part of a title, not the partner's name. */
const PARTNER_STOP = new Set([
    "for", "the", "and", "with", "x",
    "leather", "suede", "canvas", "wool", "cotton", "denim", "nylon", "fleece", "merino", "cashmere", "satin", "mesh",
    "chair", "stool", "table", "lamp", "rug", "sofa", "blanket", "candle", "mug",
    "jacket", "coat", "parka", "vest", "hoodie", "crewneck", "sweatshirt", "sweater", "pullover", "cardigan",
    "tee", "t-shirt", "shirt", "polo", "tank", "top", "short", "shorts", "pant", "pants", "trouser", "trousers",
    "sweatpant", "sweatpants", "jean", "jeans", "cargo", "tight", "tights", "legging", "leggings",
    "sneaker", "sneakers", "shoe", "shoes", "boot", "boots", "loafer", "sandal", "slide", "mule",
    "cap", "hat", "beanie", "bucket", "visor", "headband", "scarf", "glove", "gloves", "sock", "socks",
    "bag", "tote", "backpack", "duffle", "wallet", "card", "keychain", "lanyard",
    "ring", "necklace", "earring", "bracelet", "watch", "sunglasses", "eyewear", "perfume", "cologne",
]);
/**
 * The partner a title names, cut where the product starts. Titles read
 * "Kith for <partner> <product>", so the partner is the leading words that are
 * neither a product noun, a material, nor a model code.
 */
function partnerOf(title) {
    const text = String(title ?? "");
    const after = /\bkith\s*(?:×|x|&|for)\s+(.+)$/i.exec(text);
    const before = /^(.+?)\s*(?:×|x|for)\s*kith\b/i.exec(text);
    const raw = after?.[1] ?? before?.[1];
    if (!raw)
        return null;
    const words = raw.replace(/[|,()].*$/, "").trim().split(/\s+/);
    const kept = [];
    for (const word of words) {
        const clean = word.replace(/^["“”]+|["“”]+$/g, "").replace(/[^\w'’&.\-]/g, "");
        if (!clean)
            break;
        const lower = clean.toLowerCase();
        if (kept.length && (PARTNER_STOP.has(lower) || /\d/.test(clean)))
            break;
        // A model code such as XT-VYGR is all capitals and belongs to the product.
        if (kept.length && clean === clean.toUpperCase() && /[A-Z]{2}/.test(clean))
            break;
        if (kept.length >= 3)
            break;
        kept.push(clean);
    }
    const name = kept.join(" ").replace(/\s+/g, " ").trim();
    if (name.length < 2 || /^(kith|the|and|a)$/i.test(name))
        return null;
    return name;
}
export async function collaborationCensus(args) {
    const limit = kithClamp(args?.limit, 1, 40, 15);
    const products = await kithProducts(args?.sample);
    const partners = new Map();
    for (const product of products) {
        const name = partnerOf(product.title);
        if (!name)
            continue;
        const key = name.toLowerCase().replace(/^['‘’"“”]+/, "");
        const entry = partners.get(key) ?? { name, products: 0, variants: 0, prices: [], example: "" };
        entry.products += 1;
        entry.variants += Array.isArray(product.variants) ? product.variants.length : 0;
        const price = Number(product.variants?.[0]?.price ?? product.price);
        if (Number.isFinite(price))
            entry.prices.push(price);
        if (!entry.example)
            entry.example = product.title;
        partners.set(key, entry);
    }
    if (!partners.size)
        throw new KithError(`None of the ${products.length} sampled titles names a partner in a form this tool recognises ("Kith x …", "Kith for …", "… for Kith"). A drop titled without the partner will not be counted.`);
    const ranked = [...partners.values()].sort((a, b) => b.products - a.products || a.name.localeCompare(b.name));
    const rows = [
        `Collaborations across ${products.length} sampled product(s) — ${partners.size} partner(s) recognised`,
        `  ${ranked.reduce((sum, p) => sum + p.products, 0)} of the sample names a partner; the rest are in-house or unparseable`, "",
        "  partner          products  variants  from",
        ...ranked.slice(0, limit).map((p) => `  ${p.name.slice(0, 16).padEnd(16)} ${String(p.products).padStart(8)} ${String(p.variants).padStart(9)}  ${p.prices.length ? `$${Math.min(...p.prices).toFixed(2)}` : "-"}`),
        "",
        "Most carried:",
        ...ranked.slice(0, Math.min(limit, 5)).map((p) => `  ${p.name} — e.g. ${p.example}`),
        "",
        "note: partners are read from product titles, so a collaboration titled only by product name is invisible here, and a brand that shares a word with a product line can be over-counted. This counts what is on sale now, not the history of drops. Sample pages are whatever the store returns first, which skews towards the current season.",
    ];
    return rows.join("\n");
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
    return pretty({ store: "KITH", query, returned: out.length, truncated: out.length >= n, listings: out });
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
    return pretty({ store: "KITH", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
function parseParts(title) {
    return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean);
}
export async function getProduct(handle) {
    const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`);
    const sl = slim(p, true);
    const variants = (Array.isArray(p.variants) ? p.variants : []).map((v) => ({
        title: v.title, parts: parseParts(v.title),
        price_usd: Number(v.price),
        compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
        available: v.available,
    }));
    const images = (Array.isArray(p.images) ? p.images : []).map((i) => typeof i === "string" ? i : i.src).filter(Boolean);
    const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "");
    const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : sl.price_usd;
    return pretty({
        store: "KITH", ...sl, price_usd: dollar, variants, images,
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
        throw new KithError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
        store: "KITH", currency: "USD", unpriced, sample: a.length,
        min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
        p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
        note: "Storefront asking prices. Not affiliated with KITH.",
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
        throw new KithError("No available priced products found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        store: "KITH", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals. Not affiliated with KITH.",
    });
}
export async function listCategories() {
    const counts = {};
    for (const p of await sampleCatalog(500, [1, 2])) {
        const t = p.product_type || "unknown";
        counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "KITH", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
}
// --- catalog tools: collections + attribute/size filters ---
function collectionsOrigin() {
    return new URL(CATALOG).origin;
}
export async function listCollections(query) {
    const wanted = query ? query.trim().toLowerCase() : null;
    const rows = [];
    const data = await getJson(`${collectionsOrigin()}/collections.json?limit=250`);
    const list = Array.isArray(data.collections) ? data.collections : [];
    for (const row of list) {
        const c = row;
        if (typeof c.title !== "string" || typeof c.handle !== "string")
            continue;
        if (wanted && !c.title.toLowerCase().includes(wanted))
            continue;
        rows.push({ title: c.title, handle: c.handle, store_products: typeof c.products_count === "number" ? c.products_count : null });
    }
    return pretty({
        store: "KITH", query: query ?? null, returned: rows.length,
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
        const data = await getJson(`${collectionsOrigin()}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`);
        const products = Array.isArray(data.products) ? data.products : [];
        if (!products.length)
            break;
        for (const p of products) {
            seen += 1;
            if (wantSize) {
                const variants = Array.isArray(p.variants) ? p.variants : [];
                const hit = variants.some((v) => v.available === true && parseParts(v.title).some((part) => part.toLowerCase() === wantSize));
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
        throw new KithError(`Collection '${handle}' returned no products. Check the handle with list_collections.`);
    return pretty({
        store: "KITH", collection: handle, size: wantSize, scanned: seen,
        returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
    });
}
export async function find_by_size(size, limit, maxPrice) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const want = String(size).trim().toLowerCase();
    const sample = await sampleCatalog(300, [1, 2, 3]);
    const out = [];
    const sizesSeen = new Set();
    for (const p of sample) {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        for (const v of variants)
            for (const part of parseParts(v.title))
                sizesSeen.add(part);
        const hit = variants.find((v) => v.available === true && (String(v.title ?? "").trim().toLowerCase() === want || parseParts(v.title).some((part) => part.toLowerCase() === want)));
        if (!hit)
            continue;
        const sl = slim(p);
        if (mp !== undefined && (sl.price_usd === null || sl.price_usd > mp))
            continue;
        sl.matched_size = String(hit.title);
        sl.size_price_usd = Number.isFinite(Number(hit.price)) ? Math.round(Number(hit.price) * 100) / 100 : null;
        sl.in_stock_sizes = variants.filter((v) => v.available === true).map((v) => String(v.title));
        out.push(sl);
    }
    if (!out.length) {
        const seen = [...sizesSeen].slice(0, 40).join(", ");
        throw new KithError(`No in-stock variant matched size '${size}' in a ${sample.length}-product sample. Sizes seen: ${seen || "none"}.`);
    }
    return pretty({
        store: "KITH", size: want, scanned: sample.length,
        returned: Math.min(out.length, n), listings: out.slice(0, n),
        note: "Availability and size come from the store's own variant stock flags.",
    });
}
