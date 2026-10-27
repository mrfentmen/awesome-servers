export class EbayError extends Error {
    constructor(message) {
        super(message);
        this.name = "EbayError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.EBAY_OAUTH_TOKEN;
    if (!k)
        throw new EbayError("Set EBAY_OAUTH_TOKEN (eBay OAuth user token).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.ebay.com/buy/browse/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new EbayError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new EbayError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function searchItems(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}`);
}
export function getItem(itemId) {
    return get(`/item/${encodeURIComponent(itemId)}`);
}
export function getItemGroup(itemGroupId) {
    return get(`/item_group/${encodeURIComponent(itemGroupId)}`);
}
export function getLegacyItem(legacyId) {
    return get(`/item/get_item_by_legacy_id?legacyId=${encodeURIComponent(legacyId)}`);
}
export function dealItems(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return (async () => {
        let res;
        try {
            res = await fetch(`https://api.ebay.com/buy/deal/v1/deal_item?limit=${n}`, {
                headers: headers(),
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new EbayError(`Network error: ${e.message}`);
        }
        if (!res.ok) {
            const body = (await res.text()).slice(0, 300);
            throw new EbayError(`HTTP ${res.status}: ${body}`);
        }
        return (await res.text()).slice(0, 12000);
    })();
}
export function searchExtended(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}&fieldgroups=EXTENDED`);
}
export function searchEndingSoon(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}&sort=endingSoonest`);
}
export function searchLowestPrice(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}&sort=price%2Bshipping`);
}
export function searchNewlyListed(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}&sort=newlyListed`);
}
export function searchByCategory(query, categoryId, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 200);
    return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}&category_ids=${encodeURIComponent(categoryId)}`);
}
/** Mirrors get() but yields parsed JSON; the raw helper truncates to text, which is useless for computation. */
async function getJson(path) {
    let res;
    try {
        res = await fetch("https://api.ebay.com/buy/browse/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new EbayError(`Network error: ${e.message}`);
    }
    const body = await res.text();
    if (!res.ok) {
        throw new EbayError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    try {
        return JSON.parse(body);
    }
    catch {
        throw new EbayError("eBay returned a body that is not JSON.");
    }
}
/** eBay sends money as decimal strings, so never subtract them with a bare minus or you get string concatenation. */
function money(v) {
    const n = Number(v?.value);
    if (!Number.isFinite(n))
        return null;
    return { n, cur: String(v?.currency ?? "USD") };
}
const shortDay = (iso) => {
    if (!iso)
        return "?";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "?";
    return d.toISOString().slice(0, 10);
};
/** eBay sends handlingTime.unit as DAY or BUSINESS_DAY, which reads badly lowercased by concatenation, so normalise it. */
function formatHandling(t) {
    const n = Number(t?.value);
    if (!Number.isFinite(n) || n <= 0)
        return "-";
    const kind = String(t?.unit ?? "DAY").toLowerCase().replace(/_/g, " ");
    const noun = kind.startsWith("business") ? (n === 1 ? "business day" : "business days") : n === 1 ? "day" : "days";
    return `${n} ${noun}`;
}
/** Renders the shipping table for one listing and computes landed cost, which is the price that actually decides a purchase. */
export async function shippingOptions(args) {
    const id = String(args.item_id ?? "").trim();
    if (!id)
        throw new EbayError("Provide an eBay item id, for example v1|123456789012|0 or a numeric legacy id.");
    const data = await getJson(`/item/${encodeURIComponent(id)}/get_shipping_options`);
    const opts = Array.isArray(data?.shippingOptions) ? data.shippingOptions : [];
    const title = String(data?.title ?? data?.itemId ?? id);
    const basePrice = money(args.item_price ? { value: args.item_price, currency: "USD" } : data?.price);
    const lines = [`Shipping options for: ${title}`, `Item: ${id}`];
    if (basePrice)
        lines.push(`Item price: ${basePrice.n.toFixed(2)} ${basePrice.cur}`);
    lines.push("");
    if (!opts.length) {
        lines.push("No shipping options returned.", "", "eBay returns an empty list for local pickup and for some items where shipping is arranged after checkout, so this alone does not mean the item cannot be shipped. If the listing promised delivery, the seller has not published the options through the API.");
        return lines.join("\n");
    }
    lines.push(`${"service".padEnd(34)}${"cost".padEnd(14)}${"delivery window".padEnd(26)}handling`);
    const rows = [];
    for (const o of opts) {
        const ship = money(o.shippingCost);
        const imp = money(o.importCharges);
        const label = o.shippingServiceCode ?? o.shippingCarrierCode ?? o.type ?? "option";
        const min = shortDay(o.minEstimatedDeliveryDate);
        const max = shortDay(o.maxEstimatedDeliveryDate);
        const handling = formatHandling(o.handlingTime);
        const cost = ship?.n ?? 0;
        const cur = ship?.cur ?? "USD";
        lines.push(`${label.slice(0, 33).padEnd(34)}${(ship ? `${ship.n.toFixed(2)} ${ship.cur}` : "free/unknown").padEnd(14)}${`${min} to ${max}`.padEnd(26)}${handling}`);
        if (o.importCharges)
            lines.push(`${" ".repeat(34)}import/duty on arrival: ${imp ? `${imp.n.toFixed(2)} ${imp.cur}` : "unknown"}`);
        if (o.shippingCostType)
            lines.push(`${" ".repeat(34)}cost type: ${o.shippingCostType}`);
        rows.push({ label, ship: cost, cur, imp: imp?.n ?? 0, total: cost + (imp?.n ?? 0), min, max, free: o.freeShipping === true || cost === 0 });
    }
    if (basePrice && rows.length) {
        const cheapest = rows.reduce((a, b) => (b.total < a.total ? b : a));
        const priciest = rows.reduce((a, b) => (b.total > a.total ? b : a));
        const priceStr = (r) => `${(basePrice.n + r.total).toFixed(2)} ${basePrice.cur}`;
        const anyImport = rows.some((r) => r.imp > 0);
        lines.push("", `Landed cost (item price plus shipping${anyImport ? " and import charges" : ""}):`, `  cheapest: ${cheapest.label.slice(0, 30)} -> ${priceStr(cheapest)}`, `  dearest: ${priciest.label.slice(0, 30)} -> ${priceStr(priciest)}`);
        const delta = priciest.total - cheapest.total;
        if (delta > 0) {
            lines.push("", `${anyImport ? "Shipping and import charges together" : "Shipping alone"} move the total by ${delta.toFixed(2)} ${cheapest.cur} between the cheapest and dearest option, so the service choice can change the price by ${((delta / basePrice.n) * 100).toFixed(0)}% of the item price.`);
        }
    }
    const free = rows.filter((r) => r.free);
    if (free.length) {
        lines.push("", `${free.length} option(s) ship free, which is usually the cheapest. "${free[0].label}" arriving ${free[0].min} to ${free[0].max}.`);
    }
    else if (rows.length) {
        lines.push("", "No option is marked free shipping, so the listed shipping cost applies to every service shown.");
    }
    lines.push("", "Delivery dates are eBay's estimates and use a range, not a promise. A wide range usually means the seller has not committed to a dispatch date, which is a reason to treat the arrival date as unreliable.");
    return lines.join("\n");
}
/** Finds which listings share an item group, so a cheaper duplicate of a listing you already found can be found. */
export async function findItemGroup(args) {
    const raw = String(args.item_ids ?? "").trim();
    if (!raw)
        throw new EbayError("Provide one or more eBay item ids, comma separated.");
    const ids = raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (!ids.length)
        throw new EbayError("Provide one or more eBay item ids, comma separated.");
    if (ids.length > 20)
        throw new EbayError(`Give at most 20 item ids at once; you gave ${ids.length}.`);
    const withListings = args.with_listings !== false;
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 30) || 30, 1), 200);
    const found = await getJson(`/item_group_find?item_ids=${ids.map(encodeURIComponent).join(",")}`);
    const groups = Array.isArray(found?.itemGroups)
        ? found.itemGroups
        : Array.isArray(found)
            ? found
            : (found?.items ?? []).map((it) => ({ itemGroupId: it.itemGroupId, itemId: it.itemId }));
    if (!groups.length) {
        return [
            "No shared item group found for the ids given.",
            "",
            `Ids checked: ${ids.join(", ")}`,
            "",
            "eBay groups only listings it has decided are the same product, by matching title, model and UPC. A group that is missing here means eBay did not match them, which happens for unbranded goods, for parts of a set, and for anything whose model number is missing from the listing. It is not proof that two listings are different products, only that the grouping is unavailable.",
        ].join("\n");
    }
    const lines = [`Item group lookup for ${ids.length} id(s): ${groups.length} group(s) found`, ""];
    for (const g of groups.slice(0, 20)) {
        const gid = String(g?.itemGroupId ?? g?.itemGroupID ?? "?");
        const memberIds = Array.isArray(g?.itemIds) ? g.itemIds.map(String) : g?.itemId ? [String(g.itemId)] : [];
        lines.push(`group ${gid}  (from item ${g?.itemId ?? ids.join(", ")})`);
        lines.push(`  input ids in this group: ${memberIds.length ? memberIds.join(", ") : "none reported"}`);
        if (!withListings)
            continue;
        try {
            const items = await getJson(`/get_items_by_item_group?item_group_id=${encodeURIComponent(gid)}&limit=${limit}`);
            const rows = Array.isArray(items?.items) ? items.items : [];
            if (!rows.length) {
                lines.push("  no listings returned for this group");
                continue;
            }
            const priced = rows
                .map((it) => ({ it, m: money(it?.price) }))
                .filter((r) => r.m !== null)
                .sort((a, b) => a.m.n - b.m.n);
            lines.push(`  ${rows.length} listing(s) in this group:`);
            for (const { it, m } of priced.slice(0, 12)) {
                const ship = it?.shippingOptions?.[0];
                const sc = money(ship?.shippingCost);
                const land = sc ? m.n + sc.n : m.n;
                const isInput = ids.includes(String(it?.itemId ?? ""));
                lines.push(`    ${m.n.toFixed(2)} ${m.cur.padEnd(4)} ${sc ? `+ ship ${sc.n.toFixed(2)}` : "ship ?   "}  landed ${land.toFixed(2)}  ${String(it?.title ?? "").slice(0, 46)}${isInput ? "   <- the id you searched for" : ""}`);
            }
            if (priced.length > 1) {
                const lo = priced[0].m;
                const hi = priced[priced.length - 1].m;
                const inputRow = priced.find((r) => ids.includes(String(r.it?.itemId ?? "")));
                lines.push("");
                lines.push(`    cheapest in group is ${lo.n.toFixed(2)} ${lo.cur}; dearest is ${hi.n.toFixed(2)} ${hi.cur} (${((hi.n / lo.n - 1) * 100).toFixed(0)}% higher).`);
                if (inputRow && inputRow.m.n > lo.n) {
                    lines.push(`    The id you searched for is ${((inputRow.m.n / lo.n - 1) * 100).toFixed(0)}% above the cheapest listing in the same group, so the group is worth checking before buying.`);
                }
                else if (inputRow) {
                    lines.push("    The id you searched for is already the cheapest in its group.");
                }
                if (priced.length > 12)
                    lines.push(`    ...and ${priced.length - 12} more listing(s); raise limit to see them.`);
            }
            else {
                lines.push("    Only one priced listing, so there is nothing to compare.");
            }
        }
        catch (e) {
            lines.push(`  could not list the group's listings: ${e instanceof Error ? e.message.slice(0, 160) : String(e)}`);
        }
    }
    lines.push("", "eBay item groups reflect eBay's own product matching and are not always complete or always correct. Condition, seller and shipping are not part of the match, so compare those before treating two listings as equivalent.");
    return lines.join("\n");
}
/** Derived from a search: price distribution and how competitive the cheapest listing actually is. */
export async function marketPriceContext(args) {
    const q = String(args.query ?? "").trim();
    if (!q)
        throw new EbayError("Provide a search query.");
    const n = Math.min(Math.max(Math.floor(args.limit ?? 50) || 50, 2), 200);
    const data = await getJson(`/item_summary/search?q=${encodeURIComponent(q)}&limit=${n}`);
    const items = Array.isArray(data?.itemSummaries) ? data.itemSummaries : [];
    if (!items.length) {
        return [
            `No listings found for "${q}".`,
            "",
            "eBay returned zero item summaries, which means no active listing in the US marketplace matched this query as written. Very long queries and queries with punctuation are the usual cause; try a shorter noun phrase and add category filters if you need to narrow rather than widen.",
        ].join("\n");
    }
    const priced = items
        .map((it) => ({ it, p: money(it.price), ship: money(it.shippingOptions?.[0]?.shippingCost) }))
        .filter((r) => r.p !== null);
    if (!priced.length) {
        return [
            `Search for "${q}" returned ${items.length} listing(s) but none carried a price.`,
            "",
            "eBay sometimes returns listings whose price is withheld until checkout, most often for vehicles, real estate and made-to-order items. Those cannot be ranked, so no comparison is possible for this query.",
        ].join("\n");
    }
    const vals = priced.map((r) => r.p.n).sort((a, b) => a - b);
    const cur = priced[0].p.cur;
    const median = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
    const lowest = vals[0];
    const highest = vals[vals.length - 1];
    // Landed cost is what separates a genuinely cheap listing from one that is
    // cheap until a $40 shipping charge is added at checkout.
    const landed = priced.map((r) => ({ ...r, l: r.p.n + (r.ship?.n ?? 0) })).sort((a, b) => a.l - b.l);
    const cheapestLanded = landed[0];
    const cheapestSticker = priced[0];
    const shipFree = landed.filter((r) => r.ship !== null && r.ship.n === 0).length;
    const shipUnknown = landed.filter((r) => r.ship === null).length;
    const lines = [
        `Price context for "${q}" in the US marketplace`,
        `${priced.length} priced listing(s) of ${items.length} returned (limit ${n})`,
        "",
        `sticker price:  lowest ${lowest.toFixed(2)}  median ${median.toFixed(2)}  highest ${highest.toFixed(2)} ${cur}`,
        `landed price:   lowest ${cheapestLanded.l.toFixed(2)} ${cur}  (including shipping for all ${landed.length} priced listings)`,
        `${shipFree} of ${priced.length} listing(s) ship free${shipUnknown ? `, ${shipUnknown} publish no shipping figure at all` : ""}`,
    ];
    if (cheapestLanded.l > cheapestSticker.p.n + 0.005) {
        lines.push("", `The cheapest sticker price (${cheapestSticker.p.n.toFixed(2)}, "${String(cheapestSticker.it.title ?? "").slice(0, 40)}") is NOT the cheapest to buy: it ships for ${cheapestSticker.ship ? `${cheapestSticker.ship.n.toFixed(2)} ${cheapestSticker.ship.cur}` : "an unstated amount"}.`, `The listing to actually compare is ${cheapestLanded.l.toFixed(2)} ${cur} all-in, which is ${(cheapestLanded.l - cheapestSticker.p.n).toFixed(2)} more for a reason that shows up only at checkout.`);
    }
    else if (cheapestLanded.ship === null) {
        lines.push("", `The cheapest sticker price is also the cheapest landed price, but only because that listing publishes no shipping figure, so eBay was treated as charging nothing. That is an assumption, not a verified free delivery: the real total for "${String(cheapestLanded.it.title ?? "").slice(0, 40)}" is unknown until checkout, and a ${cheapestLanded.l.toFixed(2)} listing can easily be beaten by a dearer one once shipping is added.`);
    }
    else {
        lines.push("", `The cheapest sticker price is also the cheapest landed price, and its shipping is a verified ${cheapestLanded.ship.n.toFixed(2)} ${cheapestLanded.ship.cur}, so there is no hidden cost on the winner.`);
    }
    const atOrBelowMedian = priced.filter((r) => r.p.n <= median).length;
    lines.push("", `${atOrBelowMedian} of ${priced.length} listing(s) (${((atOrBelowMedian / priced.length) * 100).toFixed(0)}%) sit at or below the median, so a price near the median is the market rate rather than a deal.`, `Only ${priced.filter((r) => r.p.n === lowest).length} listing(s) are at the very bottom, and that is a single data point rather than a market.`);
    const bySeller = new Map();
    for (const r of landed) {
        const s = String(r.it.seller?.username ?? "unknown seller");
        const cur2 = bySeller.get(s) ?? { n: 0, min: r.l };
        cur2.n += 1;
        if (r.l < cur2.min)
            cur2.min = r.l;
        bySeller.set(s, cur2);
    }
    const sellers = [...bySeller.entries()].sort((a, b) => b[1].n - a[1].n || a[1].min - b[1].min);
    if (sellers.length === 1) {
        lines.push("", `Every one of the ${priced.length} listing(s) is from a single seller (${sellers[0][0]}). That is one seller's stock rather than a market, so the spread between lowest and highest reflects condition, size or bundle, not competition, and there is no cheaper seller to switch to.`);
    }
    else {
        lines.push("", `${sellers.length} distinct seller(s); the most listings come from:`);
        for (const [name, s] of sellers.slice(0, 6)) {
            lines.push(`  ${name}: ${s.n} listing(s), from ${s.min.toFixed(2)} ${cur} landed`);
        }
    }
    lines.push("", "This is the asking price on active US listings, not a sold-price history. eBay's prices can be optimistic, can exclude shipping entirely and do not reveal how long a listing has been sitting, so treat the median as the going rate and the bottom as something to verify.");
    return lines.join("\n");
}
