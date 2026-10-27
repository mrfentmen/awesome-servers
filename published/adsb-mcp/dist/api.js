/**
 * Live Aircraft — keyless public API client.
 */
const BASE = "https://api.adsb.lol/v2";
const SOURCE = "Live Aircraft";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "adsb-mcp", accept },
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
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
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
const checkLat = (v) => {
    if (!Number.isFinite(v) || v < -90 || v > 90)
        throw new SourceError("latitude must be between -90 and 90");
    return v;
};
const checkLon = (v) => {
    if (!Number.isFinite(v) || v < -180 || v > 180)
        throw new SourceError("longitude must be between -180 and 180");
    return v;
};
function describe(ac) {
    const alt = ac.alt_baro === "ground" ? "on ground" : ac.alt_baro !== undefined ? `${Number(ac.alt_baro).toLocaleString("en-US")} ft` : "altitude unknown";
    const speed = ac.gs !== undefined ? `${Math.round(Number(ac.gs))} kt` : "speed unknown";
    const route = [ac.lat, ac.lon].every((v) => Number.isFinite(Number(v))) ? `${Number(ac.lat).toFixed(4)}, ${Number(ac.lon).toFixed(4)}` : "position unknown";
    return [
        `${(ac.flight ?? "").trim() || ac.hex} (${ac.r ?? "no registration"})`,
        `  ${ac.t ?? "unknown type"} · ${alt} · ${speed} · ${route}`,
        `  hex ${ac.hex}${ac.squawk ? ` · squawk ${ac.squawk}` : ""}${ac.seen_pos !== undefined ? ` · seen ${Number(ac.seen_pos).toFixed(1)}s ago` : ""}`,
    ].join("\n");
}
export async function aircraftNear(a) {
    const d = await getJson(`/point/${checkLat(a.latitude)}/${checkLon(a.longitude)}/${a.radiusNm}`);
    const ac = Array.isArray(d?.ac) ? d.ac : [];
    if (!ac.length)
        return `No aircraft broadcasting within ${a.radiusNm} nm of ${a.latitude}, ${a.longitude}.`;
    const sorted = ac.sort((x, y) => Number(x.seen_pos ?? 99) - Number(y.seen_pos ?? 99));
    return [`${ac.length} aircraft within ${a.radiusNm} nm (showing ${Math.min(a.limit, ac.length)}):`, ...sorted.slice(0, a.limit).map(describe)].join("\n");
}
export async function aircraftByCallsign(a) {
    const cs = a.callsign.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(cs))
        throw new SourceError(`"${a.callsign}" is not a valid callsign`);
    const d = await getJson(`/callsign/${cs}`);
    const ac = Array.isArray(d?.ac) ? d.ac : [];
    if (!ac.length)
        return `No aircraft with callsign ${cs} is broadcasting right now.`;
    return [`${ac.length} aircraft with callsign ${cs}:`, ...ac.slice(0, 10).map(describe)].join("\n");
}
export async function aircraftByHex(a) {
    const hex = a.hex.trim().toLowerCase();
    const d = await getJson(`/hex/${hex}`);
    const ac = Array.isArray(d?.ac) ? d.ac : [];
    if (!ac.length)
        return `No aircraft with hex ${hex} is broadcasting right now.`;
    return [`Aircraft ${hex}:`, ...ac.slice(0, 5).map(describe)].join("\n");
}
