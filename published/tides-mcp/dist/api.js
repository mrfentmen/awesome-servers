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
