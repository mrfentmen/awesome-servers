/**
 * US Drought Monitor — keyless public API client.
 */
const BASE = "https://usdmdataservices.unl.edu/api";
const SOURCE = "US Drought Monitor";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "drought-mcp", accept },
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
const NAMES = {
    1: "Alabama", 2: "Alaska", 4: "Arizona", 5: "Arkansas", 6: "California", 8: "Colorado", 9: "Connecticut",
    10: "Delaware", 12: "Florida", 13: "Georgia", 15: "Hawaii", 16: "Idaho", 17: "Illinois", 18: "Indiana",
    19: "Iowa", 20: "Kansas", 21: "Kentucky", 22: "Louisiana", 23: "Maine", 24: "Maryland", 25: "Massachusetts",
    26: "Michigan", 27: "Minnesota", 28: "Mississippi", 29: "Missouri", 30: "Montana", 31: "Nebraska",
    32: "Nevada", 33: "New Hampshire", 34: "New Jersey", 35: "New Mexico", 36: "New York", 37: "North Carolina",
    38: "North Dakota", 39: "Ohio", 40: "Oklahoma", 41: "Oregon", 42: "Pennsylvania", 44: "Rhode Island",
    45: "South Carolina", 46: "South Dakota", 47: "Tennessee", 48: "Texas", 49: "Utah", 50: "Vermont",
    51: "Virginia", 53: "Washington", 54: "West Virginia", 55: "Wisconsin", 56: "Wyoming", 60: "American Samoa",
    66: "Guam", 69: "Northern Mariana Islands", 72: "Puerto Rico", 78: "US Virgin Islands",
};
function name(code) {
    return NAMES[code] ?? `FIPS ${code}`;
}
function checkDate(value, label) {
    const v = clean(value);
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v))
        throw new SourceError(`${label} must look like MM/DD/YYYY`);
    return v;
}
function checkFips(value) {
    if (!Number.isInteger(value) || value < 1 || value > 78 || !NAMES[value])
        throw new SourceError(`stateFips ${value} is not a US state or territory FIPS code`);
    return value;
}
export async function stateDrought(a) {
    const fips = checkFips(a.stateFips);
    const start = checkDate(a.start, "start");
    const end = checkDate(a.end, "end");
    const statisticsType = a.weekly ? 2 : 1;
    const params = new URLSearchParams({ aoi: String(fips).padStart(2, "0"), startdate: start, enddate: end, statisticsType: String(statisticsType) });
    const rows = await getJson(`/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?${params.toString()}`);
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length)
        return `The Drought Monitor has no statistics for ${name(fips)} between ${start} and ${end}.`;
    const last = list[list.length - 1];
    return [
        `US Drought Monitor - ${name(fips)} (${statisticsType === 2 ? "weekly average" : "cumulative"}), ${list.length} week(s) from ${start} to ${end}:`,
        "",
        `Latest week ${clean(last.mapDate).slice(0, 10)}:`,
        `  none ${Number(last.none ?? 0).toFixed(1)}% · D0 ${Number(last.d0 ?? 0).toFixed(1)}% · D1 ${Number(last.d1 ?? 0).toFixed(1)}% · D2 ${Number(last.d2 ?? 0).toFixed(1)}% · D3 ${Number(last.d3 ?? 0).toFixed(1)}% · D4 ${Number(last.d4 ?? 0).toFixed(1)}%`,
        `  at least one category: ${Number(last.d0 ?? 0).toFixed(1)}% of the state · exceptional (D4): ${Number(last.d4 ?? 0).toFixed(1)}%`,
        "",
        ...list.slice(-5, -1).map((r) => `  ${clean(r.mapDate).slice(0, 10)}  D0 ${Number(r.d0 ?? 0).toFixed(1)}%  D1 ${Number(r.d1 ?? 0).toFixed(1)}%  D2 ${Number(r.d2 ?? 0).toFixed(1)}%  D3 ${Number(r.d3 ?? 0).toFixed(1)}%  D4 ${Number(r.d4 ?? 0).toFixed(1)}%`),
        "",
        `Map: https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${name(fips).replace(/\s+/g, "_")}`,
    ].filter((l) => l !== undefined).join("\n");
}
export async function compareStates(a) {
    const codes = a.stateFips.map(checkFips);
    const date = checkDate(a.date, "date");
    const out = [];
    for (const fips of codes) {
        const params = new URLSearchParams({ aoi: String(fips).padStart(2, "0"), startdate: date, enddate: date, statisticsType: "1" });
        const rows = await getJson(`/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?${params.toString()}`);
        const row = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : undefined;
        if (!row) {
            out.push(`${name(fips)}: no data for ${date}`);
            continue;
        }
        out.push(`${name(fips).padEnd(20)} none ${Number(row.none ?? 0).toFixed(1).padStart(5)}%  D0 ${Number(row.d0 ?? 0).toFixed(1).padStart(5)}%  D1 ${Number(row.d1 ?? 0).toFixed(1).padStart(5)}%  D2 ${Number(row.d2 ?? 0).toFixed(1).padStart(5)}%  D3 ${Number(row.d3 ?? 0).toFixed(1).padStart(5)}%  D4 ${Number(row.d4 ?? 0).toFixed(1).padStart(5)}%`);
    }
    return [`US Drought Monitor shares for ${date}:`, "", ...out].join("\n");
}
export async function countyDrought(a) {
    const fips = clean(a.countyFips);
    if (!/^\d{5}$/.test(fips))
        throw new SourceError("countyFips must be a five-digit county FIPS code");
    const date = checkDate(a.date, "date");
    const params = new URLSearchParams({ aoi: fips, startdate: date, enddate: date, statisticsType: "1" });
    const rows = await getJson(`/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?${params.toString()}`);
    const row = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : undefined;
    if (!row)
        return `The Drought Monitor has no data for county ${fips} on ${date}.`;
    return section(`${clean(row.county) || fips}, ${clean(row.state)} · week of ${clean(row.validStart)}`, [
        bullet("No drought", `${Number(row.none ?? 0).toFixed(1)}%`),
        bullet("D0 abnormally dry", `${Number(row.d0 ?? 0).toFixed(1)}%`),
        bullet("D1 moderate", `${Number(row.d1 ?? 0).toFixed(1)}%`),
        bullet("D2 severe", `${Number(row.d2 ?? 0).toFixed(1)}%`),
        bullet("D3 extreme", `${Number(row.d3 ?? 0).toFixed(1)}%`),
        bullet("D4 exceptional", `${Number(row.d4 ?? 0).toFixed(1)}%`),
    ]);
}
export async function nationalSummary(a) {
    const date = checkDate(a.date, "date");
    const params = new URLSearchParams({ aoi: "us", startdate: date, enddate: date, statisticsType: "1" });
    const rows = await getJson(`/USStatistics/GetDroughtSeverityStatisticsByAreaPercent?${params.toString()}`);
    const row = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : undefined;
    if (!row)
        return `The Drought Monitor has no national data for ${date}.`;
    return section(`US drought summary · week of ${clean(row.validStart)}`, [
        bullet("No drought", `${Number(row.none ?? 0).toFixed(1)}%`),
        bullet("D0 abnormally dry", `${Number(row.d0 ?? 0).toFixed(1)}%`),
        bullet("D1 moderate", `${Number(row.d1 ?? 0).toFixed(1)}%`),
        bullet("D2 severe", `${Number(row.d2 ?? 0).toFixed(1)}%`),
        bullet("D3 extreme", `${Number(row.d3 ?? 0).toFixed(1)}%`),
        bullet("D4 exceptional", `${Number(row.d4 ?? 0).toFixed(1)}%`),
    ]);
}
export async function droughtTrend(a) {
    const fips = checkFips(a.stateFips);
    const weeks = a.weeks;
    const end = new Date();
    const start = new Date(end.getTime() - weeks * 7 * 86400000);
    const fmt = (d) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
    const params = new URLSearchParams({ aoi: String(fips).padStart(2, "0"), startdate: fmt(start), enddate: fmt(end), statisticsType: "1" });
    const rows = await getJson(`/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?${params.toString()}`);
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length)
        return `The Drought Monitor has no trend data for ${name(fips)}.`;
    return section(`${name(fips)} drought trend · last ${list.length} week(s)`, list.map((r) => {
        const d0 = Number(r.d0 ?? 0);
        const d4 = Number(r.d4 ?? 0);
        return `${clean(r.mapDate).slice(0, 10)} · D0+ ${d0.toFixed(1)}% · D4 ${d4.toFixed(1)}%`;
    }));
}
