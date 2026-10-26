export class TraxnycError extends Error {
    constructor(message) {
        super(message);
        this.name = "TraxnycError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://traxnyc.com/products.json";
const SUGGEST = "https://traxnyc.com/search/suggest.json";
const PRODUCT_BASE = "https://traxnyc.com/products";
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
        throw new TraxnycError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new TraxnycError(`HTTP ${res.status} for ${new URL(url).hostname}`);
    return res.json();
}
function slim(p) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const varPrices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
    const topPrice = Number(p.price ?? p.price_min);
    const prices = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : []);
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
    return pretty({ store: "TraxNYC", query, returned: out.length, truncated: out.length >= n, listings: out });
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
    return pretty({ store: "TraxNYC", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
}
function parseParts(title) {
    return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean);
}
export async function getProduct(handle) {
    const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`);
    const sl = slim(p);
    // .js detail quotes money in cents; catalog/suggest quote dollars.
    const variants = (Array.isArray(p.variants) ? p.variants : []).map((v) => ({
        title: v.title, parts: parseParts(v.title),
        price_usd: Math.round(Number(v.price)) / 100, compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
        available: v.available,
    }));
    const images = (Array.isArray(p.images) ? p.images : []).map((i) => typeof i === "string" ? i : i.src).filter(Boolean);
    const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "");
    const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : (sl.price_usd !== null ? Math.round(sl.price_usd) / 100 : null);
    return pretty({
        store: "TraxNYC", ...sl, price_usd: dollar, variants, images,
        description: html.replace(new RegExp("<[^>]+>", "g"), " ").replace(new RegExp("\\s+", "g"), " ").trim().slice(0, 1500) || null,
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
        throw new TraxnycError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
        store: "TraxNYC", currency: "USD", unpriced, sample: a.length,
        min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
        p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
        note: "Storefront asking prices. Not affiliated with TraxNYC.",
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
        throw new TraxnycError("No available priced products found.");
    const ps = all.map((s) => s.price_usd).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const deals = all
        .filter((s) => s.price_usd < median)
        .map((s) => ({ ...s, vs_median_usd: Math.round((s.price_usd - median) * 100) / 100, vs_median_pct: Math.round(((s.price_usd - median) / median) * 1000) / 10 }))
        .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
        store: "TraxNYC", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
        deals: deals.slice(0, n),
        note: "Below-median asks, not appraisals. Not affiliated with TraxNYC.",
    });
}
export async function listCategories() {
    const counts = {};
    for (const p of await sampleCatalog(500, [1, 2])) {
        const t = p.product_type || "unknown";
        counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "TraxNYC", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
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
        store: "TraxNYC", query: query ?? null, returned: rows.length,
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
        throw new TraxnycError(`Collection '${handle}' returned no products. Check the handle with list_collections.`);
    return pretty({
        store: "TraxNYC", collection: handle, size: wantSize, scanned: seen,
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
        throw new TraxnycError(`No in-stock variant matched size '${size}' in a ${sample.length}-product sample. Sizes seen: ${seen || "none"}.`);
    }
    return pretty({
        store: "TraxNYC", size: want, scanned: sample.length,
        returned: Math.min(out.length, n), listings: out.slice(0, n),
        note: "Availability and size come from the store's own variant stock flags.",
    });
}
// ---- muxG tools:
const TX_CATALOG = "https://traxnyc.com/products.json";
function txBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
async function txCatalog(pages) {
    const out = [];
    for (let p = 1; p <= pages; p += 1) {
        const res = await fetch(`${TX_CATALOG}?limit=250&page=${p}`, {
            headers: { "User-Agent": "awesome-mcp/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(45000),
        });
        if (!res.ok)
            throw new TraxnycError(`The catalogue returned ${res.status} for page ${p}.`);
        const d = (await res.json());
        const rows = d.products ?? [];
        if (!rows.length)
            break;
        out.push(...rows);
    }
    if (!out.length)
        throw new TraxnycError("The catalogue returned no products.");
    return out;
}
function txPrices(products) {
    const out = [];
    for (const p of products) {
        for (const v of p.variants ?? []) {
            const n = Number(v.price);
            if (Number.isFinite(n) && n > 0)
                out.push(n);
        }
    }
    return out;
}
function txQuantile(sorted, q) {
    if (!sorted.length)
        return 0;
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}
/** Where the money sits in the catalogue, by product type. */
export async function priceDistribution(args) {
    const pages = txBound(args?.pages, 1, 3, 1);
    const buckets = txBound(args?.buckets, 3, 12, 6);
    const products = await txCatalog(pages);
    const prices = txPrices(products).sort((a, b) => a - b);
    if (!prices.length)
        throw new TraxnycError("No variant in this sample carried a usable price.");
    const byType = new Map();
    for (const p of products) {
        const key = p.product_type?.trim() || "(no product_type set)";
        const list = byType.get(key) ?? [];
        for (const v of p.variants ?? []) {
            const n = Number(v.price);
            if (Number.isFinite(n) && n > 0)
                list.push(n);
        }
        byType.set(key, list);
    }
    const lo = prices[0];
    const hi = prices[prices.length - 1];
    const width = (hi - lo) / buckets || 1;
    const histogram = new Map();
    for (const p of prices) {
        const b = Math.min(buckets - 1, Math.floor((p - lo) / width));
        histogram.set(b, (histogram.get(b) ?? 0) + 1);
    }
    const thresholds = [100, 500, 1000, 2500, 5000, 10000, 25000];
    const typeRows = [...byType.entries()]
        .map(([k, v]) => {
        const s = [...v].sort((a, b) => a - b);
        return { k, n: s.length, min: s[0] ?? 0, med: txQuantile(s, 0.5), max: s[s.length - 1] ?? 0 };
    })
        .sort((a, b) => b.n - a.n);
    return [
        `Price distribution over ${prices.length} variant price(s) from ${products.length} product(s), ${pages} page(s) of the public catalogue`,
        "",
        `Range: ${lo} to ${hi}`,
        `Quartiles: 25th ${txQuantile(prices, 0.25)}, median ${txQuantile(prices, 0.5)}, 75th ${txQuantile(prices, 0.75)}`,
        `Mean ${(prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2)}, which sits well above the median, so a handful of expensive pieces are dragging the average up`,
        "",
        "Histogram:",
        ...[...histogram.entries()].sort((a, b) => a[0] - b[0]).map(([b, n]) => {
            const from = lo + b * width;
            const to = from + width;
            return `  ${from.toFixed(0).padStart(8)} to ${to.toFixed(0).padStart(8)}  ${String(n).padStart(4)}  ${"#".repeat(Math.min(60, Math.round((n / prices.length) * 60)))}`;
        }),
        "",
        "How much of the catalogue sits below each threshold:",
        ...thresholds.map((t) => {
            const n = prices.filter((p) => p < t).length;
            return `  under ${String(t).padStart(6)}: ${String(n).padStart(4)} variant(s), ${((n / prices.length) * 100).toFixed(1)}%`;
        }),
        "",
        "By product type:",
        ...typeRows.map((t) => `  ${t.k.slice(0, 22).padEnd(22)} ${String(t.n).padStart(4)} variant(s)  min ${t.min.toFixed(0).padStart(7)}  median ${t.med.toFixed(0).padStart(7)}  max ${t.max.toFixed(0).padStart(7)}`),
        "",
        `The median of ${txQuantile(prices, 0.5)} is the single most informative number here: a jeweller's catalogue is heavily right-skewed, so the mean describes almost no product in it.`,
        "This is priced per variant, so a product with six ring sizes counts six times and a single-watch product counts once. A type with more variants per product therefore looks more prominent than it is in the product count.",
    ]
        .filter(Boolean)
        .join("\n");
}
const SIZE_OPTION = /size|length|width|^ring|^chain|^bracelet/i;
function sizeOf(variant, options) {
    const list = Array.isArray(options) ? options : [];
    for (let i = 0; i < Math.min(list.length, 3); i++) {
        if (!SIZE_OPTION.test(String(list[i]?.name ?? "")))
            continue;
        const value = String(variant?.[`option${i + 1}`] ?? "").trim();
        if (value && !/^default title$/i.test(value))
            return value;
    }
    // A product that publishes named options but none of them is a size simply
    // has no sizes; its variant titles are colour or finish combinations.
    if (list.some((option) => String(option?.name ?? "").trim()))
        return "";
    const title = String(variant?.title ?? "").trim();
    return title && !/^default title$/i.test(title) ? title : "";
}
/** Split a size value into what it measures: a ring number, a length, or neither. */
const sizeGroup = (value) => {
    const text = String(value).trim();
    const bare = text.match(/^(\d{1,3}(?:\.\d+)?)$/);
    if (bare)
        return { group: 'ring', value: Number(bare[1]) };
    const measured = text.match(/^(\d{1,3}(?:\.\d+)?)\s*("|in|inch|inches|mm|cm)?$/i);
    if (measured)
        return { group: 'length', value: Number(measured[1]) };
    return { group: 'other', value: null };
};
/** Every size the catalogue carries, and which of them nobody can buy. */
export async function sizeMatrix(args) {
    const pages = Math.min(Math.max(Number(args?.pages ?? 2) || 2, 1), 3);
    const threshold = Math.min(Math.max(Number(args?.threshold ?? 0) || 0, 0), 50);
    const products = await sampleCatalog(pages * 250, Array.from({ length: pages }, (_, i) => i + 1));
    if (!products.length)
        throw new TraxnycError("TraxNYC's catalogue returned no products; try again shortly.");
    const tally = new Map();
    let noSize = 0;
    let variants = 0;
    for (const product of products) {
        const list = Array.isArray(product.variants) ? product.variants : [];
        variants += list.length;
        let sized = 0;
        for (const variant of list) {
            const size = sizeOf(variant, product.options);
            if (!size)
                continue;
            sized += 1;
            const seen = tally.get(size) ?? { total: 0, inStock: 0, products: new Set() };
            seen.total += 1;
            if (variant.available)
                seen.inStock += 1;
            seen.products.add(product.id);
            tally.set(size, seen);
        }
        if (!sized)
            noSize += 1;
    }
    if (!tally.size)
        throw new TraxnycError(`None of the ${products.length} sampled products offer a size choice at all.`);
    const rows = [...tally.entries()]
        .map(([size, v]) => ({ size, total: v.total, inStock: v.inStock, products: v.products.size, ...sizeGroup(size) }))
        .filter((r) => r.inStock >= threshold);
    const numeric = rows.filter((r) => r.group === 'ring').sort((a, b) => a.value - b.value);
    const lengths = rows.filter((r) => r.group === 'length').sort((a, b) => a.value - b.value);
    const other = rows.filter((r) => r.group === 'other').sort((a, b) => b.total - a.total);
    const dead = rows.filter((r) => r.inStock === 0).sort((a, b) => b.total - a.total);
    const thin = rows.filter((r) => r.inStock > 0 && r.inStock <= 2).sort((a, b) => a.inStock - b.inStock);
    const line = (r) => `  ${r.size.padEnd(12)} ${String(r.total).padStart(4)} variants  ${String(r.inStock).padStart(4)} in stock  ${String(r.products).padStart(4)} products`;
    const out = [
        `TraxNYC size matrix — ${products.length} products, ${variants} variants, ${tally.size} distinct sizes`,
        `  products with no size choice  ${noSize} of ${products.length}`,
        `  sizes at or above threshold    ${rows.length} (threshold ${threshold} in stock)`,
        '',
        `Ring sizing (${numeric.length}):`,
        ...(numeric.length ? numeric.map(line) : ['  none']),
        '',
        `Lengths (${lengths.length}):`,
        ...(lengths.length ? lengths.map(line) : ['  none']),
        '',
        other.length ? `Other sizing (${other.length}), most common first:` : 'Other sizing: none',
        ...(other.length ? other.slice(0, 20).map(line) : ['  none']),
    ];
    if (numeric.length > 1) {
        const known = new Set(numeric.map((r) => r.value));
        const lo = Math.floor(Math.min(...known));
        const hi = Math.ceil(Math.max(...known));
        const whole = numeric.every((r) => Number.isInteger(r.value));
        const gaps = [];
        const step = whole ? 1 : 0.5;
        for (let v = lo; v <= hi + 1e-9; v += step)
            if (!known.has(Number(v.toFixed(2))))
                gaps.push(Number(v.toFixed(2)));
        out.push('', `Numeric range covered: ${lo} to ${hi}${gaps.length ? ` — nothing at ${gaps.slice(0, 14).join(', ')}${gaps.length > 14 ? ` and ${gaps.length - 14} more` : ''}` : ' with no gaps'}`);
    }
    out.push('', `Sizes with nothing buyable (${dead.length}):`);
    out.push(...(dead.length ? dead.slice(0, 15).map((r) => `  ${r.size.padEnd(12)} ${r.total} variants, all out of stock`) : ['  none — every size carries at least one available variant']));
    if (thin.length) {
        out.push('', `Sizes down to one or two units (${thin.length}):`);
        out.push(...thin.slice(0, 10).map((r) => `  ${r.size.padEnd(12)} ${r.inStock} in stock`));
    }
    out.push('', `note: sizes come from each product's own option values, so a bare number is read as a ring size and a number with an inch or mm suffix as a length; values written as fractions or letter codes fall into the third block. Any size written two different ways is counted twice. ${noSize} products sell with no size choice, which is normal for one-size pieces.`);
    return out.join('\n');
}
/** What is broken in the catalogue data rather than in the stock. */
export async function catalogueHealth(args) {
    const pages = Math.min(Math.max(Number(args?.pages ?? 2) || 2, 1), 3);
    const products = await sampleCatalog(pages * 250, Array.from({ length: pages }, (_, i) => i + 1));
    if (!products.length)
        throw new TraxnycError("TraxNYC's catalogue returned no products; try again shortly.");
    const tagCount = new Map();
    const issues = { noType: [], noTags: [], noImage: [], noPrice: [], oneVariant: [], allSoldOut: [] };
    let variants = 0;
    let compared = 0;
    let deep = 0;
    let markdowns = 0;
    for (const product of products) {
        const list = Array.isArray(product.variants) ? product.variants : [];
        variants += list.length;
        const tags = Array.isArray(product.tags) ? product.tags : [];
        if (!String(product.product_type ?? '').trim())
            issues.noType.push(product.title ?? product.handle);
        if (!tags.length)
            issues.noTags.push(product.title ?? product.handle);
        if (!Array.isArray(product.images) || !product.images.length)
            issues.noImage.push(product.title ?? product.handle);
        for (const tag of tags)
            tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
        const prices = list.map((v) => Number(v.price)).filter((n) => Number.isFinite(n) && n > 0);
        if (!prices.length)
            issues.noPrice.push(product.title ?? product.handle);
        const sized = list.filter((v) => sizeOf(v, product.options));
        if (list.length === 1 && !sized.length)
            issues.oneVariant.push(product.title ?? product.handle);
        if (list.length && !list.some((v) => v.available))
            issues.allSoldOut.push(product.title ?? product.handle);
        for (const variant of list) {
            const was = Number(variant.compare_at_price);
            const now = Number(variant.price);
            if (!Number.isFinite(was) || !Number.isFinite(now) || was <= now)
                continue;
            compared += 1;
            const off = ((was - now) / was) * 100;
            if (off >= 30)
                deep += 1;
            markdowns += 1;
        }
    }
    const total = products.length;
    const pct = (n) => `${n} (${Math.round((n / total) * 100)}%)`;
    const singles = [...tagCount.values()].filter((c) => c === 1).length;
    const listBlock = (title, names) => {
        if (!names.length) {
            return [`${title}: none`];
        }
        return [`${title}: ${names.length}`, ...names.slice(0, 6).map((n) => `  - ${String(n).slice(0, 78)}`), ...(names.length > 6 ? [`  ... ${names.length - 6} more`] : [])];
    };
    const out = [
        `TraxNYC catalogue health — ${total} products, ${variants} variants`,
        `  no product_type      ${pct(issues.noType.length)}`,
        `  no tags              ${pct(issues.noTags.length)}`,
        `  no image             ${pct(issues.noImage.length)}`,
        `  no usable price      ${pct(issues.noPrice.length)}`,
        `  single variant, no size choice  ${pct(issues.oneVariant.length)}`,
        `  every variant sold out          ${pct(issues.allSoldOut.length)}`,
        '',
        `Markdowns: ${markdowns} of ${variants} variants carry a compare-at price, ${deep} of those are 30% or deeper.`,
        `Tags: ${tagCount.size} distinct, ${singles} used exactly once (${Math.round((singles / Math.max(tagCount.size, 1)) * 100)}% of the vocabulary).`,
        '',
        ...listBlock('Products with no product_type', issues.noType),
        '',
        ...listBlock('Products with no tags', issues.noTags),
        '',
        ...listBlock('Products with no image', issues.noImage),
        '',
        ...listBlock('Products with no usable price', issues.noPrice),
        '',
        ...listBlock('Products with every variant unavailable', issues.allSoldOut),
        '',
        'Most used tags:',
        ...[...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, c]) => `  ${String(c).padStart(4)}  ${t}`),
        '',
        `note: read from TraxNYC's public products.json, ${pages} page(s) of up to 250. Counts describe the sample, not the whole catalogue; a product with one variant and no size option is only a problem when it should have had sizes.`,
    ];
    return out.join('\n');
}
