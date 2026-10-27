export const errorMessage = (e) => e instanceof Error ? e.message : String(e);
// ---- gap4d4 tools:
async function licenseJson(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'license-boundary-mcp/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new Error(`License source returned HTTP ${res.status}`);
    return await res.json();
}
function licenseField(value) {
    return value == null ? 'not reported' : String(value).replace(/\s+/g, ' ').slice(0, 500);
}
export async function searchSpdx(args) {
    const data = await licenseJson('https://spdx.org/licenses/licenses.json');
    const query = (args.query ?? '').toLowerCase();
    const rows = data.licenses.filter(r => `${r.licenseId} ${r.name}`.toLowerCase().includes(query)).slice(0, Math.max(1, Math.min(Math.floor(args.limit ?? 10), 30)));
    return `SPDX list ${licenseField(data.licenseListVersion)}; ${rows.length} matches shown:\n` + rows.map(r => `${licenseField(r.licenseId)} | ${licenseField(r.name)} | OSI approved: ${licenseField(r.isOsiApproved)} | deprecated: ${licenseField(r.isDeprecatedLicenseId)}`).join('\n');
}
export async function spdxLicense(args) {
    const d = await licenseJson(`https://spdx.org/licenses/${encodeURIComponent(args.id)}.json`);
    if (!d.licenseId)
        throw new Error('The source did not report a license ID.');
    return `${licenseField(d.licenseId)} | ${licenseField(d.name)}\nOSI approved: ${licenseField(d.isOsiApproved)}; FSF libre: ${licenseField(d.isFsfLibre)}; deprecated: ${licenseField(d.isDeprecatedLicenseId)}\nPublic reference text (up to 6000 characters):\n${d.licenseText?.slice(0, 6000) ?? 'not reported'}`;
}
export async function spdxException(args) {
    const d = await licenseJson(`https://spdx.org/licenses/${encodeURIComponent(args.id)}.json`);
    if (!d.licenseExceptionId)
        throw new Error('The source did not report an exception ID.');
    return `${licenseField(d.licenseExceptionId)} | ${licenseField(d.name)}\n${licenseField(d.licenseComments)}\nPublic exception text (up to 6000 characters):\n${d.licenseExceptionText?.slice(0, 6000) ?? 'not reported'}`;
}
