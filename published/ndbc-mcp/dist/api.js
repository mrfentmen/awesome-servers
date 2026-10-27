/**
 * NOAA Buoys — keyless public API client.
 */
const BASE = "https://www.ndbc.noaa.gov/data/realtime2";
const SOURCE = "NOAA Buoys";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ndbc-mcp", accept },
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
const MISSING = new Set(["MM", "999", "9999.0", "999.0", "99.0", "9999"]);
async function feed(station) {
    const id = clean(station).toUpperCase();
    if (!/^[A-Z0-9]{4,6}$/.test(id))
        throw new SourceError("station must be a 4 to 6 character NDBC id");
    const text = await getText(`/${id}.txt`, "text/plain");
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith("#"));
    const rows = lines.map((l) => l.trim().split(/\s+/));
    const usable = rows.filter((r) => r.length >= 5);
    if (!usable.length)
        throw new SourceError(`NDBC has no observations for station ${id}`);
    return usable;
}
function num(value, unit = "") {
    if (value === undefined || MISSING.has(value))
        return "n/a";
    const n = Number(value);
    if (!Number.isFinite(n))
        return `${value}${unit}`;
    return `${n}${unit}`;
}
function describe(row) {
    const [yy, mo, dy, hr, mn, wdir, wspd, gst, wvht, dpd, apd, mwd, pres, atmp, wtmp, dewpt, vis] = row;
    const when = `${yy}-${mo}-${dy} ${hr}:${mn}Z`;
    return [
        `${when}`,
        `  wind: ${num(wdir, "°")} at ${num(wspd, " m/s")}${gst && !MISSING.has(gst) ? ` gusting ${num(gst, " m/s")}` : ""}${mwd && !MISSING.has(mwd) ? ` · wave direction ${num(mwd, "°")}` : ""}`,
        `  waves: height ${num(wvht, " m")} · dominant period ${num(dpd, " s")} · average period ${num(apd, " s")}`,
        `  pressure: ${num(pres, " hPa")} · air ${num(atmp, "°C")} · water ${num(wtmp, "°C")} · dew point ${num(dewpt, "°C")}`,
        `  visibility: ${num(vis, " mi")}`,
    ].join("\n");
}
export async function latestObservation(a) {
    const rows = await feed(a.station);
    return [
        `NDBC station ${clean(a.station).toUpperCase()} - latest of ${rows.length} rows in the feed:`,
        "",
        describe(rows[0]),
        `Feed: https://www.ndbc.noaa.gov/station_page.php?station=${clean(a.station).toUpperCase()}`,
    ].join("\n");
}
export async function recentObservations(a) {
    const count = a.rows ?? 6;
    if (!Number.isInteger(count) || count < 1 || count > 48)
        throw new SourceError("rows must be between 1 and 48");
    const rows = await feed(a.station);
    const slice = rows.slice(0, count);
    const id = clean(a.station).toUpperCase();
    return [
        `NDBC station ${id} - ${slice.length} most recent observations:`,
        "",
        ...slice.map((r) => `  ${r[0]}-${r[1]}-${r[2]} ${r[3]}:${r[4]}Z · wind ${num(r[5], "°")}/${num(r[6], " m/s")} · waves ${num(r[8], " m")} · air ${num(r[13], "°C")} · water ${num(r[14], "°C")}`),
        "",
        `Station page: https://www.ndbc.noaa.gov/station_page.php?station=${id}`,
    ].join("\n");
}
