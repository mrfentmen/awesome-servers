/**
 * EPA SDWIS — keyless public API client.
 */
const BASE = "https://data.epa.gov/efservice";
const SOURCE = "EPA SDWIS";
const UA = "drinking-water-mcp";
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
export async function water_system(a) {
    const id = clean(a.pwsid).toUpperCase();
    if (!/^[A-Z0-9]{5,12}$/.test(id))
        throw new SourceError("pwsid must be letters and digits");
    const rows = await getJson(`/WATER_SYSTEM/PWSID/${encodeURIComponent(id)}/JSON`);
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length)
        throw new SourceError(`No water system ${id}`);
    const w = list[0];
    return section(clean(w.pws_name), [
        bullet("PWSID", w.pwsid),
        bullet("Type", { CWS: "community", TNCWS: "transient non-community", NTNCWS: "non-transient non-community" }[clean(w.pws_type_code)] || w.pws_type_code),
        bullet("Status", clean(w.pws_activity_code) === "A" ? "active" : clean(w.pws_activity_code) === "I" ? "inactive" : w.pws_activity_code),
        bullet("Source", clean(w.gw_sw_code) === "GW" ? "groundwater" : clean(w.gw_sw_code) === "SW" ? "surface water" : w.gw_sw_code),
        bullet("Owner", w.owner_type_code),
        bullet("Primary agency", w.primacy_agency_code),
        bullet("EPA region", w.epa_region),
        bullet("Population served", w.population_served_count),
        bullet("Service connections", w.service_connections_count),
        bullet("Deactivation date", w.pws_deactivation_date),
    ]);
}
export async function search_systems(a) {
    const st = clean(a.state).toUpperCase();
    if (!/^[A-Z]{2}$/.test(st))
        throw new SourceError("state must be a two letter code");
    const limit = clampLimit(a.limit, 15, 50);
    const name = clean(a.name).toLowerCase();
    const rows = await getJson(`/WATER_SYSTEM/STATE_CODE/${st}/JSON`);
    let list = Array.isArray(rows) ? rows : [];
    if (name)
        list = list.filter((w) => clean(w.pws_name).toLowerCase().includes(name));
    if (!list.length)
        return name ? `No water system in ${st} matches "${a.name}".` : `No water systems for ${st}.`;
    return section(`${list.length} system(s) in ${st}${name ? ` matching "${a.name}"` : ""}, showing ${Math.min(limit, list.length)}`, list.slice(0, limit).map((w, i) => `${i + 1}. ${clean(w.pws_name)} · ${clean(w.pwsid)} · ${clean(w.pws_type_code)} · ${clean(w.pws_activity_code) === "A" ? "active" : "inactive"} · pop ${w.population_served_count ?? "?"}`));
}
export async function violations(a) {
    const id = clean(a.pwsid).toUpperCase();
    if (!/^[A-Z0-9]{5,12}$/.test(id))
        throw new SourceError("pwsid must be letters and digits");
    const limit = clampLimit(a.limit, 20, 50);
    const rows = await getJson(`/VIOLATION/PWSID/${encodeURIComponent(id)}/JSON`);
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length)
        return `EPA SDWIS records no violations for ${id}.`;
    return section(`${list.length} violation(s) for ${id}`, list.slice(-limit).reverse().map((v, i) => `${i + 1}. ${clean(v.violation_code)} · ${clean(v.violation_category_code)} · ${clean(v.compliance_start_date)?.slice(0, 10)} to ${clean(v.compliance_end_date)?.slice(0, 10)} · ${clean(v.violation_status_code) === "R" ? "resolved" : "open"} · population ${v.population_served_count ?? "?"}`));
}
export async function enforcement(a) {
    const id = clean(a.pwsid).toUpperCase();
    if (!/^[A-Z0-9]{5,12}$/.test(id))
        throw new SourceError("pwsid must be letters and digits");
    const limit = clampLimit(a.limit, 20, 50);
    const rows = await getJson(`/ENFORCEMENT/PWSID/${encodeURIComponent(id)}/JSON`);
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length)
        return `EPA SDWIS records no enforcement actions for ${id}.`;
    return section(`${list.length} enforcement action(s) for ${id}`, list.slice(-limit).reverse().map((e, i) => `${i + 1}. ${clean(e.enfactiontype)} · ${clean(e.enfactionname)} · ${clean(e.enforcement_date)?.slice(0, 10)}`));
}
export async function systems_by_type(a) {
    const st = clean(a.state).toUpperCase();
    if (!/^[A-Z]{2}$/.test(st))
        throw new SourceError("state must be a two letter code");
    const limit = clampLimit(a.limit, 15, 50);
    const rows = await getJson(`/WATER_SYSTEM/STATE_CODE/${st}/JSON`);
    const all = Array.isArray(rows) ? rows : [];
    const list = all.filter((w) => clean(w.pws_type_code) === a.systemType && clean(w.pws_activity_code) === "A");
    if (!list.length)
        return `No active ${a.systemType} systems in ${st}.`;
    const pop = list.reduce((n, w) => n + (Number(w.population_served_count) || 0), 0);
    return section(`${list.length} active ${a.systemType} system(s) in ${st}, serving ${pop.toLocaleString("en-US")} people`, list.slice(0, limit).map((w, i) => `${i + 1}. ${clean(w.pws_name)} · ${clean(w.pwsid)} · pop ${w.population_served_count ?? "?"} · ${clean(w.gw_sw_code)}`));
}
