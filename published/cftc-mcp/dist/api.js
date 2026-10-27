/**
 * CFTC Commitments of Traders — keyless public API client.
 */
const BASE = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";
const SOURCE = "CFTC Commitments of Traders";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "cftc-mcp", accept },
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
function fmt(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v.toLocaleString("en-US") : String(n ?? "");
}
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
async function fetchRows(market, limit) {
    const m = market.trim();
    if (m.length < 2)
        throw new SourceError("market name must be at least 2 characters");
    const where = encodeURIComponent(`market_and_exchange_names like '%${m.replace(/'/g, "''").toUpperCase()}%'`);
    const d = await getJson(`?$where=${where}&$order=report_date_as_yyyy_mm_dd DESC&$limit=${limit}`);
    if (!Array.isArray(d))
        throw new SourceError("CFTC returned an unexpected response");
    return d;
}
function block(r) {
    const date = String(r.report_date_as_yyyy_mm_dd ?? "").slice(0, 10);
    const oi = num(r.open_interest_all);
    return [
        `${date} · ${r.market_and_exchange_names}`,
        `  open interest: ${fmt(oi)}`,
        `  non-commercial: long ${fmt(r.noncomm_positions_long_all)} / short ${fmt(r.noncomm_positions_short_all)}`,
        `  commercial: long ${fmt(r.comm_positions_long_all)} / short ${fmt(r.comm_positions_short_all)}`,
        `  non-reportable: long ${fmt(r.nonrept_positions_long_all)} / short ${fmt(r.nonrept_positions_short_all)}`,
        `  net non-commercial: ${fmt(num(r.noncomm_positions_long_all) - num(r.noncomm_positions_short_all))}`,
    ].join("\n");
}
export async function latestCotReport(a) {
    const rows = await fetchRows(a.market, 1);
    if (!rows.length)
        return `CFTC has no market matching "${a.market}".`;
    return [`Latest COT report for "${a.market}":`, block(rows[0])].join("\n");
}
export async function cotHistory(a) {
    const rows = await fetchRows(a.market, a.limit);
    if (!rows.length)
        return `CFTC has no market matching "${a.market}".`;
    return [`${rows.length} weekly COT reports for "${a.market}":`, ...rows.map(block)].join("\n\n");
}
export async function searchMarkets(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const where = encodeURIComponent(`market_and_exchange_names like '%${q.replace(/'/g, "''").toUpperCase()}%'`);
    const d = await getJson(`?$select=market_and_exchange_names&$where=${where}&$group=market_and_exchange_names&$limit=${a.limit}`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No CFTC market matches "${q}".`;
    return [`${rows.length} markets matching "${q}":`, ...rows.map((r, i) => `${i + 1}. ${r.market_and_exchange_names}`)].join("\n");
}
