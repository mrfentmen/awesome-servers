const BASE = "https://data.epa.gov/efservice";
const UA = "mrfentmen-epa-frs-mcp/1.0 (https://github.com/mrfentmen)";
export class FRSError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Encoding": "identity" },
        signal: AbortSignal.timeout(90000),
    });
    if (!res.ok)
        throw new FRSError(`EPA FRS returned HTTP ${res.status}`);
    return (await res.json());
}
function addr(f) {
    return [f?.address1, f?.city, f?.state, f?.zip].filter(Boolean).join(", ") || "no address";
}
function fmtFacility(f, i) {
    const lines = [
        `${i + 1}. ${f?.facility_name ?? "n/a"} | frs ${f?.frs_id ?? f?.facility_id ?? "n/a"}`,
        `   ${addr(f)}`,
    ];
    if (f?.county)
        lines.push(`   County: ${f.county}`);
    if (f?.naics_code)
        lines.push(`   NAICS: ${f.naics_code}`);
    if (f?.latitude != null && f?.longitude != null)
        lines.push(`   ${f.latitude}, ${f.longitude}`);
    return lines.join("\n");
}
export async function byState(args) {
    const state = (args.state ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state))
        throw new FRSError("Provide a two letter state code like VA");
    const limit = Math.min(args.limit ?? 10, 25);
    const list = await get(`${BASE}/PUB_DIM_FACILITY/STATE/${encodeURIComponent(state)}/JSON`);
    const rows = (list ?? []).slice(0, limit);
    if (!rows.length)
        return `No facilities found in ${state}`;
    return `EPA facilities in ${state} (${list?.length ?? rows.length} total, ${rows.length} shown):\n` + rows.map(fmtFacility).join("\n");
}
export async function facility(args) {
    const id = (args.registryId ?? "").trim();
    if (!/^\d+$/.test(id))
        throw new FRSError("Provide a numeric FRS registry ID");
    const list = await get(`${BASE}/PUB_DIM_FACILITY/FRS_ID/${encodeURIComponent(id)}/JSON`);
    const f = (list ?? [])[0];
    if (!f)
        throw new FRSError(`Facility not found: ${id}`);
    const lines = [
        `Name: ${f?.facility_name ?? "n/a"}`,
        `FRS ID: ${f?.frs_id ?? f?.facility_id ?? id}`,
        `Address: ${addr(f) || "n/a"}`,
        `County: ${f?.county ?? "n/a"}`,
        `State: ${f?.state_name ?? f?.state ?? "n/a"}`,
    ];
    if (f?.latitude != null && f?.longitude != null)
        lines.push(`Coordinates: ${f.latitude}, ${f.longitude}`);
    if (f?.naics_code)
        lines.push(`NAICS: ${f.naics_code}`);
    if (f?.parent_company)
        lines.push(`Parent: ${f.parent_company}`);
    return lines.join("\n");
}
const countOf = (rows) => {
    const first = Array.isArray(rows) ? rows[0] : undefined;
    return first && typeof first.TOTALQUERYRESULTS === 'number' ? first.TOTALQUERYRESULTS : null;
};
function stateFilter(state) {
    if (!/^[A-Z]{2}$/.test(state))
        throw new FRSError('Provide a two letter state code like VA');
    return `/STATE_CODE/${encodeURIComponent(state)}`;
}
export async function programCount(args = {}) {
    const raw = (args.state ?? '').trim().toUpperCase();
    const suffix = raw ? stateFilter(raw) : '';
    const rows = await get(`${BASE}/FRS_PROGRAM_FACILITY${suffix}/COUNT/JSON`);
    const total = countOf(rows);
    if (total === null)
        throw new FRSError('The EPA service did not return a count.');
    const where = raw ? `in ${raw}` : 'across the whole country';
    return [
        `Facility to programme registrations ${where}: ${total.toLocaleString('en-US')}`,
        '  one row per facility per programme, so a single facility is counted once for each programme it is registered under.',
        '  this is the count the EPA service itself returns, not a count of the rows fetched.',
    ].join('\n');
}
