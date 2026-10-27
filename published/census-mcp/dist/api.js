const KEY = process.env.CENSUS_API_KEY;
export class CensusError extends Error {
}
async function request(path) {
    if (!KEY)
        throw new CensusError("Set the CENSUS_API_KEY environment variable to your free Census API key");
    const res = await fetch(`https://api.census.gov${path}&key=${KEY}`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new CensusError(`Census error ${res.status}`);
    return (await res.json());
}
function formatTable(rows) {
    return rows.slice(1).map((r) => `${r[0]}: ${Number(r[1] ?? 0).toLocaleString()}`).join("\n");
}
export async function nationPopulation(_args) {
    const rows = await request("/data/2022/acs/acs5?get=NAME,B01001_001E&for=us:1");
    return `US population\n${formatTable(rows)}`;
}
export async function statePopulation(args) {
    const st = args.state ?? "";
    const rows = await request(`/data/2022/acs/acs5?get=NAME,B01001_001E&for=state:${st}`);
    return `State population\n${formatTable(rows)}`;
}
export async function countyPopulation(args) {
    const st = args.state ?? "";
    const rows = await request(`/data/2022/acs/acs5?get=NAME,B01001_001E&for=county:*&in=state:${st}`);
    const lines = rows.slice(1).sort((a, b) => Number(b[1] ?? 0) - Number(a[1] ?? 0)).slice(0, 25);
    return `Top counties in state ${st}\n${lines.map((r) => `${r[0]}: ${Number(r[1] ?? 0).toLocaleString()}`).join("\n")}`;
}
async function stateVariable(label, variable, state) {
    const st = (state ?? "").trim();
    if (!st)
        throw new CensusError("Provide a state FIPS code like 06");
    const rows = await request(`/data/2022/acs/acs5?get=NAME,${variable}&for=state:${st}`);
    return `${label}\n${formatTable(rows)}`;
}
export async function medianIncome(args) {
    return stateVariable("Median household income by state", "B19013_001E", args.state ?? "");
}
export async function povertyCount(args) {
    return stateVariable("Population below poverty by state", "B17001_002E", args.state ?? "");
}
export async function bachelorCount(args) {
    return stateVariable("Bachelor's degree holders by state", "B15003_022E", args.state ?? "");
}
export async function housingUnits(args) {
    return stateVariable("Housing units by state", "B25001_001E", args.state ?? "");
}
export async function unemployedCount(args) {
    return stateVariable("Unemployed population by state", "B23025_005E", args.state ?? "");
}
export async function medianAge(args) {
    const st = (args.state ?? "").trim();
    if (!st)
        throw new CensusError("Provide a state FIPS code like 06");
    const rows = await request(`/data/2022/acs/acs5?get=NAME,B01002_001E&for=state:${st}`);
    return `Median age by state\n${rows.slice(1).map((r) => `${r[0]}: ${r[1] ?? "?"}`).join("\n")}`;
}
export async function hispanicCount(args) {
    return stateVariable("Hispanic or Latino population by state", "B03002_012E", args.state ?? "");
}
