/**
 * Water Quality Portal — keyless public API client.
 */
const BASE = "https://www.waterqualitydata.us";
const SOURCE = "Water Quality Portal";
const UA = "water-quality-portal-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 45000) {
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
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                }
                else
                    quoted = false;
            }
            else
                field += c;
        }
        else if (c === '"')
            quoted = true;
        else if (c === ",") {
            row.push(field);
            field = "";
        }
        else if (c === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        }
        else if (c !== "\r")
            field += c;
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}
function csvObjects(text) {
    const rows = parseCsv(text);
    if (!rows.length)
        return [];
    const head = rows[0];
    return rows.slice(1).filter((r) => r.length > 1).map((r) => {
        const out = {};
        head.forEach((h, i) => { out[h] = r[i] ?? ""; });
        return out;
    });
}
export async function stations_near(a) {
    const limit = clampLimit(a.limit, 15, 50);
    const text = await getText(`/data/Station/search?lat=${a.lat}&long=${a.lon}&within=${a.within}&mimeType=csv&zip=no`);
    const rows = csvObjects(text);
    if (!rows.length)
        return `No monitoring stations within ${a.within} miles of ${a.lat}, ${a.lon}.`;
    return section(`${rows.length} station(s) within ${a.within} miles`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.MonitoringLocationName)} · ${clean(r.MonitoringLocationIdentifier)} · ${clean(r.LatitudeMeasure)}, ${clean(r.LongitudeMeasure)} · ${clean(r.CountyName)}`));
}
export async function station_detail(a) {
    const site = clean(a.siteId);
    if (site.length < 3)
        throw new SourceError("siteId is required");
    const text = await getText(`/data/Station/search?siteid=${encodeURIComponent(site)}&mimeType=csv&zip=no`);
    const rows = csvObjects(text);
    if (!rows.length)
        throw new SourceError(`No station ${site}`);
    const r = rows[0];
    return section(clean(r.MonitoringLocationName), [
        bullet("Id", r.MonitoringLocationIdentifier),
        bullet("Organisation", r.OrganizationFormalName),
        bullet("Type", r.MonitoringLocationTypeName),
        bullet("Coordinates", `${clean(r.LatitudeMeasure)}, ${clean(r.LongitudeMeasure)}`),
        bullet("County", r.CountyName),
        bullet("HUC8", r.HUCEightDigitCode),
    ]);
}
export async function results_by_site(a) {
    const site = clean(a.siteId);
    const limit = clampLimit(a.limit, 15, 50);
    const text = await getText(`/data/Result/search?siteid=${encodeURIComponent(site)}&mimeType=csv&zip=no&sorted=no`);
    const rows = csvObjects(text);
    if (!rows.length)
        return `No sample results for ${site}.`;
    return section(`${rows.length} result(s) at ${site}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.ActivityStartDate)} · ${clean(r.CharacteristicName)}: ${clean(r.ResultMeasureValue)} ${clean(r["ResultMeasure/MeasureUnitCode"])}`));
}
export async function results_by_characteristic(a) {
    const site = clean(a.siteId);
    const ch = clean(a.characteristic);
    if (ch.length < 2)
        throw new SourceError("characteristic must be at least 2 characters");
    const limit = clampLimit(a.limit, 15, 50);
    const text = await getText(`/data/Result/search?siteid=${encodeURIComponent(site)}&characteristicName=${encodeURIComponent(ch)}&mimeType=csv&zip=no&sorted=no`);
    const rows = csvObjects(text);
    if (!rows.length)
        return `No ${ch} results for ${site}.`;
    return section(`${rows.length} ${ch} result(s)`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.ActivityStartDate)} · ${clean(r.ResultMeasureValue)} ${clean(r["ResultMeasure/MeasureUnitCode"])}`));
}
export async function activities_by_site(a) {
    const site = clean(a.siteId);
    const limit = clampLimit(a.limit, 15, 50);
    const text = await getText(`/data/Activity/search?siteid=${encodeURIComponent(site)}&mimeType=csv&zip=no`);
    const rows = csvObjects(text);
    if (!rows.length)
        return `No sampling activities for ${site}.`;
    return section(`${rows.length} activity(ies) at ${site}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.ActivityStartDate)} · ${clean(r.ActivityMediaName)} · ${clean(r.ActivityTypeCode)} · ${clean(r.ActivityIdentifier)}`));
}
