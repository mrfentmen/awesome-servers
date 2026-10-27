/**
 * Indian Mutual Funds — keyless public API client.
 */
const BASE = "https://api.mfapi.in";
const SOURCE = "Indian Mutual Funds";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "mfapi-mcp", accept },
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
function checkCode(code) {
    if (!Number.isInteger(code) || code < 1)
        throw new SourceError("schemeCode must be a positive integer");
    return code;
}
function metaLines(meta) {
    return [
        clean(meta?.scheme_name) ? `Scheme: ${clean(meta.scheme_name)}` : "",
        clean(meta?.fund_house) ? `Fund house: ${clean(meta.fund_house)}` : "",
        clean(meta?.scheme_category) ? `Category: ${clean(meta.scheme_category)}` : "",
        clean(meta?.scheme_type) ? `Type: ${clean(meta.scheme_type)}` : "",
        clean(meta?.isin_growth) ? `ISIN (growth): ${clean(meta.isin_growth)}` : "",
    ].filter(Boolean);
}
export async function searchSchemes(a) {
    const q = clean(a.query);
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = a.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 30)
        throw new SourceError("limit must be between 1 and 30");
    const rows = await getJson(`/mf/search?q=${encodeURIComponent(q)}`);
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length)
        return `No mutual fund scheme matches "${q}".`;
    return [
        `${list.length} scheme(s) matching "${q}" - showing up to ${limit}:`,
        "",
        ...list.slice(0, limit).map((r) => `- ${r.schemeCode} · ${clean(r.schemeName)}`),
    ].join("\n");
}
export async function latestNav(a) {
    const code = checkCode(Math.trunc(a.schemeCode));
    const d = await getJson(`/mf/${code}`);
    const meta = d?.meta;
    const latest = Array.isArray(d?.data) ? d.data[0] : undefined;
    if (!meta && !latest)
        throw new SourceError(`MFapi has no scheme ${code}`);
    return [
        `Scheme ${code}${meta?.scheme_code ? "" : " (code not confirmed by MFapi)"}`,
        ...metaLines(meta),
        latest ? `NAV on ${clean(latest.date)}: ₹${clean(latest.nav)}` : "No NAV points published.",
    ].filter(Boolean).join("\n");
}
export async function navHistory(a) {
    const code = checkCode(Math.trunc(a.schemeCode));
    const days = a.days ?? 30;
    if (!Number.isInteger(days) || days < 5 || days > 365)
        throw new SourceError("days must be between 5 and 365");
    const d = await getJson(`/mf/${code}`);
    const rows = Array.isArray(d?.data) ? d.data : [];
    if (!rows.length)
        return `MFapi has no NAV history for scheme ${code}.`;
    const slice = rows.slice(0, days);
    const oldest = slice[slice.length - 1];
    const newest = slice[0];
    const change = Number(newest.nav) - Number(oldest.nav);
    const pct = Number(oldest.nav) ? (change / Number(oldest.nav)) * 100 : 0;
    return [
        `${clean(d?.meta?.scheme_name) || `Scheme ${code}`}`,
        `Points: ${slice.length} · ${clean(oldest.date)} → ${clean(newest.date)}`,
        `NAV: ₹${clean(oldest.nav)} → ₹${clean(newest.nav)} (${change >= 0 ? "+" : ""}${change.toFixed(4)}, ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
        "",
        ...slice.slice(0, 15).map((r) => `${clean(r.date)}  ₹${clean(r.nav)}`),
        slice.length > 15 ? `... ${slice.length - 15} more points not shown` : "",
    ].filter(Boolean).join("\n");
}
