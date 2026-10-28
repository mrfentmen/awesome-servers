/**
 * OpenSky Network — keyless public API client.
 */
const BASE = "https://opensky-network.org/api";
const SOURCE = "OpenSky Network";
const UA = "opensky-mcp";
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
async function optionalJson(path) {
    try {
        return await getJson(path);
    }
    catch (e) {
        if (e instanceof SourceError && /responded 404/.test(e.message))
            return [];
        throw e;
    }
}
function stateLine(s) {
    const [icao, callsign, country, , , lon, lat, baro, onGround, velocity, heading] = s;
    const alt = baro === null || baro === undefined ? "alt ?" : `${Math.round(Number(baro))} m`;
    return `${clean(icao)} · ${clean(callsign) || "no callsign"} · ${clean(country)} · ${alt} · ${velocity ? `${Math.round(Number(velocity))} m/s` : "speed ?"} · ${heading !== null ? `${Math.round(Number(heading))}°` : "hdg ?"} · ${onGround ? "on ground" : `${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}`}`;
}
export async function aircraft_in_area(a) {
    if (a.lamax <= a.lamin)
        throw new SourceError("lamax must be greater than lamin");
    if (a.lomax <= a.lomin)
        throw new SourceError("lomax must be greater than lomin");
    const limit = clampLimit(a.limit, 15, 50);
    const d = await getJson(`/states/all?lamin=${a.lamin}&lomin=${a.lomin}&lamax=${a.lamax}&lomax=${a.lomax}`);
    const states = Array.isArray(d?.states) ? d.states : [];
    if (!states.length)
        return `No aircraft in that box right now.`;
    return section(`${states.length} aircraft in box, showing ${Math.min(limit, states.length)}`, states.slice(0, limit).map((s, i) => `${i + 1}. ${stateLine(s)}`));
}
export async function aircraft_state(a) {
    const icao = clean(a.icao24).toLowerCase();
    if (!/^[0-9a-f]{6}$/.test(icao))
        throw new SourceError("icao24 must be six hex characters");
    const d = await getJson(`/states/all?icao24=${icao}`);
    const s = Array.isArray(d?.states) ? d.states[0] : null;
    if (!s)
        return `Aircraft ${icao} is not transmitting right now.`;
    return section(`Aircraft ${icao}`, [
        bullet("Callsign", clean(s[1])),
        bullet("Country", s[2]),
        bullet("Position", s[5] !== null && s[6] !== null ? `${s[6]}, ${s[5]}` : "unknown"),
        bullet("Altitude", s[7] !== null ? `${Math.round(Number(s[7]))} m` : "unknown"),
        bullet("Velocity", s[9] !== null ? `${Math.round(Number(s[9]))} m/s` : "unknown"),
        bullet("Heading", s[10] !== null ? `${Math.round(Number(s[10]))}°` : "unknown"),
        bullet("Vertical rate", s[11] !== null ? `${Number(s[11]).toFixed(1)} m/s` : "unknown"),
        bullet("Squawk", s[14]),
        bullet("On ground", s[8] ? "yes" : "no"),
    ]);
}
export async function flight_track(a) {
    const icao = clean(a.icao24).toLowerCase();
    const limit = clampLimit(a.limit, 20, 60);
    const d = await getJson(`/tracks/all?icao24=${icao}&time=0`);
    const path = Array.isArray(d?.path) ? d.path : [];
    if (!path.length)
        return `No recent track for ${icao}.`;
    const step = Math.max(1, Math.floor(path.length / limit));
    const picked = path.filter((_, i) => i % step === 0).slice(-limit);
    return section(`${clean(d.callsign) || icao} · ${path.length} points · ${new Date(Number(d.startTime) * 1000).toISOString()} to ${new Date(Number(d.endTime) * 1000).toISOString()}`, picked.map((p, i) => `${i + 1}. ${new Date(Number(p[0]) * 1000).toISOString().slice(11, 19)}Z · ${Number(p[2]).toFixed(3)}, ${Number(p[1]).toFixed(3)} · ${p[3] !== null ? `${Math.round(Number(p[3]))} m` : "alt ?"}`));
}
export async function aircraft_near(a) {
    const limit = clampLimit(a.limit, 15, 50);
    const radiusKm = a.radiusKm ?? 100;
    const dLat = radiusKm / 111;
    const dLon = radiusKm / (111 * Math.max(0.2, Math.cos((a.lat * Math.PI) / 180)));
    const d = await getJson(`/states/all?lamin=${a.lat - dLat}&lomin=${a.lon - dLon}&lamax=${a.lat + dLat}&lomax=${a.lon + dLon}`);
    const states = Array.isArray(d?.states) ? d.states : [];
    const near = states.filter((s) => s[5] !== null && s[6] !== null);
    if (!near.length)
        return `No aircraft within ${radiusKm} km of ${a.lat}, ${a.lon}.`;
    return section(`${near.length} aircraft within ${radiusKm} km, showing ${Math.min(limit, near.length)}`, near.slice(0, limit).map((s, i) => `${i + 1}. ${stateLine(s)}`));
}
export async function airport_arrivals(a) {
    const airport = clean(a.airport).toUpperCase();
    if (!/^[A-Z]{4}$/.test(airport))
        throw new SourceError("airport must be a four-letter ICAO code");
    const hours = clampLimit(a.hours, 1, 2);
    const end = Math.floor(Date.now() / 1000);
    const begin = end - hours * 3600;
    const d = await optionalJson(`/flights/arrival?airport=${airport}&begin=${begin}&end=${end}`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No arrivals recorded at ${airport} in the last ${hours}h.`;
    return section(`${rows.length} arrival(s) at ${airport} in the last ${hours}h`, rows.slice(0, 20).map((f, i) => `${i + 1}. ${clean(f.callsign) || "?"} from ${clean(f.estDepartureAirport) || "?"} · landed ${new Date(Number(f.lastSeen) * 1000).toISOString().slice(11, 16)}Z`));
}
