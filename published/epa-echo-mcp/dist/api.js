/**
 * EPA ECHO — keyless public API client.
 */
const BASE = "https://echodata.epa.gov/echo";
const SOURCE = "EPA ECHO";
const UA = "epa-echo-mcp";
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
export async function facilities_in_state(a) {
    const st = clean(a.state).toUpperCase();
    if (!/^[A-Z]{2}$/.test(st))
        throw new SourceError("state must be a two letter code");
    const limit = clampLimit(a.limit, 25, 100);
    const d = await getJson(`/echo_rest_services.get_facility_info?output=JSON&p_st=${st}&p_act=${a.activeOnly === false ? "N" : "Y"}`);
    const r = d?.Results ?? {};
    const rows = Array.isArray(r.Facilities) ? r.Facilities : [];
    if (!rows.length)
        return `EPA ECHO lists no facilities for ${st}.`;
    return section(`${r.QueryRows ?? rows.length} facility(ies) in ${st}, showing ${Math.min(limit, rows.length)}`, [
        ...rows.slice(0, limit).map((f, i) => `${i + 1}. ${clean(f.FacName)} · ${clean(f.FacCity)} ${clean(f.FacZip)} · ${clean(f.FacComplianceStatus) || "status unknown"} · registry ${clean(f.RegistryID)}`),
        rows.length > limit ? `\nNarrow with a ZIP or city to see the rest.` : "",
    ]);
}
export async function facilities_by_zip(a) {
    const zip = clean(a.zip);
    if (!/^\d{5}$/.test(zip))
        throw new SourceError("zip must be five digits");
    const limit = clampLimit(a.limit, 25, 100);
    const d = await getJson(`/echo_rest_services.get_facility_info?output=JSON&p_zip=${zip}`);
    const r = d?.Results ?? {};
    const rows = Array.isArray(r.Facilities) ? r.Facilities : [];
    if (!rows.length)
        return `EPA ECHO lists no facilities in ${zip}.`;
    return section(`${r.QueryRows ?? rows.length} facility(ies) in ${zip}`, rows.slice(0, limit).map((f, i) => `${i + 1}. ${clean(f.FacName)} · ${clean(f.FacStreet)} · ${clean(f.FacComplianceStatus) || "status unknown"} · registry ${clean(f.RegistryID)}`));
}
export async function facilities_by_city(a) {
    const city = clean(a.city);
    const st = clean(a.state).toUpperCase();
    if (city.length < 2)
        throw new SourceError("city must be at least 2 characters");
    if (!/^[A-Z]{2}$/.test(st))
        throw new SourceError("state must be a two letter code");
    const limit = clampLimit(a.limit, 25, 100);
    const d = await getJson(`/echo_rest_services.get_facility_info?output=JSON&p_ct=${encodeURIComponent(city)}&p_st=${st}`);
    const r = d?.Results ?? {};
    const rows = Array.isArray(r.Facilities) ? r.Facilities : [];
    if (!rows.length)
        return `EPA ECHO lists no facilities in ${city}, ${st}.`;
    return section(`${r.QueryRows ?? rows.length} facility(ies) in ${city}, ${st}`, rows.slice(0, limit).map((f, i) => `${i + 1}. ${clean(f.FacName)} · ${clean(f.FacStreet)} · ${clean(f.FacComplianceStatus) || "status unknown"} · registry ${clean(f.RegistryID)}`));
}
export async function facilities_by_name(a) {
    const name = clean(a.name);
    if (name.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = clampLimit(a.limit, 25, 100);
    const st = a.state ? clean(a.state).toUpperCase() : "";
    if (st && !/^[A-Z]{2}$/.test(st))
        throw new SourceError("state must be a two letter code");
    const d = await getJson(`/echo_rest_services.get_facility_info?output=JSON&p_fn=${encodeURIComponent(name)}${st ? `&p_st=${st}` : ""}`);
    const r = d?.Results ?? {};
    const rows = Array.isArray(r.Facilities) ? r.Facilities : [];
    if (!rows.length)
        return `No facility matches "${name}"${st ? ` in ${st}` : ""}.`;
    return section(`${r.QueryRows ?? rows.length} facility(ies) match "${name}"`, rows.slice(0, limit).map((f, i) => `${i + 1}. ${clean(f.FacName)} · ${clean(f.FacCity)}, ${clean(f.FacState)} · ${clean(f.FacComplianceStatus) || "status unknown"} · registry ${clean(f.RegistryID)}`));
}
export async function facility_detail(a) {
    const id = clean(a.registryId);
    if (!/^[0-9A-Za-z-]{6,20}$/.test(id))
        throw new SourceError("registryId looks wrong");
    const d = await getJson(`/echo_rest_services.get_facility_info?output=JSON&p_pid=${encodeURIComponent(id)}`);
    const r = d?.Results ?? {};
    const rows = Array.isArray(r.Facilities) ? r.Facilities : [];
    if (!rows.length)
        throw new SourceError(`ECHO has no facility ${id}`);
    const f = rows[0];
    return section(clean(f.FacName), [
        bullet("Registry id", f.RegistryID),
        bullet("Address", [clean(f.FacStreet), clean(f.FacCity), clean(f.FacState), clean(f.FacZip)].filter(Boolean).join(", ")),
        bullet("County", f.FacCounty),
        bullet("Overall compliance", f.FacComplianceStatus),
        bullet("Clean Air Act", f.CAAComplianceStatus),
        bullet("Clean Water Act", f.CWAComplianceStatus),
        bullet("RCRA hazardous waste", f.RCRAComplianceStatus),
        bullet("Safe Drinking Water Act", f.SDWAComplianceStatus),
        bullet("Quarters with non-compliance", f.FacQtrsWithNC),
        bullet("Inspections", f.FacInspectionCount),
        bullet("Days since last inspection", f.FacDaysLastInspection),
        bullet("Formal actions", f.FacFormalActionCount),
        bullet("Total penalties", r.TotalPenalties),
        bullet("NAICS", f.FacNAICSCodes),
        bullet("SIC", f.FacSICCodes),
    ]);
}
