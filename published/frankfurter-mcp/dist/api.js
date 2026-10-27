const m0 = (() => {
    const BASE = 'https://api.frankfurter.app';
    async function latest(args) {
        const from = (args.from ?? 'USD').toUpperCase();
        const to = (args.to ?? '').toUpperCase();
        const url = `${BASE}/latest?from=${encodeURIComponent(from)}${to ? `&to=${encodeURIComponent(to)}` : ''}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'mrfentmen-frankfurter-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Frankfurter returned ${res.status}`);
        const d = (await res.json());
        const rates = (d.rates ?? {});
        if (!Object.keys(rates).length)
            return 'No rates returned.';
        return `Rates for ${String(d.base ?? from)} on ${String(d.date ?? '')}:\n` +
            Object.entries(rates).slice(0, 20).map(([k, v]) => `${k}: ${String(v)}`).join('\n');
    }
    async function history(args) {
        const from = (args.from ?? '').toUpperCase();
        const to = (args.to ?? '').toUpperCase();
        const start = (args.start ?? '').trim();
        const end = (args.end ?? '').trim();
        if (!from || !to || !start || !end)
            return 'Provide from, to, start, and end.';
        const res = await fetch(`${BASE}/${start}..${end}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
            headers: { 'User-Agent': 'mrfentmen-frankfurter-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Frankfurter returned ${res.status}`);
        const d = (await res.json());
        const rates = (d.rates ?? {});
        const dates = Object.keys(rates).sort();
        if (!dates.length)
            return 'No history returned.';
        const rows = dates.map((dt) => `${dt}: ${String(rates[dt][to] ?? 'n/a')}`);
        return `Rate history ${from} -> ${to} (${dates.length} days):\n` + rows.join('\n');
    }
    return { history, latest };
})();
const m1 = (() => {
    const BASE = 'https://api.frankfurter.app';
    async function latest(_args = {}) {
        const res = await fetch(`${BASE}/latest`, {
            headers: { 'User-Agent': 'mrfentmen-ecb-rates-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Frankfurter returned ${res.status}`);
        const data = (await res.json());
        const rates = data.rates ?? {};
        const entries = Object.entries(rates).slice(0, 30);
        if (!entries.length)
            throw new Error('Frankfurter returned no rates');
        return `ECB reference rates vs EUR (${data.date ?? ''}):\n` + entries.map(([code, rate], i) => `${i + 1}. ${code}: ${rate}`).join('\n');
    }
    async function convert(args) {
        const amount = Number(args.amount);
        if (!Number.isFinite(amount) || amount < 0)
            return 'Provide a positive amount.';
        const from = (args.from ?? 'EUR').toUpperCase();
        const to = (args.to ?? '').trim().toUpperCase();
        if (!to)
            return 'Provide a target currency code.';
        const res = await fetch(`${BASE}/latest?from=${from}&to=${to}`, {
            headers: { 'User-Agent': 'mrfentmen-ecb-rates-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Frankfurter returned ${res.status}`);
        const data = (await res.json());
        const rate = data.rates?.[to];
        if (typeof rate !== 'number')
            return `No rate found for ${from} to ${to}.`;
        const result = amount * rate;
        return `${amount.toLocaleString()} ${from} = ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to} (rate ${rate}, ${data.date ?? ''})`;
    }
    return { convert, latest };
})();
export const convert = m1.convert;
export const history = m0.history;
export const latest = m0.latest;
export const m0_latest = m0.latest;
export const m0_history = m0.history;
export const m1_latest = m1.latest;
export const m1_convert = m1.convert;
// ---- muxC tools:
