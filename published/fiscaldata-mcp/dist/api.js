/**
 * Treasury Fiscal Data — keyless public API client.
 */
const BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service";
const SOURCE = "Treasury Fiscal Data";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "fiscaldata-mcp", accept },
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
const money = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n))
        return String(v ?? "");
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};
async function rows(path, limit) {
    const d = await getJson(`${path}?sort=-record_date&page[size]=${limit}`);
    return Array.isArray(d?.data) ? d.data : [];
}
export async function nationalDebt(a) {
    const r = await rows("/v2/accounting/od/debt_to_penny", a.history);
    if (!r.length)
        throw new SourceError("Treasury returned no debt records");
    const lines = r.map((x) => `${x.record_date}: ${money(x.tot_pub_debt_out_amt)} (public ${money(x.debt_held_public_amt)}, intragov ${money(x.intragov_hold_amt)})`);
    return ["US total public debt outstanding:", ...lines].join("\n");
}
export async function averageInterestRates(a) {
    const r = await rows("/v2/accounting/od/avg_interest_rates", a.limit);
    if (!r.length)
        throw new SourceError("Treasury returned no interest rate records");
    return [`Average interest rates (${r.length} rows):`, ...r.map((x) => `${x.record_date} · ${x.security_type_desc} · ${x.security_desc}: ${x.avg_interest_rate_amt}%`)].join("\n");
}
export async function monthlyTreasuryStatement(a) {
    const r = await rows("/v1/accounting/mts/mts_table_1", a.limit);
    if (!r.length)
        throw new SourceError("Treasury returned no MTS records");
    return [`Monthly Treasury Statement (${r.length} rows):`, ...r.map((x) => [
            `${x.record_date} · ${x.classification_desc}`,
            `  receipts ${money(x.current_month_gross_rcpt_amt)} · outlays ${money(x.current_month_gross_outly_amt)} · deficit/surplus ${money(x.current_month_dfct_sur_amt)}`,
        ].join("\n"))].join("\n");
}
