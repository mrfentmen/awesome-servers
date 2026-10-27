/**
 * Chronicling America — keyless public API client.
 */
const BASE = "https://www.loc.gov";
const SOURCE = "Chronicling America";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "chronam-mcp", accept },
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
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
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
function checkQuery(q) {
    const v = clean(q);
    if (v.length < 2)
        throw new SourceError("query must be at least 2 characters");
    return v;
}
function checkLimit(n, max, fallback) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
async function locJson(path, timeoutMs = 60000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`https://www.loc.gov${path}`, {
            signal: ctrl.signal,
            headers: { "user-agent": "chronam-mcp", accept: "application/json" },
        });
        if (!res.ok)
            throw new SourceError(`Chronicling America responded ${res.status}`);
        const body = await res.text();
        try {
            return JSON.parse(body);
        }
        catch {
            throw new SourceError("Chronicling America returned malformed JSON");
        }
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`Chronicling America did not answer within ${Math.round(timeoutMs / 1000)}s`);
        throw new SourceError(`Chronicling America request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
function pageLine(r) {
    const parts = [
        clean(r.title) || "untitled page",
        `  ${clean(r.date) || "date unknown"}${r.partof_title ? ` · ${clean(r.partof_title)}` : ""}`,
    ];
    if (r.url)
        parts.push(`  ${r.url}`);
    return parts.join("\n");
}
export async function searchPages(a) {
    const query = checkQuery(a.query);
    const limit = checkLimit(a.limit, 25, 10);
    const params = new URLSearchParams({ q: query, fo: "json", c: String(limit) });
    if (a.state)
        params.append("fa", `location_state:${clean(a.state).toLowerCase()}`);
    if (a.yearStart !== undefined && a.yearEnd !== undefined)
        params.append("dates", `${a.yearStart}/${a.yearEnd}`);
    else if (a.yearStart !== undefined)
        params.append("dates", `${a.yearStart}/${a.yearStart}`);
    else if (a.yearEnd !== undefined)
        params.append("dates", `${a.yearEnd}/${a.yearEnd}`);
    const d = await locJson(`/collections/chronicling-america/?${params.toString()}`);
    const rows = d?.results ?? [];
    if (!rows.length)
        return `Chronicling America has no page for "${query}"${a.state ? ` in ${clean(a.state)}` : ""}.`;
    const total = d?.pagination?.of ?? rows.length;
    return [
        `Chronicling America pages for "${query}" - ${total} matches, showing ${rows.length}:`,
        "",
        ...rows.map(pageLine),
    ].join("\n");
}
export async function pageDetail(a) {
    const raw = clean(a.id);
    if (raw.length < 6)
        throw new SourceError("id must be a loc.gov newspaper resource id");
    if (!/^[a-z]{2}\d|^https?:\/\//i.test(raw))
        throw new SourceError("id must look like sn83016025/1896-05-09/ed-1/?sp=11");
    const path = raw.startsWith("http") ? raw.replace(/^https?:\/\/www\.loc\.gov/, "") : `/resource/${raw}`;
    const join = path.includes("?") ? "&" : "?";
    const d = await locJson(`${path}${join}fo=json&at=item,resources`);
    const item = d?.item;
    if (!item)
        throw new SourceError(`No newspaper page at ${raw}`);
    const title = Array.isArray(item.title) ? item.title[0] : item.title;
    const date = Array.isArray(item.date) ? item.date[0] : item.date;
    const ocr = (d?.resources ?? []).flatMap((r) => (r?.files ?? [])).find((f) => /ocr|text/i.test(String(f?.mimetype ?? f?.format ?? "")));
    return [
        `${clean(title) || "Untitled page"}`,
        date ? `Published: ${clean(date)}` : "",
        item.newspaper_title ? `Newspaper: ${clean(item.newspaper_title)}` : "",
        item.location_state ? `State: ${clean(item.location_state)}` : "",
        item.number_page ? `Page: ${clean(item.number_page)}` : "",
        item.number_lccn ? `LCCN: ${clean(item.number_lccn)}` : "",
        ocr?.url ? `OCR text: ${ocr.url}` : "",
        `Page: https://www.loc.gov/resource/${raw.replace(/^\/?resource\//, "")}`,
    ].filter(Boolean).join("\n");
}
export async function searchTitles(a) {
    const query = checkQuery(a.query);
    const limit = checkLimit(a.limit, 25, 10);
    const params = new URLSearchParams({ q: query, dl: "title", fo: "json", c: String(limit), at: "results,pagination" });
    const d = await locJson(`/collections/chronicling-america/?${params.toString()}`);
    const rows = d?.results ?? [];
    if (!rows.length)
        return `No digitised newspaper title matches "${query}".`;
    const list = (v) => (Array.isArray(v) ? v.map((x) => clean(x)).filter(Boolean).join(", ") : clean(v));
    return [
        `Digitised newspaper titles matching "${query}" - ${d?.pagination?.of ?? rows.length} total, showing ${rows.length}:`,
        "",
        ...rows.map((r) => [
            clean(r.title) || "untitled",
            `  ${[list(r.location_city), list(r.location_state)].filter(Boolean).join(", ") || "place unknown"}${r.date ? ` · ${clean(r.date)}` : ""}`,
            list(r.number_lccn) ? `  LCCN ${list(r.number_lccn)}` : "",
            r.url ? `  ${clean(r.url)}` : "",
        ].filter(Boolean).join("\n")),
    ].join("\n");
}
