/**
 * ProPublica Nonprofit Explorer — keyless public API client.
 */
const BASE = "https://projects.propublica.org/nonprofits/api/v2";
const SOURCE = "Nonprofit Explorer";
const UA = "propublica-nonprofits-mcp";
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
export async function search_organizations(a) {
    const query = clean(a.query);
    if (query.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const state = a.state ? `&state%5Bid%5D=${encodeURIComponent(clean(a.state).toUpperCase())}` : "";
    const d = await getJson(`/search.json?q=${encodeURIComponent(query)}${state}`);
    const list = Array.isArray(d?.organizations) ? d.organizations : [];
    if (!list.length)
        return `No nonprofit matches "${query}".`;
    return section(`${d?.total_results ?? list.length} organisation(s) match "${query}"`, list.slice(0, limit).map((o, i) => `${i + 1}. ${clean(o.name)} — ${clean(o.city)}, ${clean(o.state)} · EIN ${clean(o.ein)}`));
}
export async function search_by_state(a) {
    const state = clean(a.state).toUpperCase();
    if (!/^[A-Z]{2}$/.test(state))
        throw new SourceError("state must be a two-letter code");
    const limit = clampLimit(a.limit, 10, 25);
    const d = await getJson(`/search.json?q=&state%5Bid%5D=${state}`);
    const list = Array.isArray(d?.organizations) ? d.organizations : [];
    if (!list.length)
        return `No nonprofits returned for ${state}.`;
    return section(`${d?.total_results ?? list.length} organisation(s) in ${state}`, list.slice(0, limit).map((o, i) => `${i + 1}. ${clean(o.name)} — ${clean(o.city)} · EIN ${clean(o.ein)}`));
}
export async function organization(a) {
    const ein = clean(a.ein);
    if (!/^\d{9}$/.test(ein))
        throw new SourceError("ein must be nine digits");
    const d = await getJson(`/organizations/${ein}.json`);
    const o = d?.organization;
    if (!o)
        throw new SourceError(`No organisation with EIN ${ein}`);
    return section(clean(o.name), [
        bullet("EIN", clean(o.ein)),
        bullet("Address", [o.address, o.city, o.state, o.zipcode].filter(Boolean).map(clean).join(", ")),
        bullet("Subsection", o.subsection_code),
        bullet("Ruling date", o.ruling_date),
        bullet("NTEE", o.ntee_code),
    ]);
}
export async function filings(a) {
    const ein = clean(a.ein);
    if (!/^\d{9}$/.test(ein))
        throw new SourceError("ein must be nine digits");
    const d = await getJson(`/organizations/${ein}.json`);
    const list = Array.isArray(d?.filings_with_data) ? d.filings_with_data : [];
    if (!list.length)
        return `No filings with extracted data for EIN ${ein}.`;
    return section(`${list.length} filing(s) with data`, list.slice(0, 15).map((f, i) => `${i + 1}. ${clean(f.tax_prd_yr)} · revenue ${clean(f.totrevenue)} · expenses ${clean(f.totfuncexpns)} · ${clean(f.formtype)}`));
}
export async function financials(a) {
    const ein = clean(a.ein);
    if (!/^\d{9}$/.test(ein))
        throw new SourceError("ein must be nine digits");
    const d = await getJson(`/organizations/${ein}.json`);
    const f = Array.isArray(d?.filings_with_data) ? d.filings_with_data[0] : undefined;
    if (!f)
        return `EIN ${ein} has no filing with extracted financials.`;
    return section(`${clean(d?.organization?.name)} — ${clean(f.tax_prd_yr)}`, [
        bullet("Revenue", f.totrevenue),
        bullet("Expenses", f.totfuncexpns),
        bullet("Assets", f.totassetsend),
        bullet("Liabilities", f.totliabend),
        bullet("Employees", f.numemp),
        bullet("Form", f.formtype),
    ]);
}
