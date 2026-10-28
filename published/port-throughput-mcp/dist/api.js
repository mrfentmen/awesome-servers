/**
 * USDOT BTS port data — keyless public API client.
 */
const BASE = "https://data.bts.gov";
const SOURCE = "USDOT BTS";
const UA = "port-throughput-mcp";
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
const RESOURCE = "/resource/5rpz-kgm9.json";
function portLine(r, i) {
    const vol = Number(r.volume);
    return `${i + 1}. ${clean(r.port_name)} (${clean(r.port_id)}) · ${clean(r.cargo_type)} · ${Number.isFinite(vol) ? vol.toLocaleString("en-US") : "?"} ${clean(r.units)} · ${clean(r.reporting_year)}`;
}
export async function top_ports(a) {
    const limit = clampLimit(a.limit, 10, 25);
    const filters = [`reporting_year='${a.year}'`];
    if (a.cargoType)
        filters.push(`cargo_type='${clean(a.cargoType).toUpperCase()}'`);
    const where = encodeURIComponent(filters.join(" AND "));
    const select = encodeURIComponent("port_name,port_id,cargo_type,units,sum(volume) AS volume,reporting_year");
    const d = await getJson(`${RESOURCE}?$select=${select}&$where=${where}&$group=port_name,port_id,cargo_type,units,reporting_year&$order=volume DESC&$limit=${limit}`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No port volumes for ${a.year}${a.cargoType ? ` (${a.cargoType})` : ""}.`;
    return section(`Top ${rows.length} port(s) by volume in ${a.year}${a.cargoType ? ` · ${a.cargoType}` : ""}`, rows.map(portLine));
}
export async function port_detail(a) {
    const id = clean(a.portId);
    const limit = clampLimit(a.limit, 15, 40);
    const where = encodeURIComponent(`port_id='${id}' AND reporting_year='${a.year}'`);
    const d = await getJson(`${RESOURCE}?$where=${where}&$limit=${limit}&$order=cargo_type`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No cargo rows for port ${id} in ${a.year}.`;
    return section(`${clean(rows[0].port_name)} · ${a.year}`, rows.map(portLine));
}
export async function ports_in_state(a) {
    const st = clean(a.state);
    const limit = clampLimit(a.limit, 10, 25);
    const where = encodeURIComponent(`state='${st}' AND reporting_year='${a.year}'`);
    const select = encodeURIComponent("port_name,port_id,state,cargo_type,units,sum(volume) AS volume,reporting_year");
    const d = await getJson(`${RESOURCE}?$select=${select}&$where=${where}&$group=port_name,port_id,state,cargo_type,units,reporting_year&$order=volume DESC&$limit=${limit}`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No ports found for ${st} in ${a.year}.`;
    return section(`${rows.length} port row(s) in ${st} · ${a.year}`, rows.map(portLine));
}
export async function port_trend(a) {
    const id = clean(a.portId);
    const limit = clampLimit(a.limit, 12, 30);
    const filters = [`port_id='${id}'`];
    if (a.cargoType)
        filters.push(`cargo_type='${clean(a.cargoType).toUpperCase()}'`);
    const where = encodeURIComponent(filters.join(" AND "));
    const d = await getJson(`${RESOURCE}?$where=${where}&$limit=${limit}&$order=reporting_year DESC`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No trend data for port ${id}.`;
    return section(`${clean(rows[0].port_name)} volume trend`, rows.map((r, i) => `${i + 1}. ${clean(r.reporting_year)} · ${clean(r.cargo_type)} · ${Number(r.volume).toLocaleString("en-US")} ${clean(r.units)} · ${clean(r.trade_type)}`));
}
export async function cargo_types(a) {
    const select = encodeURIComponent("cargo_type,units,count(*) AS rows");
    const d = await getJson(`${RESOURCE}?$select=${select}&$group=cargo_type,units&$order=rows DESC&$limit=40`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        throw new SourceError("No cargo types returned");
    return section(`${rows.length} cargo type / unit pair(s)`, rows.map((r, i) => `${i + 1}. ${clean(r.cargo_type)} · ${clean(r.units)} · ${clean(r.rows)} rows`));
}
