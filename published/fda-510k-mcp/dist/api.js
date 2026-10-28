/**
 * openFDA 510(k) Clearances — keyless public API client.
 */
const BASE = "https://api.fda.gov";
const SOURCE = "openFDA";
const UA = "fda-510k-mcp";
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
function clearanceLine(r) {
    return `${clean(r.k_number)} · ${clean(r.device_name)} · ${clean(r.applicant)} · ${clean(r.decision_date)} · ${clean(r.decision_description) || clean(r.decision_code)}`;
}
export async function search_clearances(a) {
    const term = clean(a.device);
    if (term.length < 2)
        throw new SourceError("device must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`device_name:"${term}"`);
    const d = await maybeJson(`/device/510k.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No 510(k) clearances for device "${term}".`;
    return section(`${rows.length} clearance(s) for "${term}"`, rows.map((r, i) => `${i + 1}. ${clearanceLine(r)}`));
}
export async function clearance_detail(a) {
    const k = clean(a.kNumber).toUpperCase();
    if (!/^K\d{6}$/.test(k))
        throw new SourceError("kNumber must look like K240001");
    const search = encodeURIComponent(`k_number:"${k}"`);
    const d = await maybeJson(`/device/510k.json?limit=1&search=${search}`);
    const r = Array.isArray(d?.results) ? d.results[0] : null;
    if (!r)
        throw new SourceError(`No 510(k) clearance ${k}`);
    return section(`${clean(r.k_number)} · ${clean(r.device_name)}`, [
        bullet("Applicant", r.applicant),
        bullet("Decision", r.decision_description),
        bullet("Decision date", r.decision_date),
        bullet("Clearance type", r.clearance_type),
        bullet("Product code", r.product_code),
        bullet("Advisory committee", r.advisory_committee_description),
        bullet("Summary", r.statement_or_summary),
        bullet("Location", [clean(r.city), clean(r.state), clean(r.country_code)].filter(Boolean).join(", ")),
    ]);
}
export async function clearances_by_applicant(a) {
    const name = clean(a.applicant);
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`applicant:"${name}"`);
    const d = await maybeJson(`/device/510k.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No 510(k) clearances for "${name}".`;
    return section(`${rows.length} clearance(s) for ${name}`, rows.map((r, i) => `${i + 1}. ${clearanceLine(r)}`));
}
export async function clearances_by_product_code(a) {
    const code = clean(a.productCode).toUpperCase();
    if (!/^[A-Z]{2,5}$/.test(code))
        throw new SourceError("productCode must be 2-5 letters");
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`product_code:"${code}"`);
    const d = await maybeJson(`/device/510k.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No 510(k) clearances for product code ${code}.`;
    return section(`${rows.length} clearance(s) for product code ${code}`, rows.map((r, i) => `${i + 1}. ${clearanceLine(r)}`));
}
export async function clearances_by_year(a) {
    const year = a.year;
    const limit = clampLimit(a.limit, 10, 25);
    const search = encodeURIComponent(`decision_date:[${year}0101 TO ${year}1231]`);
    const d = await maybeJson(`/device/510k.json?limit=${limit}&search=${search}`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        return `No 510(k) clearances decided in ${year}.`;
    return section(`${rows.length} clearance(s) decided in ${year} (total ${clean(d?.meta?.results?.total) || "?"})`, rows.map((r, i) => `${i + 1}. ${clearanceLine(r)}`));
}
export async function clearance_stats(a) {
    const d = await maybeJson("/device/510k.json?limit=1000");
    const rows = Array.isArray(d?.results) ? d.results : [];
    if (!rows.length)
        throw new SourceError("No 510(k) records returned");
    const counts = new Map();
    for (const r of rows) {
        const k = clean(r.advisory_committee_description) || "unknown";
        counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const lines = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 15).map(([k, v]) => `${k}: ${v}`);
    return section(`510(k) clearances by advisory committee (${rows.length} sampled)`, lines);
}
