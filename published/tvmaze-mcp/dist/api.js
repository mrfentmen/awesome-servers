/**
 * TVmaze — keyless public API client.
 */
const BASE = "https://api.tvmaze.com";
const SOURCE = "TVmaze";
const UA = "tvmaze-mcp";
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
export async function search_shows(a) {
    const query = clean(a.query);
    if (query.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 20);
    const d = await getJson(`/search/shows?q=${encodeURIComponent(query)}`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        return `TVmaze has no show matching "${query}".`;
    return section(`${list.length} show(s) match "${query}"`, list.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.show?.name)} · ${clean(r.show?.premiered) || "no premiere"} · ${clean(r.show?.rating?.average) || "unrated"} · id ${clean(r.show?.id)}`));
}
export async function show(a) {
    if (!Number.isInteger(a.showId) || a.showId < 1)
        throw new SourceError("showId must be a positive integer");
    const d = await getJson(`/shows/${a.showId}?embed=episodes`);
    if (!d?.id)
        throw new SourceError(`TVmaze has no show ${a.showId}`);
    const eps = Array.isArray(d?._embedded?.episodes) ? d._embedded.episodes : [];
    const summary = String(d.summary ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return section(clean(d.name), [
        bullet("Premiered", d.premiered),
        bullet("Genres", Array.isArray(d.genres) ? d.genres.join(", ") : ""),
        bullet("Rating", d.rating?.average),
        bullet("Episodes", eps.length),
        bullet("Summary", summary.slice(0, 500)),
        ...eps.slice(0, 8).map((e, i) => `${i + 1}. S${clean(e.season)}E${clean(e.number)} ${clean(e.name)}`),
    ]);
}
export async function schedule(a) {
    const country = clean(a.country || "US").toUpperCase();
    if (!/^[A-Z]{2}$/.test(country))
        throw new SourceError("country must be a two-letter code");
    const q = a.date ? `&date=${clean(a.date)}` : "";
    const d = await getJson(`/schedule?country=${country}${q}`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        return `No shows scheduled for ${country}${a.date ? " on " + clean(a.date) : ""}.`;
    return section(`${list.length} episode(s) scheduled`, list.slice(0, 25).map((e, i) => `${i + 1}. ${clean(e.show?.name)} S${clean(e.season)}E${clean(e.number)} · ${clean(e.airdate)} ${clean(e.airtime)}`));
}
export async function cast(a) {
    if (!Number.isInteger(a.showId) || a.showId < 1)
        throw new SourceError("showId must be a positive integer");
    const d = await getJson(`/shows/${a.showId}/cast`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        return `No cast listed for show ${a.showId}.`;
    return section(`${list.length} cast member(s)`, list.slice(0, 25).map((c, i) => `${i + 1}. ${clean(c.person?.name)} as ${clean(c.character?.name)}`));
}
export async function episode_by_number(a) {
    if (!Number.isInteger(a.showId) || a.showId < 1)
        throw new SourceError("showId must be a positive integer");
    const d = await getJson(`/shows/${a.showId}/episodebynumber?season=${a.season}&number=${a.number}`);
    if (!d?.id)
        throw new SourceError(`No episode S${a.season}E${a.number} for show ${a.showId}`);
    const summary = String(d.summary ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return section(`S${clean(d.season)}E${clean(d.number)} — ${clean(d.name)}`, [bullet("Aired", d.airdate), bullet("Runtime", clean(d.runtime) + " min"), bullet("Rating", d.rating?.average), bullet("Summary", summary.slice(0, 600))]);
}
