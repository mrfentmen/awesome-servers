/**
 * US Census Geocoder — keyless public API client.
 */
const BASE = "https://geocoding.geo.census.gov";
const SOURCE = "US Census Geocoder";
const UA = "census-geocode-mcp";
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
export async function geocode_oneline(a) {
    const address = clean(a.address);
    if (address.length < 5)
        throw new SourceError("address is too short");
    const limit = clampLimit(a.limit, 3, 10);
    const q = encodeURIComponent(address);
    const d = await getJson(`/geocoder/locations/onelineaddress?address=${q}&benchmark=Public_AR_Current&format=json`);
    const matches = d?.result?.addressMatches ?? [];
    if (!matches.length)
        return `No address match for "${address}".`;
    return section(`${matches.length} match(es) for "${address}"`, matches.slice(0, limit).map((m, i) => `${i + 1}. ${clean(m.matchedAddress)} · ${m.coordinates?.y}, ${m.coordinates?.x} · ${clean(m.addressComponents?.city)}, ${clean(m.addressComponents?.state)} ${clean(m.addressComponents?.zip)}`));
}
export async function geocode_address(a) {
    const street = clean(a.street);
    const city = clean(a.city);
    const state = clean(a.state).toUpperCase();
    if (street.length < 3)
        throw new SourceError("street is too short");
    if (!/^[A-Z]{2}$/.test(state))
        throw new SourceError("state must be two letters");
    const zip = a.zip ? `&zip=${encodeURIComponent(a.zip)}` : "";
    const d = await getJson(`/geocoder/locations/address?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${state}${zip}&benchmark=Public_AR_Current&format=json`);
    const matches = d?.result?.addressMatches ?? [];
    if (!matches.length)
        return `No match for ${street}, ${city}, ${state}.`;
    const m = matches[0];
    return section(clean(m.matchedAddress), [
        bullet("Latitude", m.coordinates?.y),
        bullet("Longitude", m.coordinates?.x),
        bullet("City", m.addressComponents?.city),
        bullet("State", m.addressComponents?.state),
        bullet("ZIP", m.addressComponents?.zip),
        bullet("TIGER line", m.tigerLine?.tigerLineId),
    ]);
}
export async function congressional_district(a) {
    const d = await getJson(`/geocoder/geographies/coordinates?x=${a.lon}&y=${a.lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`);
    const geo = d?.result?.geographies ?? {};
    const key = Object.keys(geo).find((k) => /Congressional Districts/i.test(k));
    if (!key)
        throw new SourceError(`No congressional district found for ${a.lat}, ${a.lon}`);
    const rows = Array.isArray(geo[key]) ? geo[key] : [];
    const r = rows[0];
    if (!r)
        throw new SourceError(`No congressional district found for ${a.lat}, ${a.lon}`);
    return section(`${clean(r.NAME)}`, [
        bullet("District", r.CD119 ?? r.CD118 ?? r.DISTRICT),
        bullet("State", r.STATE),
        bullet("GEOID", r.GEOID),
        bullet("Layer", key),
    ]);
}
export async function geographies(a) {
    const limit = clampLimit(a.layers, 12, 30);
    const d = await getJson(`/geocoder/geographies/coordinates?x=${a.lon}&y=${a.lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`);
    const geo = d?.result?.geographies ?? {};
    const layers = Object.keys(geo);
    if (!layers.length)
        return `No geographies for ${a.lat}, ${a.lon}.`;
    const lines = layers.slice(0, limit).map((layer) => {
        const first = Array.isArray(geo[layer]) ? geo[layer][0] : null;
        return `${layer}: ${clean(first?.NAME) || clean(first?.BASENAME) || "?"}${first?.GEOID ? ` (GEOID ${first.GEOID})` : ""}`;
    });
    return section(`${layers.length} geography layer(s) at ${a.lat}, ${a.lon}`, lines);
}
export async function benchmarks(a) {
    const d = await getJson("/geocoder/benchmarks?format=json");
    const list = Array.isArray(d?.benchmarks) ? d.benchmarks : [];
    if (!list.length)
        throw new SourceError("No benchmarks returned");
    return section(`${list.length} benchmark(s)`, list.slice(0, 15).map((b, i) => `${i + 1}. ${clean(b.benchmarkName)} · ${clean(b.benchmarkDescription)}${b.isDefault ? " · default" : ""}`));
}
