/**
 * Etsy Open API v3 client. Requires ETSY_API_KEY.
 * Get a free key at https://www.etsy.com/developers/ (create an app).
 * Docs: https://developers.etsy.com/documentation/reference/
 */
const BASE = "https://openapi.etsy.com/v3/application";
export class EtsyError extends Error {
}
function apiKey() {
    const k = process.env.ETSY_API_KEY;
    if (!k)
        throw new EtsyError("Set ETSY_API_KEY first (free at etsy.com/developers).");
    return k;
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "etsy-mcp/1.0", Accept: "application/json", "x-api-key": apiKey() },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new EtsyError("Etsy rejected the key (401/403). Check ETSY_API_KEY.");
    if (res.status === 404)
        throw new EtsyError("Not found on Etsy.");
    if (!res.ok)
        throw new EtsyError(`Etsy error ${res.status}`);
    return (await res.json());
}
export async function findShop(name) {
    const data = await getJson(`/shops?shop_name=${encodeURIComponent(name.trim())}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, 5).map(toShop);
}
const toShop = (s) => ({
    shopId: Number(s.shop_id),
    name: s.shop_name,
    title: s.title,
    listings: s.listing_active_count,
    rating: typeof s.review_average === "number" ? Math.round(s.review_average * 10) / 10 : undefined,
    url: s.url,
});
export async function shopListings(shopId, limit = 10) {
    if (!/^\d+$/.test(shopId.trim()))
        throw new EtsyError(`Shop id must be numeric, got "${shopId}".`);
    const data = await getJson(`/shops/${shopId.trim()}/listings/active?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map(toListing);
}
export async function getListing(id) {
    if (!/^\d+$/.test(id.trim()))
        throw new EtsyError(`Listing id must be numeric, got "${id}".`);
    const l = await getJson(`/listings/${id.trim()}?includes=images`);
    return toListing(l);
}
const toListing = (l) => ({
    id: Number(l.listing_id),
    title: l.title,
    price: l.price ? `${l.price.amount ?? "?"} ${(l.price.currency_code ?? "").toUpperCase()}` : undefined,
    currency: l.price?.currency_code,
    quantity: l.quantity,
    url: l.url,
    image: l.images?.[0]?.url_fullxfull,
});
export function formatShop(s, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}[${s.shopId}] ${s.name ?? "(unnamed)"}${s.rating !== undefined ? ` (${s.rating}★)` : ""}`,
        s.title ? `${s.title}` : "",
        s.listings !== undefined ? `${s.listings} active listings` : "",
        s.url ? `${s.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatListing(l, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}[${l.id}] ${l.title ?? "(untitled)"}${l.price ? ` — ${l.price}` : ""}${l.quantity !== undefined ? ` (x${l.quantity})` : ""}`,
        l.url ? `${l.url}` : "",
        l.image ? `${l.image}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxD tools:
/**
 * Etsy v3 checks route existence before it checks the key: an unknown path 404s
 * while a real one 403s on the key. That makes 403 a usable existence signal
 * here, which is not true of most APIs in this batch. Verified to exist:
 * /shops/{id}, /shops/{id}/listings/active, /shops/{id}/listings/featured,
 * /shops/{id}/listings and /listings/{id}. Verified absent:
 * /shops/{id}/listings/{variations,shop_policies,sold_out,draft,inactive,defeatured},
 * /listings/{id}/variations, /shops/{id}/employees, /taxonomy/seller/get.
 */
const etsyMoney = (p) => {
    if (!p)
        return "?";
    const amount = Number(p.amount);
    const cur = String(p.currency_code ?? "").toUpperCase();
    if (!Number.isFinite(amount))
        return "?";
    return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)} ${cur}`;
};
/**
 * The active listings of a shop with the documented filters applied, plus a
 * price and stock distribution. The existing shop_listings dumps the first
 * listings in whatever order Etsy returns and caps at 100, so a shop with
 * several hundred products is only ever partly visible and cannot be filtered.
 */
export async function shopCatalogue(args) {
    const shopId = String(args.shop_id ?? "").trim();
    if (!/^\d+$/.test(shopId))
        throw new EtsyError(`Shop id must be numeric, got "${args.shop_id}".`);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 25) || 25, 1), 100);
    const offset = Math.max(Math.floor(args.offset ?? 0) || 0, 0);
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (args.keywords)
        qs.set("keywords", String(args.keywords));
    if (args.price_min !== undefined)
        qs.set("price_min", String(args.price_min));
    if (args.price_max !== undefined)
        qs.set("price_max", String(args.price_max));
    if (args.taxonomy_id !== undefined)
        qs.set("taxonomy_id", String(args.taxonomy_id));
    // sort_on is passed through rather than validated: Etsy's accepted values have
    // changed between API versions and rejecting a valid one would be worse than
    // letting Etsy answer.
    if (args.sort_on)
        qs.set("sort_on", String(args.sort_on));
    if (args.sort_order)
        qs.set("sort_order", String(args.sort_order));
    const data = await getJson(`/shops/${shopId}/listings/active?${qs.toString()}`);
    const rows = Array.isArray(data?.results) ? data.results : [];
    const count = Number(data?.count ?? rows.length);
    const filters = [
        args.keywords ? `keywords "${args.keywords}"` : "no keyword filter",
        args.price_min !== undefined || args.price_max !== undefined
            ? `price ${args.price_min !== undefined ? args.price_min : "any"} to ${args.price_max !== undefined ? args.price_max : "any"}`
            : "no price filter",
        args.taxonomy_id !== undefined ? `taxonomy ${args.taxonomy_id}` : "no taxonomy filter",
        args.sort_on ? `sorted by ${args.sort_on} ${args.sort_order ?? ""}`.trim() : "shop default order",
    ];
    if (!rows.length) {
        return [
            `No active listings for shop ${shopId} with ${filters.join(", ")}, at offset ${offset}.`,
            "",
            count === 0
                ? "Etsy reports zero matching listings. For a shop that is known to be open that usually means the filters are too narrow, or the shop has de-listed everything, or the shop is closed to new orders."
                : `Etsy reports ${count} matching listing(s) in total but returned none at offset ${offset}, so the window has been walked past the end.`,
        ].join("\n");
    }
    const lines = [
        `Shop ${shopId} active listings: ${rows.length} returned at offset ${offset}, Etsy counts ${count} matching`,
        `Filters: ${filters.join("; ")}`,
        "",
    ];
    const priced = rows
        .map((l) => {
        const amount = Number(l?.price?.amount);
        return { l, amount: Number.isFinite(amount) ? amount : NaN, cur: String(l?.price?.currency_code ?? "").toUpperCase() };
    })
        .filter((r) => Number.isFinite(r.amount));
    if (args.analyse !== false && priced.length) {
        const amounts = priced.map((r) => r.amount).sort((a, b) => a - b);
        const cur = priced[0].cur;
        const median = amounts.length % 2 ? amounts[(amounts.length - 1) / 2] : (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2;
        const currencies = new Set(priced.map((r) => r.cur).filter(Boolean));
        const lowStock = rows.filter((l) => {
            const q = Number(l?.quantity);
            return Number.isFinite(q) && q > 0 && q <= 2;
        }).length;
        const outOfStock = rows.filter((l) => Number(l?.quantity) === 0).length;
        const noQuantity = rows.filter((l) => l?.quantity === undefined || l?.quantity === null).length;
        lines.push(`Price across these ${priced.length} listings: ${amounts[0].toFixed(2)} to ${amounts[amounts.length - 1].toFixed(2)} ${cur}, median ${median.toFixed(2)}`, currencies.size > 1
            ? `Mixed currencies in this page: ${[...currencies].join(", ")}. Etsy converts per listing, so a price range across currencies is not a real range.`
            : "", `Stock: ${outOfStock} at zero quantity, ${lowStock} with 1 or 2 left, ${noQuantity} with no quantity field at all`, "");
        if (noQuantity > priced.length / 2) {
            lines.push("Most listings publish no quantity. Etsy only exposes a quantity where the seller has configured inventory tracking, so an absent quantity means untracked, not unlimited, and it cannot be used to judge whether a listing can actually be bought.", "");
        }
    }
    lines.push(`${"id".padEnd(11)}${"price".padEnd(14)}${"qty".padEnd(6)}title`);
    for (const l of rows) {
        const q = l?.quantity;
        lines.push(`${String(l?.listing_id ?? "?").padEnd(11)}${etsyMoney(l?.price).padEnd(14)}${(q === undefined || q === null ? "-" : String(q)).padEnd(6)}${String(l?.title ?? "(untitled)").slice(0, 62)}`);
    }
    const consumed = offset + rows.length;
    if (consumed < count) {
        lines.push("", `Showing ${offset + 1} to ${consumed} of ${count}. Raise offset by ${limit} to continue; Etsy caps limit at 100, so a large shop needs several calls to walk.`);
    }
    lines.push("", "The active endpoint excludes sold-out listings entirely, so a shop's real catalogue is larger than anything this can return, and Etsy's shop record reports a listing_active_count that will not match this total. Neither figure is wrong; they count different things.");
    return lines.join("\n");
}
/**
 * The per-option matrix for a listing. The existing get_listing reads one price
 * and one quantity from the top level, so a listing offered in five sizes and
 * three colours reports a single figure that may correspond to no purchasable
 * combination at all.
 */
export async function listingVariations(args) {
    const id = String(args.listing_id ?? "").trim();
    if (!/^\d+$/.test(id))
        throw new EtsyError(`Listing id must be numeric, got "${args.listing_id}".`);
    // VariationProperties is what carries the per-option price, quantity and
    // availability; without it the listing returns a single top-level price only.
    const data = await getJson(`/listings/${id}?includes=MainImage,Shop,VariationProperties`);
    const variations = Array.isArray(data?.variations) ? data.variations : [];
    const title = String(data?.title ?? id);
    if (!variations.length) {
        return [
            `${title} (listing ${id}) has no variations.`,
            "",
            `Single price: ${etsyMoney(data?.price)}${data?.quantity !== undefined ? `, quantity ${data.quantity}` : ""}.`,
            "",
            "No variations means the listing is sold as one item at one price, so the top-level price and quantity are the whole story. Etsy sometimes omits variations even for multi-option listings when the seller has not published them through the API, so a single price here is not always proof of a single option.",
        ].join("\n");
    }
    const props = variations.map((v) => {
        const opts = Array.isArray(v?.options) ? v.options : [];
        return {
            name: String(v?.formatted_name ?? v?.display_name ?? v?.property_name ?? "option"),
            required: v?.is_required !== false,
            options: opts.map((o) => {
                const p = Number(o?.price?.amount);
                return {
                    value: String(o?.formatted_value ?? o?.formatted_name ?? o?.value_id ?? "?"),
                    price: etsyMoney(o?.price),
                    priceNum: Number.isFinite(p) ? p : null,
                    qty: Number(o?.quantity ?? Number.NaN),
                    avail: typeof o?.is_available === "boolean" ? o.is_available : null,
                    sku: String(o?.sku ?? ""),
                };
            }),
        };
    });
    const total = props.reduce((a, p) => a * Math.max(p.options.length, 1), 1);
    const allOpts = props.flatMap((p) => p.options);
    const known = allOpts.filter((o) => o.avail !== null);
    const availCount = known.filter((o) => o.avail === true).length;
    const unknownAvail = allOpts.length - known.length;
    const lines = [
        `Variation matrix for ${title}`,
        `listing ${id} | ${props.map((p) => `${p.name} (${p.options.length}${p.required ? "" : ", optional"})`).join(" x ")}`,
        `Up to ${total} purchasable combination${total === 1 ? "" : "s"}; the top-level price is only the base variant`,
        "",
    ];
    if (unknownAvail === allOpts.length) {
        lines.push("No option carries an availability flag, so it is not possible to tell which combinations can actually be bought. Etsy only reports is_available for some sellers, and its absence is not evidence that an option is in stock.", "");
    }
    else if (known.length) {
        lines.push(`Availability: ${availCount} of ${known.length} options that report it are available${unknownAvail ? `, ${unknownAvail} report nothing` : ""}`, "");
    }
    for (const p of props) {
        lines.push(`${p.name}:`);
        for (const o of p.options) {
            const qty = Number.isFinite(o.qty) ? String(o.qty) : "not published";
            const status = o.avail === true ? "available" : o.avail === false ? "SOLD OUT" : "availability unknown";
            lines.push(`  ${o.value.slice(0, 28).padEnd(30)}${o.price.padEnd(14)}${status.padEnd(21)}qty ${qty}${o.sku ? `  sku ${o.sku}` : ""}`);
        }
    }
    const prices = allOpts.map((o) => o.priceNum).filter((n) => n !== null);
    if (prices.length > 1) {
        const lo = Math.min(...prices);
        const hi = Math.max(...prices);
        const c = allOpts.find((o) => o.priceNum !== null)?.price.split(" ").pop() ?? "";
        lines.push("", `Prices vary across options: ${lo.toFixed(2)} to ${hi.toFixed(2)} ${c}. A larger size costing more is normal for apparel and can be a large fraction of the total, so the base price understates what the larger sizes cost.`);
    }
    const qtyKnown = allOpts.filter((o) => Number.isFinite(o.qty));
    if (!qtyKnown.length) {
        lines.push("", "No option publishes a quantity. Etsy exposes per-option stock only where a seller tracks it, so remaining stock per size cannot be read from here.");
    }
    if (args.only_available === true) {
        const anyLeft = props.some((p) => p.options.some((o) => o.avail === true));
        if (!anyLeft) {
            lines.push("", "No option reports as available, so nothing in this listing can currently be bought. The listing still exists and the get_listing tool will still return it, because a listing being present is not the same as it being purchasable.");
        }
    }
    lines.push("", "Etsy's per-option price is the price of that exact option, not an adjustment, and it is already the figure a buyer pays for it.");
    return lines.join("\n");
}
/**
 * The listings a shop has chosen to feature. This is a merchant-curated decision
 * and nothing about price, age or quantity reveals it, so it is not derivable
 * from the active listings endpoint.
 */
export async function featuredListings(args) {
    const shopId = String(args.shop_id ?? "").trim();
    if (!/^\d+$/.test(shopId))
        throw new EtsyError(`Shop id must be numeric, got "${args.shop_id}".`);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 25) || 25, 1), 100);
    let featured = [];
    let featuredError = "";
    try {
        const d = await getJson(`/shops/${shopId}/listings/featured?limit=${limit}`);
        featured = Array.isArray(d?.results) ? d.results : [];
    }
    catch (e) {
        featuredError = e instanceof Error ? e.message : String(e);
    }
    let shop = {};
    let activeCount = null;
    try {
        const d = await getJson(`/shops/${shopId}`);
        shop = d ?? {};
        activeCount = Number(d?.listing_active_count);
        if (!Number.isFinite(activeCount))
            activeCount = null;
    }
    catch { /* the featured list is still worth showing on its own */ }
    const shopName = String(shop?.shop_name ?? `shop ${shopId}`);
    if (featuredError) {
        return [
            `Could not read featured listings for ${shopName}: ${featuredError}`,
            "",
            "Featuring is a separate listing state from active, and Etsy does not guarantee a shop has any featured listings, so an error here is as likely to be an empty state as a problem.",
        ].join("\n");
    }
    if (!featured.length) {
        return [
            `${shopName} (shop ${shopId}) has no featured listings.`,
            activeCount !== null ? `Etsy reports ${activeCount} active listings.` : "",
            "",
            "A shop features the listings it wants to push to the top of its own storefront. Having none is normal and says nothing about the shop's size or quality; it just means nothing has been featured, or everything sold out and was replaced.",
        ].filter(Boolean).join("\n");
    }
    const plural = (n, one, many) => (n === 1 ? one : many);
    // A shop reporting zero active listings while serving featured ones is a
    // contradiction, and printing "2 of 0 active" would read as a bug in the tool
    // rather than as a disagreement between two Etsy figures.
    const inconsistent = activeCount !== null && activeCount < featured.length;
    const lines = [
        `Featured listings for ${shopName} (shop ${shopId}): ${featured.length}${activeCount !== null && !inconsistent ? ` of ${activeCount} active` : ""}`,
        "These are the listings the shop has chosen to promote. Featuring is a merchant decision that price, recency and quantity do not reveal.",
        "",
        `${"id".padEnd(11)}${"price".padEnd(14)}${"qty".padEnd(6)}title`,
    ];
    if (inconsistent) {
        lines.splice(2, 0, `Etsy's own figures disagree here: the shop record reports ${activeCount} active listing(s) while ${featured.length} featured listing(s) came back. One of the two is stale, and which one cannot be told from the response, so treat the ratio as unknown rather than as a share of the catalogue.`, "");
    }
    for (const l of featured) {
        const q = l?.quantity;
        lines.push(`${String(l?.listing_id ?? "?").padEnd(11)}${etsyMoney(l?.price).padEnd(14)}${(q === undefined || q === null ? "-" : String(q)).padEnd(6)}${String(l?.title ?? "(untitled)").slice(0, 62)}`);
    }
    const featuredPrices = featured.map((l) => Number(l?.price?.amount)).filter(Number.isFinite);
    if (featuredPrices.length) {
        const lo = Math.min(...featuredPrices);
        const hi = Math.max(...featuredPrices);
        const sortedPrices = [...featuredPrices].sort((a, b) => a - b);
        const med = sortedPrices.length % 2
            ? sortedPrices[(sortedPrices.length - 1) / 2]
            : (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2;
        lines.push("", `Featured price range ${lo.toFixed(2)} to ${hi.toFixed(2)}, median ${med.toFixed(2)}. Featured listings are often the shop's higher-margin end, so this is not a fair sample of the catalogue; use shop_catalogue for that.`);
    }
    const soldOut = featured.filter((l) => Number(l?.quantity) === 0).length;
    if (soldOut) {
        lines.push(`${soldOut} featured listing${plural(soldOut, " is", "s are")} at zero quantity, which means a shop can feature something it cannot currently sell.`);
    }
    lines.push("", "Etsy exposes a featured listing state but no defeatured or inactive one: there is no endpoint that lists what a shop has removed or taken down, so a listing that simply disappeared leaves no record here.");
    return lines.join("\n");
}
