/**
 * USACE CWMS — keyless public API client.
 */
const BASE = "https://cwms-data.usace.army.mil/cwms-data";
const SOURCE = "USACE CWMS";
const UA = "usace-water-mcp";
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
export async function offices(a) {
    const d = await getJson("/offices?format=json");
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        throw new SourceError("CWMS returned no offices");
    return section(`${rows.length} office(s)`, rows.map((o, i) => `${i + 1}. ${clean(o.name)} · ${clean(o["long-name"])}`));
}
export async function projects(a) {
    const off = clean(a.office).toUpperCase();
    if (!/^[A-Z]{2,5}$/.test(off))
        throw new SourceError("office must be a CWMS office code");
    const limit = clampLimit(a.limit, 30, 100);
    const d = await getJson(`/projects?office=${off}&format=json`);
    const rows = Array.isArray(d?.projects) ? d.projects : [];
    if (!rows.length)
        return `No projects for office ${off}.`;
    return section(`${d["total"] ?? rows.length} project(s) for ${off}, showing ${Math.min(limit, rows.length)}`, rows.slice(0, limit).map((p, i) => `${i + 1}. ${clean(p.location?.["public-name"]) || clean(p.location?.name)} · ${clean(p.location?.["long-name"])} · ${clean(p.location?.name)}`));
}
export async function project(a) {
    const off = clean(a.office).toUpperCase();
    const name = clean(a.name).toUpperCase();
    if (!/^[A-Z]{2,5}$/.test(off))
        throw new SourceError("office must be a CWMS office code");
    if (!name)
        throw new SourceError("name is required");
    const d = await getJson(`/projects/${encodeURIComponent(name)}?office=${off}&format=json`);
    if (!d?.location)
        throw new SourceError(`No project ${name} in ${off}`);
    return section(clean(d.location["public-name"]) || name, [
        clean(d.location["long-name"]),
        bullet("Location", d.location.name),
        bullet("Office", d.location["office-id"]),
        bullet("Federal cost", d["federal-cost"]),
        bullet("Non-federal cost", d["non-federal-cost"]),
        bullet("Authorised", d.authorizing_law),
    ]);
}
export async function levels(a) {
    const off = clean(a.office).toUpperCase();
    if (!/^[A-Z]{2,5}$/.test(off))
        throw new SourceError("office must be a CWMS office code");
    const limit = clampLimit(a.limit, 25, 100);
    const d = await getJson(`/levels?office=${off}&format=json&unit=${a.unit}`);
    const rows = Array.isArray(d?.["location-levels-catalog"]?.["location-levels"]) ? d["location-levels-catalog"]["location-levels"] : [];
    if (!rows.length)
        return `No level gauges for office ${off}.`;
    return section(`${rows.length} level gauge(s) for ${off}, showing ${Math.min(limit, rows.length)}`, rows.slice(0, limit).map((l, i) => {
        const alt = Array.isArray(l["alternate-names"]) && l["alternate-names"].length ? ` · also ${clean(l["alternate-names"][0])}` : "";
        return `${i + 1}. ${clean(l.name)}${alt}`;
    }));
}
export async function time_series(a) {
    const off = clean(a.office).toUpperCase();
    const name = clean(a.name);
    if (!/^[A-Z]{2,5}$/.test(off))
        throw new SourceError("office must be a CWMS office code");
    if (name.length < 6)
        throw new SourceError("name must be a CWMS time series id");
    const iso = (s) => (/T/.test(s) ? s : `${s}T00:00:00Z`);
    const d = await getJson(`/timeseries?office=${off}&name=${encodeURIComponent(name)}&begin=${encodeURIComponent(iso(a.begin))}&end=${encodeURIComponent(iso(a.end))}&format=json`);
    const values = Array.isArray(d?.values) ? d.values : Array.isArray(d?.[0]?.values) ? d[0].values : [];
    if (!values.length)
        return `No values for ${name} between ${a.begin} and ${a.end}.`;
    const unit = clean(d?.units ?? d?.[0]?.units ?? "");
    return section(`${name} · ${values.length} value(s) · ${unit}`, values.slice(0, 40).map((v) => Array.isArray(v) ? `${clean(v[0])} · ${clean(v[1])}` : `${clean(v["date-time"] ?? v.date ?? v.time)} · ${clean(v.value)}`));
}
