const BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const HEADERS = { "User-Agent": "mrfentmen-tides-mcp/1.0" };
export class TidesError extends Error {
}
async function get(params) { const url = new URL(BASE); Object.entries({ ...params, format: "json", units: params.units ?? "english", time_zone: params.time_zone ?? "gmt" }).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) }); if (!res.ok)
    throw new TidesError(`NOAA tides error ${res.status}`); const data = await res.json(); if (data.error)
    throw new TidesError(data.error.message ?? "NOAA returned an error"); return data; }
export function predictions(station, begin, end, interval = "hilo", units = "english") { return get({ station, product: "predictions", datum: "MLLW", begin_date: begin.replaceAll("-", ""), end_date: end.replaceAll("-", ""), interval, units }); }
export function waterLevels(station, begin, end, interval = "6", units = "english") { return get({ station, product: "water_level", datum: "MLLW", begin_date: begin.replaceAll("-", ""), end_date: end.replaceAll("-", ""), interval, units }); }
export function format(data) { return JSON.stringify(data, null, 2).slice(0, 12000); }
const MD = "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi";
async function metadata(path) {
    const res = await fetch(MD + path, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new TidesError(`NOAA metadata error ${res.status}`);
    return res.json();
}
export async function stationList(a) {
    const data = await metadata("/stations.json?type=tidepredictions");
    const all = Array.isArray(data?.stations) ? data.stations : [];
    const wanted = a.state ? a.state.trim().toUpperCase() : "";
    const rows = wanted ? all.filter((s) => clean(s?.state).toUpperCase() === wanted) : all;
    if (!rows.length)
        return `NOAA lists no tide stations${wanted ? ` in ${wanted}` : ""}.`;
    return [`${rows.length} tide station(s)${wanted ? ` in ${wanted}` : ""}, showing ${Math.min(rows.length, 40)}:`, "",
        ...rows.slice(0, 40).map((s, i) => `${i + 1}. ${clean(s?.name)} · ${clean(s?.id)} · ${clean(s?.state)} · ${s?.lat}, ${s?.lng}`)].join("\n");
}
export async function stationMetadata(a) {
    const id = clean(a.station);
    if (!/^[A-Za-z0-9]{5,10}$/.test(id))
        throw new TidesError(`"${id}" is not a NOAA station id`);
    const body = await metadata(`/stations/${encodeURIComponent(id)}.json`);
    const s = Array.isArray(body?.stations) ? body.stations[0] : undefined;
    if (!s?.id)
        throw new TidesError(`No NOAA station ${id}`);
    return [`${clean(s.name)} (${clean(s.id)})`, "",
        `State: ${clean(s.state)}`,
        `Affiliation: ${clean(s.affiliation)}`,
        `Coordinates: ${s.lat}, ${s.lng}`,
        `Time zone: ${clean(s.timezone)} ${clean(s.timezonecorr)}`,
        `Tide predictions: ${s.tideType ? "yes" : "no"}`,
        `Products: ${Array.isArray(s.products) ? s.products.slice(0, 8).map((p) => clean(p.name)).join(", ") : ""}`,
        `Station page: https://tidesandcurrents.noaa.gov/stationhome.html?id=${clean(s.id)}`].join("\n");
}
export async function tideRange(a) {
    const id = clean(a.station);
    if (!/^[A-Za-z0-9]{5,10}$/.test(id))
        throw new TidesError(`"${id}" is not a NOAA station id`);
    const data = await predictions(id, a.begin, a.end, "hilo", a.units);
    const rows = Array.isArray(data?.predictions) ? data.predictions : [];
    if (!rows.length)
        return `No tide predictions for ${id} between ${a.begin} and ${a.end}.`;
    const values = rows.map((p) => Number(p.v)).filter((v) => Number.isFinite(v));
    const highs = rows.filter((p) => clean(p.type).toLowerCase() === "h");
    const lows = rows.filter((p) => clean(p.type).toLowerCase() === "l");
    const unit = a.units === "metric" ? "m" : "ft";
    return [`Tide range for ${id} · ${a.begin} to ${a.end}`, "",
        `Highest: ${Math.max(...values).toFixed(2)} ${unit}`,
        `Lowest: ${Math.min(...values).toFixed(2)} ${unit}`,
        `Range: ${(Math.max(...values) - Math.min(...values)).toFixed(2)} ${unit}`,
        `High tides: ${highs.length} · low tides: ${lows.length}`,
        `Next high: ${clean(highs[0]?.t) || "n/a"} ${clean(highs[0]?.v)} ${unit}`,
        `Next low: ${clean(lows[0]?.t) || "n/a"} ${clean(lows[0]?.v)} ${unit}`].join("\n");
}
function clean(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
