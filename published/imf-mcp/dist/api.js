const BASE = 'https://www.imf.org/external/datamapper/api/v1';
const UA = 'mrfentmen-imf-mcp/1.0';
export async function indicator(args) {
    const indicator = (args.indicator ?? '').trim().toUpperCase();
    if (!indicator)
        return 'Provide an indicator like NGDPD.';
    const country = (args?.country ?? '').trim().toUpperCase();
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
    const res = await fetch(`${BASE}/${encodeURIComponent(indicator)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`IMF returned ${res.status}`);
    const d = (await res.json());
    const values = d.values ?? {};
    const series = values[indicator] ?? {};
    const keys = country ? [country] : Object.keys(series).slice(0, 5);
    if (!keys.length)
        return `No IMF data for ${indicator}.`;
    const rows = [];
    for (const code of keys) {
        const years = series[code] ?? {};
        const yearKeys = Object.keys(years).sort().slice(-limit);
        if (!yearKeys.length)
            continue;
        rows.push(`${code}: ${yearKeys.map((y) => `${y}=${years[y]}`).join(', ')}`);
    }
    if (!rows.length)
        return `No IMF data for ${indicator}${country ? ` / ${country}` : ''}.`;
    return `IMF indicator ${indicator}${country ? ` for ${country}` : ''}:\n${rows.join('\n')}`;
}
export async function indicatorsList(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 15) || 15, 1), 50);
    const res = await fetch(`${BASE}/indicators`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`IMF returned ${res.status}`);
    const d = (await res.json());
    const entries = Object.entries(d.indicators ?? {}).slice(0, limit);
    if (!entries.length)
        return 'No IMF indicators returned.';
    return entries.map(([code, m], i) => `${i + 1}. ${code} — ${m.label ?? ''}${m.unit ? ` (${m.unit})` : ''}`).join('\n');
}
export async function compareCountries(args) {
    const indicator = (args.indicator ?? '').trim().toUpperCase();
    if (!indicator)
        return 'Provide an indicator like NGDP_RPCH.';
    const year = (args.year ?? '').trim();
    const list = (args.countries ?? 'USA,CHN,DEU,JPN,GBR').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 10);
    const res = await fetch(`${BASE}/${encodeURIComponent(indicator)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`IMF returned ${res.status}`);
    const d = (await res.json());
    const series = (d.values ?? {})[indicator] ?? {};
    const rows = [];
    for (const code of list) {
        const years = series[code] ?? {};
        const keys = Object.keys(years).sort();
        const y = year || keys[keys.length - 1] || '';
        const v = y ? years[y] : undefined;
        rows.push(`${code}: ${y ? `${y}=${v ?? 'n/a'}` : 'no data'}`);
    }
    return `IMF ${indicator} comparison:\n${rows.join('\n')}`;
}
