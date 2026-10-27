const BASE = 'https://data.police.uk/api/crimes-street';
export async function street(args) {
    const lat = Number(args.lat);
    const lng = Number(args.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return 'Provide valid coordinates.';
    const date = (args.date ?? '').trim();
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (date)
        params.set('date', date);
    const res = await fetch(`${BASE}/all-crime?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-ukpolice-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`data.police.uk returned ${res.status}`);
    const d = (await res.json());
    if (!d.length)
        return `No crimes reported near ${lat}, ${lng}.`;
    const byCat = {};
    for (const r of d) {
        const cat = String(r.category ?? 'unknown');
        byCat[cat] = (byCat[cat] ?? 0) + 1;
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return [
        `Crimes near ${lat}, ${lng} (${d.length} total${date ? ` in ${date}` : ''}):`,
        ...top.map(([cat, n]) => `${cat}: ${n}`),
        '',
        `Recent (${Math.min(d.length, limit)}):`,
        ...d.slice(0, limit).map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            const out = (r.outcome_category ?? '');
            return `${i + 1}. ${s('category')}${out ? ` | ${out}` : ''} (${s('month')})`;
        }),
    ].join('\n');
}
// ---- muxC tools:
const UKP_UA = "mrfentmen-ukpolice-mcp/1.0 (https://github.com/mrfentmen)";
async function ukPolice(path, ms = 30000) {
    const res = await fetch(`https://data.police.uk/api${path}`, { headers: { "User-Agent": UKP_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (res.status === 404)
        throw new Error(`data.police.uk returned 404 for ${path}; that route is no longer published`);
    if (!res.ok)
        throw new Error(`data.police.uk returned ${res.status} for ${path}`);
    return await res.json();
}
