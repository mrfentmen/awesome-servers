/**
 * CheapShark — keyless public API client.
 */
const BASE = "https://www.cheapshark.com/api/1.0";
const SOURCE = "CheapShark";
const UA = "cheapshark-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            ...init,
            signal: ctrl.signal,
            headers: {
                "user-agent": UA,
                accept: "application/json",
                ...init?.headers,
            },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, init) {
    const res = await request(path, init);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
export async function deals(a) {
    const limit = clampLimit(a.limit, 10, 60);
    const store = a.storeID ? `&storeID=${encodeURIComponent(clean(a.storeID))}` : "";
    const d = await getJson(`/deals?upperPrice=${a.upperPrice}${store}&pageSize=${limit}&sortBy=Price`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        return `No deals under $${a.upperPrice}.`;
    return section(`${list.length} deal(s) under $${a.upperPrice}`, list.map((x, i) => `${i + 1}. ${clean(x.title)} — $${clean(x.salePrice)} (was $${clean(x.normalPrice)}, ${clean(x.savings).slice(0, 5)}% off) · store ${clean(x.storeID)}`));
}
export async function stores(a) {
    const d = await getJson("/stores");
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        throw new SourceError("CheapShark returned no stores");
    return section(`${list.length} stores`, list.map((s, i) => `${i + 1}. ${clean(s.storeName)} (id ${clean(s.storeID)})`));
}
export async function game_search(a) {
    const title = clean(a.title);
    if (title.length < 2)
        throw new SourceError("title must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 20);
    const d = await getJson(`/games?title=${encodeURIComponent(title)}&limit=${limit}`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        return `No game matches "${title}".`;
    return section(`${list.length} game(s) match "${title}"`, list.map((g, i) => `${i + 1}. ${clean(g.external)} — cheapest $${clean(g.cheapest)} · id ${clean(g.gameID)}`));
}
export async function game_prices(a) {
    const id = clean(a.gameID);
    if (!/^\d{1,10}$/.test(id))
        throw new SourceError("gameID must be digits");
    const d = await getJson(`/games?id=${id}`);
    if (!d?.info)
        throw new SourceError(`No game ${id}`);
    const deals = Array.isArray(d.deals) ? d.deals : [];
    return section(`${clean(d.info.title)}`, [
        bullet("Cheapest ever", `$${clean(d.cheapestPriceEver?.price)}`),
        bullet("Stores", `${deals.length} listing(s)`),
        ...deals.slice(0, 15).map((x, i) => `${i + 1}. store ${clean(x.storeID)} — $${clean(x.price)} (retail $${clean(x.retailPrice)})`),
    ]);
}
export async function store_deals(a) {
    const store = clean(a.storeID);
    if (!/^\d{1,3}$/.test(store))
        throw new SourceError("storeID must be a number");
    const limit = clampLimit(a.limit, 10, 40);
    const d = await getJson(`/deals?storeID=${store}&pageSize=${limit}&sortBy=Price`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        return `No deals for store ${store}.`;
    return section(`${list.length} deal(s) at store ${store}`, list.map((x, i) => `${i + 1}. ${clean(x.title)} — $${clean(x.salePrice)} (was $${clean(x.normalPrice)})`));
}
