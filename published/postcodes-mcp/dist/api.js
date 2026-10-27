const BASE = 'https://api.postcodes.io';
const UA = 'mrfentmen-postcodes-mcp/1.0';
export async function lookup(args) {
    const postcode = (args.postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
    if (!postcode)
        return 'Provide a UK postcode.';
    const res = await fetch(`${BASE}/postcodes/${encodeURIComponent(postcode)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`postcodes.io returned ${res.status}`);
    const d = (await res.json());
    const r = d.result ?? {};
    return [
        `Postcode: ${r.postcode ?? postcode} (quality ${r.quality ?? '?'})`,
        `Country: ${r.country ?? '?'} | Region: ${r.region ?? '?'}`,
        `District: ${r.admin_district ?? '?'} | Ward: ${r.admin_ward ?? '?'}`,
        `Coordinates: ${r.latitude ?? '?'}, ${r.longitude ?? '?'}`,
        r.eastings != null ? `Grid ref: ${r.eastings}, ${r.northings}` : null,
    ].filter(Boolean).join('\n');
}
export async function random(_args) {
    const res = await fetch(`${BASE}/random/postcodes`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`postcodes.io returned ${res.status}`);
    const d = (await res.json());
    const results = d.result ?? [];
    if (!results.length)
        return 'No postcode returned.';
    const r = results[0];
    return `Random postcode: ${r.postcode ?? '?'} [${r.country ?? '?'}, ${r.region ?? '?'}]`;
}
