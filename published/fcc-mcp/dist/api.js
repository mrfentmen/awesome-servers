const UA = 'mrfentmen-fcc-mcp/1.0';
export async function find(args) {
    const lat = Number(args.lat), lon = Number(args.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        throw new Error('Provide valid lat and lon.');
    const res = await fetch(`https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lon}&format=json`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`FCC returned ${res.status}`);
    const d = (await res.json());
    if (!d.Block?.FIPS)
        throw new Error(`No census block for ${lat},${lon}.`);
    const fips = d.Block.FIPS;
    return `Census block for ${lat},${lon}:\nFIPS: ${fips}\nState: ${d.State?.name ?? '?'} (${d.State?.code ?? '?'})\nCounty: ${d.County?.name ?? '?'}\nState FIPS: ${d.State?.FIPS ?? '?'} | County FIPS: ${d.County?.FIPS ?? '?'}\nTract: ${fips.slice(2, 11)} | Block: ${fips.slice(11)}`;
}
function bdcHeaders() {
    const user = process.env.FCC_USERNAME?.trim();
    const hash = process.env.FCC_HASH?.trim();
    if (!user || !hash)
        throw new Error('Set FCC_USERNAME and FCC_HASH (Broadband Data Collection API key).');
    return { 'User-Agent': UA, Accept: 'application/json', username: user, hash_value: hash };
}
export async function asOfDates(args) {
    const type = (args.type ?? '').trim();
    const url = `https://broadbandmap.fcc.gov/api/public/map/listAsOfDates${type ? `?type=${encodeURIComponent(type)}` : ''}`;
    const res = await fetch(url, { headers: bdcHeaders(), signal: AbortSignal.timeout(25000) });
    if (res.status === 401)
        throw new Error('FCC rejected the credentials (401). Check FCC_USERNAME/FCC_HASH.');
    if (!res.ok)
        throw new Error(`FCC returned ${res.status}`);
    const d = (await res.json());
    const rows = d.data ?? [];
    if (!rows.length)
        return 'No as-of dates returned.';
    return rows.map((r) => `${r.as_of_date ?? '?'} (${r.data_type ?? '?'})`).join('\n');
}
