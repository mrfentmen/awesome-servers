/**
 * openFDA Drug Shortages — keyless public API client.
 */
const BASE = "https://api.fda.gov";
const SOURCE = "openFDA";
const UA = "drug-shortages-mcp";
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
async function maybeJson(path) {
    try {
        return await getJson(path);
    }
    catch (e) {
        if (e instanceof SourceError && /responded 404/.test(e.message))
            return { results: [] };
        throw e;
    }
}
export function asList(v) {
    if (Array.isArray(v))
        return v.map((x) => clean(x)).filter(Boolean);
    return v ? [clean(v)] : [];
}
function recordLine(r) {
    const o = r.openfda ?? {};
    const brand = asList(o.brand_name)[0] ?? asList(o.generic_name)[0] ?? clean(r.generic_name);
    const mfr = asList(o.manufacturer_name)[0] ?? clean(r.company_name);
    return `${clean(r.generic_name) || brand} · ${clean(r.availability) || "?"} · ${mfr || "?"} · updated ${clean(r.update_date) || clean(r.initial_posting_date)}`;
}
export async function search_shortages(a) {
    const term = clean(a.term);
    if (term.length < 2)
        throw new SourceError("term must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`generic_name:"${term}"`);
    const d = await maybeJson(`/drug/shortages.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No shortage records for "${term}".`;
    return section(`${rows.length} shortage record(s) for "${term}"`, rows.map((r, i) => `${i + 1}. ${recordLine(r)}`));
}
export async function shortages_by_status(a) {
    const status = clean(a.status);
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`availability:"${status}"`);
    const d = await maybeJson(`/drug/shortages.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No shortage records with availability "${status}".`;
    return section(`${rows.length} record(s) with availability "${status}"`, rows.map((r, i) => `${i + 1}. ${recordLine(r)}`));
}
export async function shortages_by_manufacturer(a) {
    const mfr = clean(a.manufacturer);
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`openfda.manufacturer_name:"${mfr}"`);
    const d = await maybeJson(`/drug/shortages.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No shortage records for manufacturer "${mfr}".`;
    return section(`${rows.length} record(s) for ${mfr}`, rows.map((r, i) => `${i + 1}. ${recordLine(r)}`));
}
export async function shortage_by_ndc(a) {
    const ndc = clean(a.ndc);
    if (!/^[0-9A-Za-z-]{5,20}$/.test(ndc))
        throw new SourceError("ndc looks invalid");
    const search = encodeURIComponent(`package_ndc:"${ndc}"`);
    const d = await maybeJson(`/drug/shortages.json?limit=5&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No shortage records for NDC ${ndc}.`;
    const r = rows[0];
    const o = r.openfda ?? {};
    return section(`${clean(r.generic_name)} · NDC ${ndc}`, [
        bullet("Availability", r.availability),
        bullet("Update type", r.update_type),
        bullet("Updated", r.update_date),
        bullet("Initially posted", r.initial_posting_date),
        bullet("Manufacturer", asList(o.manufacturer_name).join(", ")),
        bullet("Brand", asList(o.brand_name).join(", ")),
        bullet("Route", asList(o.route).join(", ")),
        bullet("Related info", r.related_info),
    ]);
}
export async function search_by_brand(a) {
    const brand = clean(a.brand);
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`openfda.brand_name:"${brand}"`);
    const d = await maybeJson(`/drug/shortages.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No shortage records for brand "${brand}".`;
    return section(`${rows.length} record(s) for brand ${brand}`, rows.map((r, i) => `${i + 1}. ${recordLine(r)}`));
}
export async function shortage_stats(a) {
    const d = await maybeJson("/drug/shortages.json?limit=1000");
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        throw new SourceError("No shortage records returned");
    const counts = new Map();
    for (const r of rows) {
        const k = clean(r.availability) || "unknown";
        counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const lines = [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}: ${v}`);
    return section(`${rows.length} sampled shortage records (total ${clean(d?.meta?.results?.total) || "?"})`, lines);
}
