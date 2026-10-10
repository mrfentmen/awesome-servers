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
const TX_LIST_CAP = 12;
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
/** The whole size curve of the catalogue, and where it has holes. */
export async function sizeMatrix(args) {
    const pages = txBound(args?.pages, 1, 3, 1);
    const threshold = txBound(args?.threshold, 0, 50, 0);
    const products = await txCatalog(pages);
    const numeric = new Map();
    const inches = new Map();
    const other = new Map();
    const bump = (m, key, available) => {
        const cell = m.get(key) ?? { total: 0, available: 0 };
        cell.total += 1;
        if (available)
            cell.available += 1;
        m.set(key, cell);
    };
    let variants = 0;
    let defaultOnly = 0;
    for (const p of products) {
        const values = (p.options ?? []).flatMap((o) => (o.name === "Title" ? [] : o.values ?? []));
        const allDefault = values.length === 0;
        for (const v of p.variants ?? []) {
            variants += 1;
            if (allDefault)
                defaultOnly += 1;
            const size = v.option1 && v.option1 !== "Default Title" ? v.option1 : undefined;
            if (!size)
                continue;
            if (/^\d+(\.\d+)?$/.test(size))
                bump(numeric, size, v.available === true);
            else if (/^\d+(\.\d+)?\s*(in|inch|inches|")$/i.test(size.trim()))
                bump(inches, size.trim().toLowerCase(), v.available === true);
            else
                bump(other, size.trim(), v.available === true);
        }
    }
    const lines = [
        `Size matrix over ${products.length} product(s) and ${variants} variant(s) from ${pages} page(s) of the public catalogue`,
        `${defaultOnly} variant(s) are a single "Default Title" with no size choice at all`,
        "",
    ];
    const numericSorted = [...numeric.entries()].map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
    if (numericSorted.length) {
        const min = numericSorted[0][0];
        const max = numericSorted[numericSorted.length - 1][0];
        lines.push(`Numeric sizes, ${min} to ${max} (ring or band sizing):`);
        for (const [size, cell] of numericSorted) {
            const gap = cell.total - cell.available;
            lines.push(`  ${String(size).padStart(6)}  ${String(cell.total).padStart(3)} variant(s), ${String(cell.available).padStart(3)} in stock${gap > 0 ? `, ${gap} sold out` : ""}${cell.available === 0 ? "   <- nothing buyable in this size" : ""}`);
        }
        if (max - min + 1 > numericSorted.length) {
            const present = new Set(numericSorted.map(([s]) => s));
            const missing = [];
            for (let s = min; s <= max; s += 1)
                if (!present.has(s))
                    missing.push(String(s));
            lines.push(`  missing entirely between ${min} and ${max}: ${missing.join(", ")}`);
        }
        lines.push("");
    }
    const inchSorted = [...inches.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    if (inchSorted.length) {
        lines.push("Length sizes in inches (chains and bracelets):");
        for (const [size, cell] of inchSorted) {
            lines.push(`  ${size.padStart(12)}  ${String(cell.total).padStart(3)} variant(s), ${String(cell.available).padStart(3)} in stock${cell.available === 0 ? "   <- nothing buyable at this length" : ""}`);
        }
        lines.push("");
    }
    if (other.size) {
        lines.push(`Other size or material values (${other.size}), most stocked first:`);
        for (const [size, cell] of [...other.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, TX_LIST_CAP)) {
            lines.push(`  ${size.slice(0, 46).padEnd(46)}  ${String(cell.total).padStart(3)} variant(s), ${String(cell.available).padStart(3)} in stock`);
        }
        lines.push("");
    }
    const soldOut = [...numeric.values(), ...inches.values(), ...other.values()].filter((c) => c.available === 0);
    const totalCells = numeric.size + inches.size + other.size;
    lines.push(`Size values seen: ${totalCells}, of which ${soldOut.length} have no buyable variant at all${totalCells ? ` (${((soldOut.length / totalCells) * 100).toFixed(0)}%)` : ""}`, threshold > 0 ? `Size values with at least ${threshold} in-stock variant(s): ${[...numeric.values(), ...inches.values(), ...other.values()].filter((c) => c.available >= threshold).length} of ${totalCells}` : "", "", "The existing find-by-size tool answers 'is my size in stock', which is one cell of this table. What a table shows that a filter cannot is the shape of the curve: a catalogue can carry sizes 6 to 13 and still be unusable if 7, 9 and 11 are sold out, and a length that exists on the page is not a length you can buy.");
    return lines.filter(Boolean).join("\n");
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
/** What is wrong with the catalogue data itself, which is what breaks a storefront. */
export async function catalogueHealth(args) {
    const pages = txBound(args?.pages, 1, 3, 1);
    const products = await txCatalog(pages);
    let noType = 0;
    let noTags = 0;
    let noImage = 0;
    let noVariants = 0;
    let singleVariant = 0;
    let allSoldOut = 0;
    let onSale = 0;
    let withCompareAt = 0;
    let badPrice = 0;
    let noHandle = 0;
    let deepDiscounts = 0;
    const tagCount = new Map();
    const noPriceProducts = [];
    for (const p of products) {
        if (!p.product_type?.trim())
            noType += 1;
        if (!p.handle)
            noHandle += 1;
        if (!p.tags?.length)
            noTags += 1;
        if (!p.images?.length)
            noImage += 1;
        for (const t of p.tags ?? [])
            tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
        const variants = p.variants ?? [];
        if (!variants.length) {
            noVariants += 1;
            continue;
        }
        if (variants.length === 1)
            singleVariant += 1;
        if (variants.every((v) => v.available !== true))
            allSoldOut += 1;
        let anyPrice = false;
        for (const v of variants) {
            const price = Number(v.price);
            if (!Number.isFinite(price) || price <= 0) {
                badPrice += 1;
                continue;
            }
            anyPrice = true;
            const compare = v.compare_at_price === null || v.compare_at_price === undefined ? null : Number(v.compare_at_price);
            if (compare !== null && Number.isFinite(compare) && compare > 0) {
                withCompareAt += 1;
                if (v.available === true)
                    onSale += 1;
                if (compare > 0 && price / compare < 0.7)
                    deepDiscounts += 1;
            }
        }
        if (!anyPrice)
            noPriceProducts.push(p.title ?? "(untitled)");
    }
    const total = products.length;
    const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]);
    const singletons = topTags.filter(([, n]) => n === 1).length;
    const pct = (n) => `${((n / total) * 100).toFixed(0)}%`;
    return [
        `Catalogue health over ${total} product(s) from ${pages} page(s) of the public catalogue`,
        "",
        "Data completeness:",
        `  no product_type set: ${noType} (${pct(noType)}) — these fall into no filter and are hard to find`,
        `  no tags at all: ${noTags} (${pct(noTags)})`,
        `  no image: ${noImage} (${pct(noImage)})`,
        `  no variants: ${noVariants}`,
        `  no usable handle: ${noHandle}`,
        `  variants with a missing or non-positive price: ${badPrice}`,
        noPriceProducts.length ? `  products with no priceable variant: ${noPriceProducts.slice(0, 3).join("; ")}${noPriceProducts.length > 3 ? `, and ${noPriceProducts.length - 3} more` : ""}` : "",
        "",
        "Structure:",
        `  single-variant products (no size or material choice): ${singleVariant} (${pct(singleVariant)})`,
        `  products where every variant is unavailable: ${allSoldOut} (${pct(allSoldOut)})${allSoldOut ? ", which are dead pages that still rank" : ""}`,
        "",
        "Pricing:",
        `  variants carrying a compare-at price: ${withCompareAt}${onSale ? `, of which ${onSale} are actually purchasable` : ""}`,
        `  markdowns deeper than 30%: ${deepDiscounts}`,
        "",
        `Tagging: ${tagCount.size} distinct tag(s) across ${total} products, of which ${singletons} are used exactly once`,
        "  most used:",
        ...topTags.slice(0, TX_LIST_CAP).map(([t, n]) => `    ${String(n).padStart(4)}  ${t.slice(0, 50)}`),
        "",
        "A product with no product_type, no tags and no image is invisible in every filter and unreachable in search, and nothing on the storefront will tell you it is there. A product whose variants are all unavailable still returns 200 and still appears in a sitemap, which is the combination that quietly costs a store its crawl budget.",
        "A large count of single-use tags is usually a symptom rather than a problem: it means the tagging is being used as free-form notes instead of as a facet, so nothing groups.",
    ]
        .filter(Boolean)
        .join("\n");
}
