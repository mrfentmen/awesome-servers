/**
 * USGS Water Services client. Keyless. Site metadata plus instantaneous and
 * daily values for streams, rivers, lakes and groundwater wells.
 */
const BASE = "https://waterservices.usgs.gov/nwis";
export class WaterError extends Error {
}
async function getJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "waterdata-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new WaterError(`USGS error ${res.status}`);
    return (await res.json());
}
export const PARAMETERS = {
    "00060": "Discharge, cubic feet per second",
    "00065": "Gage height, feet",
    "00010": "Temperature, water, degrees Celsius",
    "00045": "Precipitation, total, inches",
    "00300": "Dissolved oxygen, mg/L",
    "00400": "pH, standard units",
    "63680": "Turbidity, FNU",
    "72137": "Tidal elevation",
    "62614": "Lake elevation",
    "72019": "Depth to water level, feet below land surface",
};
function points(s) {
    return (s.values?.[0]?.value ?? []).map((v) => ({ value: String(v.value ?? ""), dateTime: String(v.dateTime ?? "") }));
}
export function seriesLines(series, limit = 20) {
    if (!series.length)
        return "No data returned for that site and parameter.";
    const out = [];
    for (const s of series.slice(0, 3)) {
        const name = s.sourceInfo?.siteName ?? "site";
        const param = s.variable?.variableDescription ?? s.variable?.variableCode?.[0]?.value ?? "value";
        const unit = s.variable?.unit?.unitCode ?? "";
        const rows = points(s).slice(-limit);
        out.push(`${name} — ${param} (${unit})`);
        out.push(rows.map((p) => `${p.dateTime}  ${p.value}`).join("\n") || "  no readings");
    }
    return out.join("\n");
}
export async function instantaneous(site, parameter, days) {
    const url = `${BASE}/iv/?format=json&sites=${encodeURIComponent(site)}&parameterCd=${encodeURIComponent(parameter)}&period=P${days}D`;
    return (await getJson(url)).value?.timeSeries ?? [];
}
export async function daily(site, parameter, days) {
    const url = `${BASE}/dv/?format=json&sites=${encodeURIComponent(site)}&parameterCd=${encodeURIComponent(parameter)}&period=P${days}D`;
    return (await getJson(url)).value?.timeSeries ?? [];
}
/** The site service speaks RDB (tab separated with a header line). */
function parseRdb(text) {
    const lines = text.split("\n").filter((l) => l && !l.startsWith("#"));
    if (lines.length < 3)
        return [];
    const header = lines[0].split("\t");
    const rows = lines.slice(2);
    const idx = (k) => header.indexOf(k);
    return rows
        .map((line) => line.split("\t"))
        .filter((cols) => cols.length > 2)
        .map((cols) => ({
        site: cols[idx("site_no")] ?? "",
        name: cols[idx("station_nm")] ?? "",
        lat: Number(cols[idx("dec_lat_va")]),
        lon: Number(cols[idx("dec_long_va")]),
        state: cols[idx("state_cd")] ?? "",
        county: cols[idx("county_cd")] ?? "",
    }));
}
export async function siteInfo(site) {
    const url = `${BASE}/site/?format=rdb&sites=${encodeURIComponent(site)}&siteOutput=expanded`;
    const res = await fetch(url, {
        headers: { "User-Agent": "waterdata-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new WaterError(`USGS error ${res.status}`);
    return parseRdb(await res.text());
}
export async function sitesInState(state, limit) {
    const url = `${BASE}/site/?format=rdb&stateCd=${encodeURIComponent(state)}&siteType=ST&hasDataTypeCd=iv&siteOutput=basic`;
    const res = await fetch(url, {
        headers: { "User-Agent": "waterdata-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(45000),
    });
    if (!res.ok)
        throw new WaterError(`USGS error ${res.status}`);
    return parseRdb(await res.text()).slice(0, limit);
}
export function describeSite(row) {
    const place = [row.county ? `county ${row.county}` : "", row.state ? `state ${row.state}` : ""]
        .filter(Boolean)
        .join(", ");
    return `${row.name} (${row.site})${place ? ` — ${place}` : ""}${Number.isFinite(row.lat) ? ` @ ${row.lat}, ${row.lon}` : ""}`;
}
