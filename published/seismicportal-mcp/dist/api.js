const BASE = 'https://www.seismicportal.eu/fdsnws/event/1/query';
async function query(minMag, args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}?limit=${limit}&format=json&minmag=${minMag}`, {
        headers: { 'User-Agent': 'mrfentmen-seismicportal-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Seismic portal returned ${res.status}`);
    const d = (await res.json());
    const feats = d.features ?? [];
    if (!feats.length)
        return 'No earthquakes returned.';
    return `Earthquakes (${feats.length} shown):\n` +
        feats.map((f, i) => {
            const p = (f.properties ?? {});
            const s = (k) => (p[k] != null ? String(p[k]) : '');
            return `${i + 1}. M${s('mag')} at ${s('time').replace('T', ' ').slice(0, 16)} | ${s('place')}`;
        }).join('\n');
}
export function recent(args) {
    return query(0, args);
}
export function significant(args) {
    return query(5, args);
}
async function features(params) {
    const res = await fetch(`${BASE}?format=json&${params}`, {
        headers: { 'User-Agent': 'mrfentmen-seismicportal-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Seismic portal returned ${res.status}`);
    const d = (await res.json());
    return d.features ?? [];
}
