const BASE = "https://data.cityofnewyork.us/resource/qgea-i56i.json";
const HEADERS = { "User-Agent": "mrfentmen-police-transparency-mcp/1.0" };
export class PoliceTransparencyError extends Error {
}
const GROUP_COLUMNS = {
    borough: "boro_nm",
    law_category: "law_cat_cd",
    offense: "ofns_desc",
};
function quote(value) { return `'${value.replaceAll("'", "''")}'`; }
async function aggregate(params) {
    const url = new URL(BASE);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    if (!response.ok)
        throw new PoliceTransparencyError(`NYC Open Data police error ${response.status}`);
    return response.json();
}
export async function summarize(group, year, borough, limit = 50) {
    const column = GROUP_COLUMNS[group];
    const where = [];
    if (year)
        where.push(`cmplnt_fr_dt >= ${quote(`${year}-01-01T00:00:00.000`)} AND cmplnt_fr_dt < ${quote(`${year + 1}-01-01T00:00:00.000`)}`);
    if (borough)
        where.push(`boro_nm = ${quote(borough.toUpperCase())}`);
    return aggregate({
        $select: `${column},count(*) as total`,
        $group: column,
        $having: "count(*) >= 5",
        $order: "total DESC",
        $limit: String(limit),
        ...(where.length ? { $where: where.join(" AND ") } : {}),
    });
}
export function format(value) { return JSON.stringify(value, null, 2).slice(0, 14000); }
// ---- muxB tools:
const FORCE_BASE = "https://data.cityofnewyork.us/resource/f4tj-796d.json";
const ARREST_BASE = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";
const PATROL_BOROUGHS = {
    BRONX: "PBBX",
    BROOKLYN: "PBBN",
    MANHATTAN: "PBMN",
    QUEENS: "PBQS",
    "STATEN ISLAND": "PBSI",
};
const ARREST_BOROUGHS = {
    BRONX: "B",
    BROOKLYN: "K",
    MANHATTAN: "M",
    QUEENS: "Q",
    "STATEN ISLAND": "S",
};
async function aggregateAt(base, params) {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    if (!response.ok)
        throw new PoliceTransparencyError(`NYC Open Data police error ${response.status}`);
    return response.json();
}
