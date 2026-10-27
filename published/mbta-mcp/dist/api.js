const UA = 'mrfentmen-mbta-mcp/1.0';
export async function routes(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
    const res = await fetch(`https://api-v3.mbta.com/routes?page%5Blimit%5D=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MBTA returned ${res.status}`);
    const d = (await res.json());
    const list = d.data ?? [];
    if (!list.length)
        return 'No routes returned.';
    const typeName = (t) => ({ 0: 'Light rail', 1: 'Heavy rail', 2: 'Commuter rail', 3: 'Bus', 4: 'Ferry' }[t ?? -1] ?? `type ${t}`);
    return `MBTA routes (${list.length}):\n` +
        list.slice(0, limit).map((r, i) => `${i + 1}. ${r.attributes?.short_name ?? '?'} - ${r.attributes?.long_name ?? '?'} (${typeName(r.attributes?.type)}) #${r.id ?? '?'}`).join('\n');
}
// ---- muxB tools:
const API = 'https://api-v3.mbta.com';
async function mbtaGet(path) {
    const res = await fetch(`${API}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MBTA returned ${res.status}`);
    return (await res.json());
}
const attr = (row, key) => {
    const v = row.attributes?.[key];
    return v == null || v === '' ? 'not reported' : String(v);
};
