const BASE = "https://waterservices.usgs.gov/nwis";
const H = { "User-Agent": "mrfentmen-usgs-water-mcp/1.0" };
export class WaterError extends Error {
}
async function get(path, params) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok)
    throw new WaterError(`USGS Water error ${r.status}`); return r.json(); }
export function streamflow(site, parameter = "00060", start, end) { return get("iv/", { format: "json", sites: site, parameterCd: parameter, siteStatus: "all", ...(start ? { startDT: start } : {}), ...(end ? { endDT: end } : {}) }); }
export async function gauges(bbox, limit = 20) { const data = await get("site/", { format: "json", bBox: bbox, siteStatus: "active", siteType: "ST", seriesCatalogOutput: "false" }); if (Array.isArray(data.value?.sourceInfo))
    data.value.sourceInfo = data.value.sourceInfo.slice(0, limit); return data; }
export function format(data) { return JSON.stringify(data, null, 2).slice(0, 12000); }
/** USGS qualifier codes seen on these routes. */
const QUALIFIER = { P: "provisional", A: "approved", e: "estimated" };
function seriesList(d) {
    const list = d?.value?.timeSeries;
    return Array.isArray(list) ? list : [];
}
function points(t) {
    const first = Array.isArray(t?.values) ? t.values[0] : undefined;
    return Array.isArray(first?.value) ? first?.value : [];
}
function label(t) {
    const site = t?.sourceInfo?.siteName ?? "unknown site";
    const code = t?.sourceInfo?.siteCode?.[0]?.value ?? "?";
    const what = t?.variable?.variableDescription ?? "unknown parameter";
    const unit = t?.variable?.unit?.unitCode ?? "?";
    return `${site} (${code}) — ${what} in ${unit}`;
}
function qualifierText(qualifiers) {
    const q = (qualifiers ?? [])[0];
    if (!q)
        return "";
    return ` [${QUALIFIER[q] ?? q}]`;
}
export async function latestValue(args) {
    const site = (args.site ?? "").trim();
    if (!site)
        throw new WaterError("Provide a USGS site number, like 01646500.");
    const parameter = (args.parameter ?? "00060").trim() || "00060";
    const d = await get("iv/", { format: "json", sites: site, parameterCd: parameter, period: "PT1H" });
    const ts = seriesList(d);
    if (!ts.length)
        return `No instantaneous values for site ${site} and parameter ${parameter} in the last hour.`;
    const lines = ["USGS latest instantaneous readings, last hour:"];
    for (const t of ts.slice(0, 5)) {
        const values = points(t).filter((p) => typeof p.value === "string" && p.value.trim() !== "");
        const last = values[values.length - 1];
        lines.push(`  ${label(t)}`);
        if (!last) {
            lines.push("    no reading reported in the last hour");
            continue;
        }
        lines.push(`    ${last.value}${qualifierText(last.qualifiers)} at ${last.dateTime ?? "unknown time"}`);
        lines.push(`    ${values.length} readings in the last hour`);
    }
    lines.push("Provisional readings can still be revised by USGS.");
    return lines.join("\n");
}
