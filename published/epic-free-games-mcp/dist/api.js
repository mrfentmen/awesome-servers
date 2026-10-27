const BASE = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";
const UA = "mrfentmen-epic-free-games-mcp/1.0 (https://github.com/mrfentmen)";
export class EpicError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new EpicError("Epic Store rate limit hit, wait and retry");
    if (!res.ok)
        throw new EpicError(`Epic Store error ${res.status}`);
    return (await res.json());
}
export async function freeGames(args) {
    const d = await get(`${BASE}?locale=en-US&country=US&allowCountries=US`);
    const games = d?.data?.Catalog?.searchStore?.elements ?? [];
    const free = games.filter((g) => g?.promotions?.promotionalOffers?.length);
    if (!free.length)
        return "No free games right now";
    return free.map((g) => {
        const offer = g.promotions.promotionalOffers[0]?.promotionalOffers?.[0];
        const end = offer?.endDate ? new Date(offer.endDate) : null;
        const endStr = end ? end.toISOString().slice(0, 10) : "unknown";
        return `${g.title ?? "Untitled"}\n   Free until ${endStr} | ${g.originalPrice ?? 0} cents normally${g.description ? `\n   ${g.description.slice(0, 160)}` : ""}`;
    }).join("\n\n");
}
function day(value) {
    if (!value)
        return 'unknown';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'unknown' : d.toISOString().slice(0, 10);
}
function offers(list) {
    const flat = [];
    for (const group of list ?? [])
        for (const offer of group.promotionalOffers ?? [])
            flat.push(offer);
    return flat;
}
async function elements() {
    const d = await get(`${BASE}?locale=en-US&country=US&allowCountries=US`);
    const rows = d?.data?.Catalog?.searchStore?.elements;
    return Array.isArray(rows) ? rows : [];
}
export async function promoSummary() {
    const all = await elements();
    if (!all.length)
        return 'The Epic store returned no catalogue entries.';
    let live = 0;
    let scheduled = 0;
    let liveValue = 0;
    let discounted = 0;
    let earliestEnd = '';
    for (const element of all) {
        const current = offers(element.promotions?.promotionalOffers);
        const upcoming = offers(element.promotions?.upcomingPromotionalOffers);
        if (current.length) {
            live += 1;
            const price = element.price?.totalPrice?.originalPrice;
            if (typeof price === 'number')
                liveValue += price;
            const percent = current[0]?.discountSetting?.discountPercentage;
            if (typeof percent === 'number' && percent > 0)
                discounted += 1;
            const end = current[0]?.endDate;
            if (end && (!earliestEnd || end < earliestEnd))
                earliestEnd = end;
        }
        if (upcoming.length)
            scheduled += 1;
    }
    return [
        `Epic store promotion summary over ${all.length} catalogue entries:`,
        `  free right now: ${live}`,
        `  scheduled to be free later: ${scheduled}`,
        `  total normal price of what is free now: $${(liveValue / 100).toFixed(2)}`,
        `  discounted rather than given away outright: ${discounted} of the ${live} live offers`,
        `  next offer ends: ${day(earliestEnd)}`,
    ].join('\n');
}
