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
/** What a set of high and low predictions adds up to: the tidal range, mean high and low water, and the biggest range in the window. */
export async function tideStatistics(args) {
    const begin = (args.begin ?? "").trim();
    const end = (args.end ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(begin) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        throw new TidesError("Give both dates as YYYY-MM-DD.");
    }
    if (end < begin)
        throw new TidesError("The end date must not be before the begin date.");
    const units = args.units === "metric" ? "metric" : "english";
    const data = await predictions(String(args.station ?? "").trim(), begin, end, "hilo", units);
    const rows = [];
    for (const r of (data.predictions ?? [])) {
        const v = Number(r.v);
        if (!Number.isFinite(v))
            continue;
        rows.push({ t: String(r.t ?? "time not reported"), v, type: String(r.type ?? "?") });
    }
    if (!rows.length)
        throw new TidesError("NOAA returned no high or low predictions for that station and window.");
    const highs = rows.filter((r) => r.type.toUpperCase().startsWith("H"));
    const lows = rows.filter((r) => r.type.toUpperCase().startsWith("L"));
    const unitLabel = units === "metric" ? "m" : "ft";
    const mean = (values) => (values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3) : "not reported");
    const highest = highs.length ? highs.reduce((a, b) => (b.v > a.v ? b : a)) : null;
    const lowest = lows.length ? lows.reduce((a, b) => (b.v < a.v ? b : a)) : null;
    const biggest = highs.length && lows.length
        ? highs.reduce((best, h) => {
            const after = lows.filter((l) => l.t > h.t);
            const l = after.length ? after.reduce((a, b) => (a.v < b.v ? a : b)) : null;
            const range = l ? h.v - l.v : -Infinity;
            return range > best.range ? { high: h, low: l, range } : best;
        }, { high: null, low: null, range: -Infinity })
        : { high: null, low: null, range: -Infinity };
    return [
        `Tide statistics for station ${String(args.station ?? "").trim()} from ${begin} to ${end}, in ${unitLabel}`,
        `Predictions returned: ${rows.length} (${highs.length} high, ${lows.length} low)`,
        `Mean high water: ${mean(highs.map((r) => r.v))} ${unitLabel}`,
        `Mean low water: ${mean(lows.map((r) => r.v))} ${unitLabel}`,
        `Mean range: ${mean(highs.map((h) => h.v)) !== "not reported" && mean(lows.map((l) => l.v)) !== "not reported" ? `${(highs.reduce((a, b) => a + b.v, 0) / highs.length - lows.reduce((a, b) => a + b.v, 0) / lows.length).toFixed(3)} ${unitLabel}` : "not reported"}`,
        `Highest high: ${highest ? `${highest.v} ${unitLabel} at ${highest.t}` : "no high in the window"}`,
        `Lowest low: ${lowest ? `${lowest.v} ${unitLabel} at ${lowest.t}` : "no low in the window"}`,
        biggest.range > -Infinity && biggest.high && biggest.low
            ? `Greatest high to following low: ${biggest.range.toFixed(3)} ${unitLabel}, from ${biggest.high.v} at ${biggest.high.t} to ${biggest.low.v} at ${biggest.low.t}`
            : "Greatest high to following low: not computable, the window has no matched high and low pair.",
    ].join("\n");
}
