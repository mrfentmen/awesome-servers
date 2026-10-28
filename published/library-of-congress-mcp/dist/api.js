/**
 * Library of Congress — keyless public API client.
 */
const BASE = "https://www.loc.gov";
const SOURCE = "Library of Congress";
const UA = "library-of-congress-mcp";
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
export async function getText(path, init) {
    const res = await request(path, init);
    return await res.text();
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
function results(d) {
    return Array.isArray(d?.results) ? d.results : [];
}
function resultLine(r) {
    const date = clean(r.date) || clean(r.dates?.[0]);
    return `${clean(r.title) || clean(r.id)}${date ? ` · ${date}` : ""}${r.id ? ` · ${clean(r.id)}` : ""}`;
}
export async function search(a) {
    const q = clean(a.query);
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const d = await getJson(`/search/?q=${encodeURIComponent(q)}&fo=json&c=${limit}`);
    const rows = results(d);
    if (!rows.length)
        return `No Library of Congress results for "${q}".`;
    return section(`${clean(d?.pagination?.of) || rows.length} result(s) for "${q}"`, rows.map((r, i) => `${i + 1}. ${resultLine(r)}`));
}
export async function item_detail(a) {
    const id = clean(a.id);
    if (!/^[0-9A-Za-z._-]{3,40}$/.test(id))
        throw new SourceError("id looks invalid");
    const d = await getJson(`/item/${encodeURIComponent(id)}/?fo=json`);
    const item = d?.item ?? {};
    if (!item.title && !item.id)
        throw new SourceError(`No item ${id}`);
    return section(clean(item.title) || id, [
        bullet("Date", item.date),
        bullet("Contributors", Array.isArray(item.contributor) ? item.contributor.slice(0, 5).join(", ") : item.contributor),
        bullet("Subjects", Array.isArray(item.subject) ? item.subject.slice(0, 6).join(", ") : item.subject),
        bullet("Format", Array.isArray(item.original_format) ? item.original_format.join(", ") : item.original_format),
        bullet("Collection", Array.isArray(item.partof) ? item.partof.slice(0, 3).join(", ") : item.partof),
        bullet("URL", d?.item?.link),
        bullet("Rights", item.rights),
    ]);
}
export async function collections(a) {
    const limit = clampLimit(a.limit, 10, 25);
    const d = await getJson(`/collections/?fo=json&c=${limit}`);
    const rows = results(d);
    if (!rows.length)
        throw new SourceError("No collections returned");
    return section(`${clean(d?.pagination?.of) || rows.length} collection(s)`, rows.map((r, i) => `${i + 1}. ${clean(r.title)} · ${clean(r.id)}`));
}
export async function collection_detail(a) {
    const slug = clean(a.slug).toLowerCase();
    if (!/^[a-z0-9-]{2,80}$/.test(slug))
        throw new SourceError("slug must be a collection slug");
    const d = await getJson(`/collections/${encodeURIComponent(slug)}/?fo=json`);
    if (!d?.title)
        throw new SourceError(`No collection ${slug}`);
    return section(clean(d.title), [
        bullet("Items", d?.pagination?.of ?? d?.total),
        bullet("Subjects", Array.isArray(d?.subjects) ? d.subjects.slice(0, 6).map((s) => clean(s.title ?? s)).join(", ") : ""),
        bullet("Original formats", Array.isArray(d?.original_formats) ? d.original_formats.slice(0, 6).map((s) => clean(s.title ?? s)).join(", ") : ""),
        bullet("Part of", Array.isArray(d?.partof) ? d.partof.slice(0, 3).map((s) => clean(s.title ?? s)).join(", ") : ""),
    ]);
}
export async function search_format(a) {
    const q = clean(a.query);
    const format = clean(a.format).toLowerCase();
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const d = await getJson(`/search/?q=${encodeURIComponent(q)}&fa=original-format:${encodeURIComponent(format)}&fo=json&c=${limit}`);
    const rows = results(d);
    if (!rows.length)
        return `No "${format}" results for "${q}".`;
    return section(`${clean(d?.pagination?.of) || rows.length} ${format} result(s) for "${q}"`, rows.map((r, i) => `${i + 1}. ${resultLine(r)}`));
}
