const BASE = 'https://www.bankofcanada.ca/valet';
export async function rate(args) {
    const series = (args.series ?? '').trim().toUpperCase();
    if (!series)
        return 'Provide a series id like FXUSDCAD.';
    const res = await fetch(`${BASE}/observations/${encodeURIComponent(series)}/json?recent=1`, {
        headers: { 'User-Agent': 'mrfentmen-bankofcanada-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bank of Canada returned ${res.status}`);
    const d = (await res.json());
    const obs = (d.observations ?? []);
    const seriesMeta = (d.seriesDetail ?? {});
    const meta = seriesMeta[series] ?? {};
    if (!obs.length)
        return `No data for series ${series}.`;
    const last = obs.at(-1);
    const val = last[series]?.v;
    return [
        `${series}: ${String(meta.label ?? series)}`,
        `Latest (${String(last.d ?? '')}): ${String(val ?? 'n/a')}`,
    ].filter(Boolean).join('\n');
}
export async function list(_args) {
    const res = await fetch(`${BASE}/groups/FX_RATES_DAILY/json`, {
        headers: { 'User-Agent': 'mrfentmen-bankofcanada-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bank of Canada returned ${res.status}`);
    const d = (await res.json());
    const series = (d.seriesDetail ?? {});
    const keys = Object.keys(series);
    if (!keys.length)
        return 'No series returned.';
    return `Available FX series (${keys.length}):\n` +
        keys.slice(0, 20).map((k, i) => `${i + 1}. ${k} - ${String(series[k].label ?? '')}`).join('\n');
}
// ---- muxC tools:
class BocError extends Error {
}
