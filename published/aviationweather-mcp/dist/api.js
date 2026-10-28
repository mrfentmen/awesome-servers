/**
 * NOAA aviation weather — keyless public API client.
 */
const BASE = "https://aviationweather.gov";
const SOURCE = "aviationweather.gov";
const UA = "aviationweather-mcp";
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
export async function metar(a) {
    const ids = clean(a.ids);
    if (!/^[A-Za-z0-9,]{3,60}$/.test(ids))
        throw new SourceError("ids must be ICAO codes separated by commas");
    const limit = clampLimit(a.limit, 5, 20);
    const d = await getJson(`/api/data/metar?ids=${encodeURIComponent(ids)}&format=json`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        throw new SourceError(`No METAR found for ${ids}`);
    const blocks = list.slice(0, limit).map((m) => [
        `${clean(m.icaoId)} · ${clean(m.reportTime) || clean(m.obsTime)}`,
        `  wind ${clean(m.wdir)}° at ${clean(m.wspd)} kt · vis ${clean(m.visib)} · ${clean(m.temp)}°C / dew ${clean(m.dewp)}°C · altimeter ${clean(m.altim)} hPa`,
        `  ${clean(m.rawOb)}`,
    ].join("\n"));
    return blocks.join("\n\n");
}
export async function taf(a) {
    const ids = clean(a.ids);
    if (!/^[A-Za-z0-9,]{3,60}$/.test(ids))
        throw new SourceError("ids must be ICAO codes separated by commas");
    const d = await getJson(`/api/data/taf?ids=${encodeURIComponent(ids)}&format=json`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        throw new SourceError(`No TAF found for ${ids}`);
    return list.slice(0, 5).map((t) => `${clean(t.icaoId)} · issued ${clean(t.issueTime)}\n  ${clean(t.rawTAF)}`).join("\n\n");
}
export async function airport_info(a) {
    const ids = clean(a.ids);
    if (!/^[A-Za-z0-9,]{3,60}$/.test(ids))
        throw new SourceError("ids must be airport codes separated by commas");
    const d = await getJson(`/api/data/airport?ids=${encodeURIComponent(ids)}&format=json`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        throw new SourceError(`No airport found for ${ids}`);
    return list.slice(0, 5).map((x) => section(`${clean(x.icaoId) || clean(x.iataId)} — ${clean(x.name)}`, [
        bullet("Location", [clean(x.state), clean(x.country)].filter(Boolean).join(", ")),
        bullet("Coordinates", `${clean(x.lat)}, ${clean(x.lon)} · ${clean(x.elev)} m`),
        bullet("Frequencies", clean(x.freqs)),
        bullet("Owner", clean(x.owner)),
    ])).join("\n\n");
}
export async function station_info(a) {
    const ids = clean(a.ids);
    if (!/^[A-Za-z0-9,]{3,60}$/.test(ids))
        throw new SourceError("ids must be ICAO codes separated by commas");
    const d = await getJson(`/api/data/stationinfo?ids=${encodeURIComponent(ids)}&format=json`);
    const list = Array.isArray(d) ? d : [];
    if (!list.length)
        throw new SourceError(`No station found for ${ids}`);
    return list.slice(0, 10).map((s) => `${clean(s.icaoId)}${s.iataId ? " / " + clean(s.iataId) : ""} — ${clean(s.site)} · ${clean(s.state)} ${clean(s.country)} · ${clean(s.lat)}, ${clean(s.lon)} · ${Array.isArray(s.siteType) ? s.siteType.join("/") : clean(s.siteType)}`).join("\n");
}
export async function decode_metar(a) {
    const raw = clean(a.raw).toUpperCase();
    if (raw.length < 10)
        throw new SourceError("raw must look like a METAR report");
    if (!/\b(?:METAR|SPECI)\b/.test(raw))
        throw new SourceError("raw does not contain METAR or SPECI");
    const wind = raw.match(/\b(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT\b/);
    const vis = raw.match(/\s(P6SM|M?\d{1,2}(?:\/\d{1,2})?SM)\s/);
    const temp = raw.match(/\s(M?\d{2})\/(M?\d{2})\s/);
    const alt = raw.match(/\bA(\d{4})\b/);
    const clouds = raw.match(/\b(FEW|SCT|BKN|OVC|VV)(\d{3})\b/g) ?? [];
    const wx = raw.match(/\s(-?[A-Z]{2,6}(?:RA|SN|DZ|FG|BR|HZ|TS|SH|GR|GS|PL)[A-Z]{0,4})\s/);
    const rows = [
        wind ? `wind: ${wind[1] === "VRB" ? "variable" : wind[1] + "°"} at ${wind[2]} kt${wind[3] ? " gusting " + wind[3] + " kt" : ""}` : "wind: not reported",
        `visibility: ${vis ? vis[1] : "not reported"}`,
        temp ? `temperature: ${temp[1].replace("M", "-")}°C, dew point ${temp[2].replace("M", "-")}°C` : "temperature: not reported",
        alt ? `altimeter: ${alt[1]} inHg` : "altimeter: not reported",
        clouds.length ? `clouds: ${clouds.join(", ")}` : "clouds: clear or not reported",
        wx ? `weather: ${wx[1]}` : "",
    ];
    return section(`Decoded ${clean(a.raw).slice(0, 80)}`, rows.filter(Boolean));
}
