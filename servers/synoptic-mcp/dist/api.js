export class SynopticError extends Error {
    constructor(message) {
        super(message);
        this.name = "SynopticError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new SynopticError(`Set the ${name} environment variable.`);
    return v;
}
function apiKey() {
    return envStrict("SYNOPTIC_API_TOKEN");
}
async function authHeaders() {
    return {};
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new SynopticError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function findStations(state, limit) {
    const key = apiKey();
    let url = `https://api.synopticdata.com/v2/stations/metadata`;
    const qs = new URLSearchParams();
    qs.append("token", key);
    qs.append("state", String(state));
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getTimeseries(stid, vars, recent) {
    const key = apiKey();
    let url = `https://api.synopticdata.com/v2/stations/timeseries`;
    const qs = new URLSearchParams();
    qs.append("token", key);
    qs.append("stid", String(stid));
    if (vars !== undefined)
        qs.append("vars", String(vars));
    if (recent !== undefined)
        qs.append("recent", String(recent));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
const NWS_BASE = "https://api.weather.gov";
function bounded(value, fallback, min, max) {
    if (value === undefined || !Number.isFinite(value))
        return fallback;
    return Math.min(Math.max(value, min), max);
}
// NWS measures everything in SI, so wind and visibility are converted once here.
function nwsWind(value) {
    const kmh = value?.value;
    if (typeof kmh !== "number" || !Number.isFinite(kmh))
        return "not reported";
    return `${kmh.toFixed(1)} km/h (${(kmh * 0.621371).toFixed(1)} mph)`;
}
function nwsTemp(value) {
    const c = value?.value;
    if (typeof c !== "number" || !Number.isFinite(c))
        return "not reported";
    return `${c.toFixed(1)} C (${((c * 9) / 5 + 32).toFixed(1)} F)`;
}
function nwsNumber(value, digits = 1) {
    const n = value?.value;
    if (typeof n !== "number" || !Number.isFinite(n))
        return "not reported";
    return n.toFixed(digits);
}
function nwsTime(value) {
    return typeof value === "string" && value ? value : "time not reported";
}
export async function nwsStationTimeseries(stid, hours, limit) {
    const station = (stid ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{3,8}$/.test(station))
        throw new SynopticError(`Station id must be 3-8 letters or digits, e.g. KJFK, got "${stid ?? ""}".`);
    const span = Math.min(Math.max(hours ?? 6, 1), 72);
    const count = Math.min(Math.max(limit ?? 24, 1), 100);
    const end = new Date();
    const start = new Date(end.getTime() - span * 3600 * 1000);
    const qs = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        limit: String(count),
    });
    const data = (await req(`${NWS_BASE}/stations/${encodeURIComponent(station)}/observations?${qs.toString()}`));
    const features = Array.isArray(data?.features) ? data.features : [];
    if (features.length === 0)
        throw new SynopticError(`No observations returned for station ${station} in the last ${span} h.`);
    const rows = features.slice(0, count).map((f) => {
        const p = f.properties ?? {};
        return [
            `${nwsTime(p.timestamp)} · ${p.textDescription ?? "conditions not reported"}`,
            `   temp ${nwsTemp(p.temperature)} · dewpoint ${nwsTemp(p.dewpoint)} · humidity ${nwsNumber(p.relativeHumidity)}%`,
            `   wind ${nwsWind(p.windSpeed)} from ${nwsNumber(p.windDirection, 0)} deg · gust ${nwsWind(p.windGust)}`,
            `   pressure ${nwsNumber(p.barometricPressure, 0)} Pa · visibility ${nwsNumber(p.visibility, 0)} m`,
        ].join("\n");
    });
    const first = features[0].properties ?? {};
    return [
        `NWS station observations for ${first.stationName ?? station} (${first.stationId ?? station}), last ${span} h - ${features.length} reported, showing ${rows.length}:`,
        ...rows,
    ].join("\n");
}
export async function nwsGridpointHourly(lat, lon, hours, limit) {
    const latitude = bounded(lat, 0, -90, 90);
    const longitude = bounded(lon, 0, -180, 180);
    const span = Math.min(Math.max(hours ?? 24, 1), 156);
    const count = Math.min(Math.max(limit ?? 24, 1), 156);
    const point = (await req(`${NWS_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`));
    const props = point?.properties ?? {};
    const office = String(props.gridId ?? "");
    const x = Number(props.gridX);
    const y = Number(props.gridY);
    if (!office || !Number.isFinite(x) || !Number.isFinite(y))
        throw new SynopticError("The NWS could not resolve that point to a forecast grid.");
    const place = props.relativeLocation?.properties ?? {};
    const hourly = (await req(`${NWS_BASE}/gridpoints/${office}/${x},${y}/forecast/hourly`));
    const periods = Array.isArray(hourly?.properties?.periods) ? hourly.properties.periods : [];
    if (periods.length === 0)
        throw new SynopticError("The NWS returned no hourly periods for that grid.");
    const chosen = periods.slice(0, count);
    return [
        `NWS gridded hourly model forecast for ${[place.city, place.state].filter(Boolean).join(", ") || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`} (grid ${office} ${x},${y}) - ${chosen.length} of ${periods.length} hours:`,
        ...chosen.map((p) => {
            const precip = p.probabilityOfPrecipitation?.value;
            return `${nwsTime(p.startTime)} · ${p.shortForecast ?? "forecast not reported"} · ${p.temperature ?? "?"} ${p.temperatureUnit ?? ""} · wind ${p.windSpeed ?? "?"} ${p.windDirection ?? ""} · humidity ${nwsNumber(p.relativeHumidity, 0)}%${precip === null || precip === undefined ? "" : ` · precip ${precip}%`}`;
        }),
        count < span ? `Only ${periods.length} hours are published for this grid.` : "",
    ].filter(Boolean).join("\n");
}
