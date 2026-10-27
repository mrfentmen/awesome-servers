const UA = 'mrfentmen-envirocar-mcp/1.0';
const BASE = 'https://envirocar.org/api/stable';
export async function tracks(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    const res = await fetch(`${BASE}/tracks?limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`enviroCar returned ${res.status}`);
    const d = (await res.json());
    const list = d.tracks ?? [];
    if (!list.length)
        return 'No tracks returned.';
    return `Recent enviroCar tracks (${list.length} shown):\n` + list.map((t, i) => {
        const km = t.length != null ? (t.length / 1000).toFixed(2) : '?';
        return `${i + 1}. ${t.id ?? '?'} | ${km} km | ${t.begin ?? '?'} to ${t.end ?? '?'} | sensor ${t.sensor?.properties?.model ?? t.sensor?.type ?? '?'}`;
    }).join('\n');
}
export async function trackDetail(args) {
    const res = await fetch(`${BASE}/tracks/${encodeURIComponent(args.id)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`enviroCar returned ${res.status}`);
    const d = (await res.json());
    if (!d.id)
        throw new Error('No track returned.');
    const props = d.properties ?? [];
    const first = d.geometry?.coordinates?.[0];
    return `Track ${d.id}\nBegin: ${d.begin ?? '?'}\nEnd: ${d.end ?? '?'}\nLength: ${d.length != null ? `${(d.length / 1000).toFixed(2)} km` : '?'}\nStart: ${first ? `${first[1].toFixed(5)}, ${first[0].toFixed(5)}` : '?'}\nSensor: ${d.sensor?.properties?.manufacturer ?? ''} ${d.sensor?.properties?.model ?? ''} (${d.sensor?.type ?? '?'})\nMeasurements: ${props.length}\nSample: ${props.slice(0, 8).map((p) => `${p.name}=${p.value}${p.unit ? p.unit : ''}`).join(', ') || 'none'}`;
}
export async function sensors(_args) {
    const res = await fetch(`${BASE}/sensors`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`enviroCar returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No sensors returned.';
    return `enviroCar sensors (${d.length}):\n` + d.map((s) => `* ${s.name ?? '?'} (${s.quantity ?? '?'}) [${s.unit ?? '?'}]`).join('\n');
}
function ecoNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return 'not reported';
    return Math.abs(value) >= 1000 ? value.toFixed(0) : value.toFixed(3);
}
function ecoWithUnit(value, unit) {
    const shown = ecoNumber(value);
    if (shown === 'not reported')
        return shown;
    return unit ? `${shown} ${unit}` : shown;
}
function ecoSortByMeasurements(rows) {
    return [...rows].sort((a, b) => (b.measurements ?? 0) - (a.measurements ?? 0));
}
export async function platformStatistics(args) {
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 8) || 8, 30));
    const res = await fetch(`${BASE}/statistics`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`enviroCar returned ${res.status}`);
    const d = (await res.json());
    const all = d.statistics ?? [];
    if (!all.length)
        return 'enviroCar returned no platform statistics.';
    const wanted = (args.phenomenon ?? '').trim().toLowerCase();
    const pool = wanted
        ? all.filter((row) => (row.phenomenon?.name ?? '').toLowerCase().includes(wanted))
        : all;
    if (!pool.length) {
        return `No platform statistic matched "${args.phenomenon}". ${all.length} phenomena are reported.`;
    }
    const ordered = ecoSortByMeasurements(pool);
    const shown = ordered.slice(0, limit);
    const widest = all.reduce((best, row) => ((row.measurements ?? 0) > (best.measurements ?? 0) ? row : best), all[0]);
    return [
        `enviroCar platform statistics (showing ${shown.length} of ${pool.length} phenomena, most measured first):`,
        ...shown.map((row) => {
            const unit = row.phenomenon?.unit;
            return (`      ${(row.phenomenon?.name ?? 'unknown').padEnd(26)} ` +
                `avg ${ecoWithUnit(row.avg, unit)} | ${row.measurements ?? 0} measurements | ` +
                `${row.tracks ?? 0} tracks | ${row.users ?? 0} users | ${row.sensors ?? 0} sensors`);
        }),
        `  Totals for the widest covered phenomenon (${widest?.phenomenon?.name ?? 'unknown'}): ` +
            `${widest?.measurements ?? 0} measurements from ${widest?.tracks ?? 0} tracks.`,
        '  Note: these are unfiltered community submissions, so min and max include obvious sensor outliers.',
    ].join('\n');
}
