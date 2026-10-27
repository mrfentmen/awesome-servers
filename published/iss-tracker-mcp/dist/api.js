/**
 * WhereTheISS.at — keyless satellite tracking (ISS plus a few others):
 * live position and velocity, position tracks, orbit data (TLE), and
 * daylight/eclipse state.
 */
const BASE = "https://api.wheretheiss.at/v1";
export class IssError extends Error {
}
async function getJson(path, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`${BASE}${path}`, {
            signal: ctrl.signal,
            headers: { "user-agent": "iss-tracker-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new IssError("WhereTheISS.at has no record for that satellite");
        if (!res.ok)
            throw new IssError(`WhereTheISS.at responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof IssError)
            throw e;
        if (e.name === "AbortError")
            throw new IssError("WhereTheISS.at request timed out");
        if (e instanceof SyntaxError)
            throw new IssError("WhereTheISS.at returned malformed JSON");
        throw new IssError(`WhereTheISS.at request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
const idArg = (id) => {
    if (!Number.isInteger(id) || id < 1 || id > 999999)
        throw new IssError("satellite id must be a NORAD catalog number, e.g. 25544");
    return id;
};
const utc = (ts) => new Date(ts * 1000).toISOString().slice(0, 19).replace("T", " ") + " UTC";
function positionLine(p) {
    return `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)} · alt ${Number(p.altitude).toFixed(1)} km · ${Math.round(Number(p.velocity))} km/h · ${p.visibility} · footprint ${Math.round(Number(p.footprint))} km`;
}
/** Points along the orbit are sampled in even steps; the API caps a request at 10 timestamps. */
function timestamps(fromSec, toSec, points) {
    const n = Math.max(2, Math.min(points, 10));
    const step = (toSec - fromSec) / (n - 1);
    return Array.from({ length: n }, (_, i) => Math.round(fromSec + i * step));
}
export async function currentPosition(id = 25544) {
    const sat = idArg(id);
    const p = await getJson(`/satellites/${sat}`);
    return [
        `${String(p.name).toUpperCase()} (id ${p.id}) at ${utc(p.timestamp)}:`,
        `  Position: ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`,
        `  Altitude: ${Number(p.altitude).toFixed(1)} km · velocity ${Math.round(Number(p.velocity)).toLocaleString("en-US")} km/h`,
        `  Visibility: ${p.visibility} · footprint radius ${Math.round(Number(p.footprint))} km`,
        `  Subsolar point: ${Number(p.solar_lat).toFixed(2)}, ${Number(p.solar_lon).toFixed(2)}`,
    ].join("\n");
}
export async function positionTrack(id = 25544, minutes = 45, points = 6) {
    const sat = idArg(id);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 720)
        throw new IssError("minutes must be between 5 and 720");
    const now = Math.floor(Date.now() / 1000);
    const ts = timestamps(now - minutes * 60, now, points);
    const rows = await getJson(`/satellites/${sat}/positions?timestamps=${ts.join(",")}`);
    const lines = rows.map((p) => `${utc(p.timestamp)} · ${positionLine(p)}`);
    return [`${sat} track over the last ${minutes} minutes:`, "", ...lines].join("\n");
}
export async function visibilityReport(id = 25544, hours = 3, points = 10) {
    const sat = idArg(id);
    if (!Number.isInteger(hours) || hours < 1 || hours > 24)
        throw new IssError("hours must be between 1 and 24");
    const now = Math.floor(Date.now() / 1000);
    const ts = timestamps(now, now + hours * 3600, points);
    const rows = await getJson(`/satellites/${sat}/positions?timestamps=${ts.join(",")}`);
    const lit = rows.filter((p) => p.visibility === "daylight").length;
    const transitions = [];
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].visibility !== rows[i - 1].visibility) {
            transitions.push(`${utc(rows[i].timestamp)} → ${rows[i].visibility}`);
        }
    }
    const pct = Math.round((lit / rows.length) * 100);
    return [
        `${sat} in sunlight next ${hours} h: about ${pct}% of sampled time (${lit}/${rows.length} samples).`,
        transitions.length ? `Transitions: ${transitions.join(" · ")}` : "No daylight/eclipse transition inside the window.",
        "",
        "Samples:",
        ...rows.map((p) => `  ${utc(p.timestamp)} · ${p.visibility} · ${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}`),
    ].join("\n");
}
export async function listSatellites() {
    const rows = await getJson(`/satellites`);
    if (!Array.isArray(rows) || rows.length === 0)
        return "WhereTheISS.at is tracking no satellites right now.";
    return [`Tracked satellites (${rows.length}):`, "", ...rows.map((s) => `${s.id} — ${s.name}`)].join("\n");
}
export async function satelliteTle(id = 25544) {
    const sat = idArg(id);
    const d = await getJson(`/satellites/${sat}/tles?format=json`);
    return [
        `TLE for ${d.name} (id ${d.id})`,
        `Header: ${d.header}`,
        `TLE epoch: ${utc(Number(d.tle_timestamp))} (requested at ${utc(Number(d.requested_timestamp))})`,
        "",
        d.line1,
        d.line2,
    ].join("\n");
}
function distanceKm(lat1, lon1, lat2, lon2) {
    const rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export async function overheadCheck(id = 25544, latitude = 0, longitude = 0) {
    const sat = idArg(id);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
        throw new IssError("latitude must be between -90 and 90");
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
        throw new IssError("longitude must be between -180 and 180");
    const p = await getJson(`/satellites/${sat}`);
    const km = distanceKm(latitude, longitude, Number(p.latitude), Number(p.longitude));
    const footprint = Number(p.footprint);
    const overhead = km <= footprint;
    return [
        `${String(p.name).toUpperCase()} vs point ${latitude}, ${longitude} at ${utc(p.timestamp)}:`,
        `  Ground distance to sub-satellite point: ${km.toFixed(0)} km`,
        `  Footprint radius: ${Math.round(footprint)} km → ${overhead ? "inside the footprint (above your local horizon)" : "outside the footprint"}`,
        `  Satellite: ${p.visibility} · alt ${Number(p.altitude).toFixed(1)} km`,
        overhead ? `  It passes within ${km.toFixed(0)} km of your point right now.` : `  It is ${km.toFixed(0)} km away — check a track for a closer pass.`,
    ].join("\n");
}
