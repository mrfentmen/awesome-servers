/**
 * iTunes Search API — keyless public API client.
 */
const BASE = "https://itunes.apple.com";
const SOURCE = "iTunes";
const UA = "itunes-mcp";
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
export async function search(a) {
    const term = clean(a.term);
    if (term.length < 2)
        throw new SourceError("term must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const d = await getJson(`/search?term=${encodeURIComponent(term)}&media=${a.media}&limit=${limit}`);
    const list = Array.isArray(d?.results) ? d.results : [];
    if (!list.length)
        return `iTunes has no result for "${term}".`;
    return section(`${d?.resultCount ?? list.length} result(s) for "${term}"`, list.map((x, i) => `${i + 1}. ${clean(x.trackName || x.collectionName)} — ${clean(x.artistName)}${x.kind ? " · " + clean(x.kind) : ""}`));
}
export async function lookup(a) {
    if (!Number.isInteger(a.id) || a.id < 1)
        throw new SourceError("id must be a positive integer");
    const d = await getJson(`/lookup?id=${a.id}&entity=${a.entity}`);
    const list = Array.isArray(d?.results) ? d.results : [];
    if (!list.length)
        return `iTunes has no item ${a.id}.`;
    return section(`${list.length} result(s)`, list.map((x, i) => `${i + 1}. ${clean(x.trackName || x.collectionName)} — ${clean(x.artistName)} · ${clean(x.releaseDate).slice(0, 10)}${x.trackPrice !== undefined ? " · " + clean(x.trackPrice) + " " + clean(x.currency) : ""}`));
}
export async function top_songs(a) {
    const country = clean(a.country || "us").toLowerCase();
    if (!/^[a-z]{2}$/.test(country))
        throw new SourceError("country must be a two-letter code");
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/${country}/rss/topsongs/limit=${limit}/json`);
    const raw = d?.feed?.entry;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (!list.length)
        return "iTunes returned an empty chart.";
    return section(`${country.toUpperCase()} top songs`, list.map((x, i) => `${i + 1}. ${clean(x["im:name"]?.label)} — ${clean(x["im:artist"]?.label)}`));
}
export async function top_apps(a) {
    const country = clean(a.country || "us").toLowerCase();
    if (!/^[a-z]{2}$/.test(country))
        throw new SourceError("country must be a two-letter code");
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/${country}/rss/${a.kind}/limit=${limit}/json`);
    const raw = d?.feed?.entry;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (!list.length)
        return "iTunes returned an empty chart.";
    return section(`${country.toUpperCase()} ${a.kind}`, list.map((x, i) => `${i + 1}. ${clean(x["im:name"]?.label)} — ${clean(x["im:artist"]?.label)}`));
}
export async function customer_reviews(a) {
    if (!Number.isInteger(a.appId) || a.appId < 1)
        throw new SourceError("appId must be a positive integer");
    const country = clean(a.country || "us").toLowerCase();
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/${country}/rss/customerreviews/id=${a.appId}/sortBy=mostRecent/json`);
    const raw = d?.feed?.entry;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const reviews = list.filter((x) => x["im:rating"]?.label);
    if (!reviews.length)
        return `No reviews returned for app ${a.appId}.`;
    return section(`${reviews.length} recent review(s)`, reviews.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r["im:rating"]?.label)}/5 — ${clean(r.title?.label)}\n   ${clean(r.content?.label).slice(0, 160)}`));
}
