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

const BOC = 'https://www.bankofcanada.ca/valet/observations';
export async function rateRange(args = {}) {
    const series = String(args?.series ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(series))
        throw new Error('Series code looks like FXUSDCAD.');
    const start = String(args?.start ?? '').trim();
    const end = String(args?.end ?? '').trim();
    for (const [label, value] of [['start', start], ['end', end]]) {
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))
            throw new Error(`Give ${label} as YYYY-MM-DD.`);
    }
    if (start > end)
        throw new Error('start must come before end.');
    const limit = Math.min(Math.max(Number(args?.limit ?? 30) || 30, 1), 400);
    const qs = new URLSearchParams({ start_date: start, end_date: end });
    const url = `${BOC}/${encodeURIComponent(series)}/json?${qs}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-bankofcanada-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`The Bank of Canada has no series ${series}`);
    if (!res.ok)
        throw new Error(`Bank of Canada returned ${res.status}`);
    const body = (await res.json());
    const rows = (body.observations ?? [])
        .map((o) => ({ d: o.d, v: Number(o[series]?.v) }))
        .filter((o) => Number.isFinite(o.v));
    if (!rows.length)
        throw new Error(`No observations for ${series} between ${start} and ${end}`);
    const values = rows.map((r) => r.v);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const detail = body.seriesDetail?.[series] ?? {};
    const shown = rows.slice(-limit);
    return [
        `${series} — ${detail.label ?? 'Bank of Canada series'}`,
        `${rows.length} observation(s) from ${rows[0].d} to ${rows[rows.length - 1].d}`,
        `First ${rows[0].v} · last ${rows[rows.length - 1].v} · low ${low} · high ${high}`,
        '',
        ...shown.map((r) => `${r.d}: ${r.v}`),
    ].filter((l) => l !== '').join('\n');
}
