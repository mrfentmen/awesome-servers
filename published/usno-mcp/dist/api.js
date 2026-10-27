/**
 * US Naval Observatory — keyless public API client.
 */
const BASE = "https://aa.usno.navy.mil/api";
const SOURCE = "US Naval Observatory";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "usno-mcp", accept },
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
const checkDate = (raw) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.trim()))
        throw new SourceError("date must be YYYY-MM-DD");
    return raw.trim();
};
function eventLines(events) {
    return (events ?? []).map((e) => `  ${e.phen}: ${e.time}`);
}
export async function sunMoonDay(a) {
    const date = checkDate(a.date);
    const d = await getJson(`/rstt/oneday?date=${date}&coords=${a.latitude},${a.longitude}&tz=${a.timeZone}`);
    const p = d?.properties?.data;
    if (!p)
        throw new SourceError("USNO returned no data for that place and date");
    return [
        `${date} at ${a.latitude}, ${a.longitude} (UTC${a.timeZone >= 0 ? "+" : ""}${a.timeZone})`,
        `Moon: ${p.curphase}, ${p.fracillum} illuminated`,
        p.closestphase ? `Closest phase: ${p.closestphase.phase} on ${p.closestphase.year}-${String(p.closestphase.month).padStart(2, "0")}-${String(p.closestphase.day).padStart(2, "0")} at ${p.closestphase.time}` : "",
        "Sun:",
        ...eventLines(p.sundata),
        "Moon:",
        ...eventLines(p.moondata),
    ].filter(Boolean).join("\n");
}
export async function moonPhases(a) {
    const d = await getJson(`/moon/phases/year?year=${a.year}`);
    const rows = Array.isArray(d?.phasedata) ? d.phasedata : [];
    if (!rows.length)
        throw new SourceError(`USNO returned no moon phases for ${a.year}`);
    const shown = rows.slice(0, a.limit);
    return [`Moon phases in ${a.year} (${rows.length} events):`, ...shown.map((r) => `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")} ${r.time} - ${r.phase}`)].join("\n");
}
export async function seasons(a) {
    const d = await getJson(`/seasons?year=${a.year}&tz=${a.timeZone}`);
    const rows = Array.isArray(d?.data) ? d.data : [];
    if (!rows.length)
        throw new SourceError(`USNO returned no seasonal events for ${a.year}`);
    return [`Seasonal events in ${a.year} (UTC${a.timeZone >= 0 ? "+" : ""}${a.timeZone}):`, ...rows.map((r) => `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")} ${r.time} - ${r.phenom}`)].join("\n");
}
