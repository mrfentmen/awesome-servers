/**
 * FEMA OpenFEMA — keyless public API client.
 */
const BASE = "https://www.fema.gov/api/open/v2";
const SOURCE = "OpenFEMA";
const UA = "fema-disasters-mcp";
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
function femaRows(d) {
    return Array.isArray(d?.DisasterDeclarationsSummaries) ? d.DisasterDeclarationsSummaries : [];
}
function femaLine(x, i) {
    return `${i + 1}. ${clean(x.declarationTitle) || "untitled"} — ${clean(x.state)} · ${clean(x.declarationType)}/${clean(x.incidentType)} · declared ${clean(x.declarationDate).slice(0, 10)} · DR-${clean(x.disasterNumber)}`;
}
export async function recent_disasters(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/DisasterDeclarationsSummaries?$top=${limit}&$orderby=declarationDate%20desc`);
    const list = femaRows(d);
    if (!list.length)
        return "No disaster declarations returned.";
    return section(`${list.length} most recent declaration(s)`, list.map(femaLine));
}
export async function disasters_by_state(a) {
    const state = clean(a.state).toUpperCase();
    if (!/^[A-Z]{2}$/.test(state))
        throw new SourceError("state must be a two-letter code");
    const limit = clampLimit(a.limit, 10, 50);
    const filter = encodeURIComponent(`state eq '${state}'`);
    const d = await getJson(`/DisasterDeclarationsSummaries?$top=${limit}&$filter=${filter}&$orderby=declarationDate%20desc`);
    const list = femaRows(d);
    if (!list.length)
        return `No disaster declarations for ${state}.`;
    return section(`${state}: ${list.length} recent declaration(s)`, list.map(femaLine));
}
export async function disasters_by_type(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const filter = encodeURIComponent(`declarationType eq '${a.type}'`);
    const d = await getJson(`/DisasterDeclarationsSummaries?$top=${limit}&$filter=${filter}&$orderby=declarationDate%20desc`);
    const list = femaRows(d);
    if (!list.length)
        return `No ${a.type} declarations returned.`;
    return section(`${a.type}: ${list.length} recent declaration(s)`, list.map(femaLine));
}
export async function disasters_by_year(a) {
    if (!Number.isInteger(a.year) || a.year < 1950 || a.year > 2100)
        throw new SourceError("year must be between 1950 and 2100");
    const limit = clampLimit(a.limit, 10, 50);
    const filter = encodeURIComponent(`fyDeclared eq ${a.year}`);
    const d = await getJson(`/DisasterDeclarationsSummaries?$top=${limit}&$filter=${filter}&$orderby=declarationDate%20desc`);
    const list = femaRows(d);
    if (!list.length)
        return `No declarations for fiscal year ${a.year}.`;
    return section(`FY${a.year}: ${list.length} recent declaration(s)`, list.map(femaLine));
}
export async function disaster_detail(a) {
    if (!Number.isInteger(a.number) || a.number < 1)
        throw new SourceError("number must be a positive integer");
    const filter = encodeURIComponent(`disasterNumber eq ${a.number}`);
    const d = await getJson(`/DisasterDeclarationsSummaries?$top=50&$filter=${filter}`);
    const list = femaRows(d);
    if (!list.length)
        return `No declaration for disaster ${a.number}.`;
    const x = list[0];
    return section(`${clean(x.declarationTitle)} — DR-${a.number}`, [
        bullet("State", x.state),
        bullet("Type", `${clean(x.declarationType)} / ${clean(x.incidentType)}`),
        bullet("Declared", clean(x.declarationDate).slice(0, 10)),
        bullet("Incident period", `${clean(x.incidentBeginDate).slice(0, 10)} → ${clean(x.incidentEndDate).slice(0, 10)}`),
        bullet("Designated areas", `${list.length} area record(s)`),
    ]);
}
