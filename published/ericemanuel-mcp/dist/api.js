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
const CATALOG = "https://ericemanuel.com/products.json";
const SUGGEST = "https://ericemanuel.com/search/suggest.json";
const PRODUCT_BASE = "https://ericemanuel.com/products";
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
        return pretty({ store: "Eric Emanuel", query, returned: out.length, truncated: out.length >= n, listings: out });
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
        return pretty({ store: "Eric Emanuel", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
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
            store: "Eric Emanuel", ...sl, price_usd: dollar, variants, images,
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
            store: "Eric Emanuel", currency: "USD", unpriced, sample: a.length,
            min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
            p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
            note: "Storefront asking prices. Not affiliated with Eric Emanuel.",
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
            store: "Eric Emanuel", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
            deals: deals.slice(0, n),
            note: "Below-median asks, not appraisals. Not affiliated with Eric Emanuel.",
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
        return pretty({ store: "Eric Emanuel", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
    });
}
// ---- muxD tools:
/** The store leaves product_type empty on every product, so the "key:value" tags are the only real taxonomy. */
function facetOf(tag) {
    const i = tag.indexOf(":");
    if (i <= 0)
        return null;
    const key = tag.slice(0, i).trim();
    const value = tag.slice(i + 1).trim();
    if (!key || !value)
        return null;
    return { key, value };
}
/**
 * The faceted tag taxonomy, which is the only usable way to filter this catalog.
 * The existing tools filter on product_type, and this store leaves that field
 * empty on every one of its 333 products, so anything typed into that filter
 * matches nothing.
 */
export async function catalogFacets(args) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 30) || 30, 1), 200);
    const wantProducts = Math.min(Math.max(Math.floor(args.products ?? 20) || 20, 1), 100);
    const all = await sampleCatalog(600, [1, 2, 3, 4]);
    if (!all.length) {
        return `The catalog returned no products from ericemanuel.com/products.json, so no facet could be counted.`;
    }
    const typeEmpty = all.filter((p) => !String(p?.product_type ?? "").trim()).length;
    const counts = new Map();
    const plain = new Map();
    for (const p of all) {
        const id = Number(p?.id ?? 0);
        for (const raw of Array.isArray(p?.tags) ? p?.tags : []) {
            const tag = String(raw).trim();
            if (!tag)
                continue;
            const f = facetOf(tag);
            if (f) {
                if (!counts.has(f.key))
                    counts.set(f.key, new Map());
                const byValue = counts.get(f.key);
                if (!byValue.has(f.value))
                    byValue.set(f.value, new Set());
                byValue.get(f.value).add(id);
            }
            else {
                if (!plain.has(tag))
                    plain.set(tag, new Set());
                plain.get(tag).add(id);
            }
        }
    }
    const facetKeys = [...counts.keys()].sort();
    const lines = [
        `Catalog facets for ericemanuel.com: ${all.length} product(s) scanned`,
        "",
        `product_type is empty on ${typeEmpty} of ${all.length} products, so the type filter on the other tools here cannot match anything on this store. The key:value tags are what actually categorise this catalog.`,
        "",
        `${facetKeys.length} faceted dimension(s): ${facetKeys.join(", ")}`,
    ];
    if (args.facet) {
        const key = String(args.facet).trim();
        const byValue = counts.get(key);
        if (!byValue) {
            return [
                `No facet named "${key}".`,
                "",
                `The faceted dimensions on this store are: ${facetKeys.join(", ")}.`,
                ...(plain.size ? ["", `There are also ${plain.size} unkeyed tag(s), for example: ${[...plain.keys()].slice(0, 15).join(", ")}.`] : []),
            ].join("\n");
        }
        const entries = [...byValue.entries()].sort((a, b) => b[1].size - a[1].size);
        lines.push("", `Values of ${key} (${entries.length}), by product count:`);
        for (const [value, ids] of entries.slice(0, limit)) {
            const match = args.value && value.toLowerCase() === String(args.value).trim().toLowerCase();
            lines.push(`  ${String(ids.size).padStart(4)}  ${value}${match ? "   <- selected" : ""}`);
        }
        if (entries.length > limit)
            lines.push(`  ...and ${entries.length - limit} more values; raise limit to see them.`);
        if (args.value) {
            const wanted = String(args.value).trim().toLowerCase();
            const hit = entries.find(([v]) => v.toLowerCase() === wanted);
            if (!hit) {
                lines.push("", `No value "${args.value}" under ${key}. The values above are the full set.`);
                return lines.join("\n");
            }
            const ids = hit[1];
            const members = all.filter((p) => ids.has(Number(p?.id ?? 0)));
            lines.push("", `${members.length} product(s) tagged ${key}: ${hit[0]}${members.length > wantProducts ? `, showing ${wantProducts}` : ""}:`);
            for (const p of members.slice(0, wantProducts)) {
                const s = slim(p);
                lines.push(`  ${s.price_usd !== null ? `$${s.price_usd.toFixed(2)}` : "no price"}  ${s.available ? "in stock" : "sold out"}  ${s.title.slice(0, 52)}`);
            }
            if (members.length > wantProducts)
                lines.push(`  ...and ${members.length - wantProducts} more; raise products to see them.`);
            // Shopify gives each colourway its own product record, so a title that
            // repeats here is not a duplicate listing but a different colour.
            const byTitle = new Map();
            for (const p of members) {
                const t = String(p?.title ?? "").trim();
                if (t)
                    byTitle.set(t, (byTitle.get(t) ?? 0) + 1);
            }
            const multi = [...byTitle.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
            if (multi.length) {
                lines.push("", `${multi.length} title(s) appear more than once because this store gives every colourway its own product record rather than one product with a colour option. The repeats are different colours of the same style, not duplicate listings:`);
                for (const [t, n] of multi.slice(0, 6))
                    lines.push(`  ${String(n).padStart(3)}x  ${t.slice(0, 60)}`);
            }
            lines.push("", `Use get_product with the handle, or the product's own variants, for the size run: this facet reports the product's lowest price only.`);
        }
        return lines.join("\n");
    }
    for (const key of facetKeys) {
        const entries = [...counts.get(key).entries()].sort((a, b) => b[1].size - a[1].size);
        lines.push("", `${key} (${entries.length} value(s)):`);
        for (const [value, ids] of entries.slice(0, 12)) {
            lines.push(`  ${String(ids.size).padStart(4)}  ${value}`);
        }
        if (entries.length > 12)
            lines.push(`  ...and ${entries.length - 12} more values under ${key}`);
    }
    if (plain.size) {
        const top = [...plain.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 12);
        lines.push("", `Unkeyed tags (${plain.size} distinct, no "key:" prefix):`);
        for (const [tag, ids] of top)
            lines.push(`  ${String(ids.size).padStart(4)}  ${tag}`);
    }
    lines.push("", "Pass a facet and a value to list the products behind it, for example facet \"Material\" value \"Mesh\".");
    return lines.join("\n");
}
// ---- muxF tools:
function round2(n) {
    const v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
}
function storeOrigin() {
    return new URL(CATALOG).origin;
}
function collectionRows(collections) {
    return (Array.isArray(collections) ? collections : [])
        .filter((c) => c && typeof c.handle === "string")
        .map((c) => ({
        title: c.title ?? "(untitled)",
        handle: c.handle,
        products_count: typeof c.products_count === "number" ? c.products_count : null,
        sort_order: c.sort_order ?? null,
        published_at: c.published_at ?? null,
        updated_at: c.updated_at ?? null,
    }));
}
// manual and best-selling are the store's own ordering, which the json endpoint
// does not expose; for those the returned order is kept as-is.
function sortListing(list, sortBy) {
    const out = [...list];
    const firstPrice = (p) => {
        const v = Array.isArray(p?.variants) ? p.variants[0] : null;
        const n = Number(v?.price);
        return Number.isFinite(n) ? n : null;
    };
    switch (sortBy) {
        case "price-ascending":
            out.sort((a, b) => (firstPrice(a) ?? Infinity) - (firstPrice(b) ?? Infinity));
            break;
        case "price-descending":
            out.sort((a, b) => (firstPrice(b) ?? -Infinity) - (firstPrice(a) ?? -Infinity));
            break;
        case "title-ascending":
            out.sort((a, b) => String(a?.title ?? "").localeCompare(String(b?.title ?? "")));
            break;
        case "title-descending":
            out.sort((a, b) => String(b?.title ?? "").localeCompare(String(a?.title ?? "")));
            break;
        case "created-ascending":
            out.sort((a, b) => String(a?.published_at ?? "").localeCompare(String(b?.published_at ?? "")));
            break;
        case "created-descending":
            out.sort((a, b) => String(b?.published_at ?? "").localeCompare(String(a?.published_at ?? "")));
            break;
        default:
            break;
    }
    return out;
}
export function collectionCatalog(args) {
    const limit = Math.min(Math.max(Math.floor(Number(args?.limit ?? 25)) || 25, 1), 250);
    const want = args?.collection ? String(args.collection).trim() : "";
    const sortBy = String(args?.sort_by ?? "manual").trim();
    const serverSorted = sortBy === "manual" || sortBy === "best-selling";
    return getJson(`${storeOrigin()}/collections.json?limit=250&page=1`).then((data) => {
        const all = collectionRows(data.collections);
        if (!all.length)
            throw new StoreError("ericemanuel.com returned no collections.");
        if (!want) {
            return pretty({
                store: "Eric Emanuel",
                total_collections: all.length,
                returned: Math.min(all.length, limit),
                collections: all.slice(0, limit),
                note: "The store's own collection list; product_type is empty on every product here, so collections are the working taxonomy.",
            });
        }
        const needle = want.toLowerCase();
        const hit = all.find((c) => c.handle === needle || c.title.toLowerCase() === needle)
            ?? all.find((c) => c.handle.includes(needle) || c.title.toLowerCase().includes(needle));
        if (!hit)
            throw new StoreError(`No collection matches '${want}'. Handles include: ${all.slice(0, 12).map((c) => c.handle).join(", ")}.`);
        return getJson(`${storeOrigin()}/collections/${encodeURIComponent(hit.handle)}/products.json?limit=250&page=1`).then((pd) => {
            const products = Array.isArray(pd.products) ? pd.products : [];
            if (!products.length)
                throw new StoreError(`Collection '${hit.handle}' returned no products.`);
            const ordered = sortListing(products, sortBy);
            const listings = ordered.slice(0, limit).map((p) => slim(p));
            return pretty({
                store: "Eric Emanuel",
                collection: { title: hit.title, handle: hit.handle, products_count: hit.products_count, published_at: hit.published_at },
                requested_sort: sortBy,
                sorted_locally: !serverSorted,
                scanned: products.length,
                returned: listings.length,
                available_count: listings.filter((s) => s.available).length,
                listings,
                note: serverSorted
                    ? "Store order as the json endpoint returns it; manual and best-selling ordering are not exposed there."
                    : "Sorted here from the collection's own products, because the json endpoint has no sort parameter.",
            });
        });
    });
}
export function variantMatrix(handle, includeSoldOut) {
    const keepAll = includeSoldOut !== false;
    const h = String(handle ?? "").trim();
    if (!h)
        throw new StoreError("Give a product handle from search_products, list_newest or collection_catalog.");
    return getJson(`${PRODUCT_BASE}/${encodeURIComponent(h)}.js`).then((p) => {
        if (!p || typeof p !== "object" || !Array.isArray(p.variants))
            throw new StoreError(`No product json for handle '${h}'. Check the handle first.`);
        const rows = p.variants.map((v) => {
            const parts = parseParts(v.title);
            const size = parts.length ? parts[parts.length - 1] : String(v.title ?? "");
            const sku = typeof v.sku === "string" ? v.sku.trim() : null;
            return {
                size,
                options: parts,
                sku,
                sku_parts: sku ? sku.split("-") : null,
                price_usd: round2(v.price),
                compare_at_usd: round2(v.compare_at_price),
                available: v.available === true,
            };
        });
        const inStock = rows.filter((r) => r.available);
        const visible = keepAll ? rows : inStock;
        if (!visible.length)
            throw new StoreError(`Every size of '${h}' is sold out, so there is nothing to show with include_sold_out off.`);
        const skus = rows.map((r) => r.sku).filter((s) => typeof s === "string" && s);
        const longestCommonPrefix = (list) => {
            if (!list.length)
                return null;
            let prefix = list[0];
            for (const s of list) {
                while (prefix && !s.startsWith(prefix))
                    prefix = prefix.slice(0, -1);
                if (!prefix)
                    return null;
            }
            return prefix;
        };
        const prefix = longestCommonPrefix(skus);
        return pretty({
            store: "Eric Emanuel",
            handle: p.handle ?? h,
            title: p.title ?? null,
            url: `${PRODUCT_BASE}/${p.handle ?? h}`,
            options: (Array.isArray(p.options) ? p.options : []).map((o) => (typeof o === "string" ? o : (o?.name ?? null))).filter(Boolean),
            sizes_in_run: rows.length,
            available_sizes: inStock.map((r) => r.size),
            sold_out_sizes: rows.filter((r) => !r.available).map((r) => r.size),
            all_sold_out: rows.length > 0 && inStock.length === 0,
            sku_prefix: prefix && prefix.length > 1 ? prefix.replace(/-+$/, "") : null,
            variants: visible,
            note: "One row per size with its own price and stock flag; a product can be in the catalog and completely sold out.",
        });
    });
}
