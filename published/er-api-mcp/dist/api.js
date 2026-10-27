const m0 = (() => {
    const UA = 'mrfentmen-er-api-mcp/1.0';
    const BASE = 'https://open.er-api.com/v6/latest';
    async function latest(args) {
        const base = String(args?.base ?? 'USD').toUpperCase();
        const res = await fetch(`${BASE}/${encodeURIComponent(base)}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`ER API returned ${res.status}`);
        const d = (await res.json());
        if (d.result !== 'success' || !d.rates)
            throw new Error(`ER API error: ${d.result ?? 'unknown'}`);
        const rates = d.rates;
        const top = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'INR', 'BRL'].filter((c) => rates[c] != null);
        return `Exchange rates base ${d.base_code ?? base} (updated ${d.time_last_update_utc ?? '?'}):\n` + top.map((c) => `* ${c}: ${rates[c]}`).join('\n');
    }
    async function convert(args) {
        const from = String(args.from).toUpperCase();
        const to = String(args.to).toUpperCase();
        const amount = Number(args.amount);
        if (!from || !to || !Number.isFinite(amount) || amount <= 0)
            throw new Error('Provide a valid from, to, and positive amount.');
        const res = await fetch(`${BASE}/${encodeURIComponent(from)}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`ER API returned ${res.status}`);
        const d = (await res.json());
        const rate = d.rates?.[to];
        if (rate == null)
            throw new Error(`No rate for ${to} (base ${from}).`);
        return `${amount} ${from} = ${(amount * rate).toFixed(2)} ${to} (rate ${rate})`;
    }
    return { convert, latest };
})();
const m1 = (() => {
    const BASE = 'https://open.er-api.com/v6';
    async function latest(args = {}) {
        const base = (args.base ?? 'USD').toUpperCase();
        const res = await fetch(`${BASE}/latest/${base}`, {
            headers: { 'User-Agent': 'mrfentmen-currency-history-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`ExchangeRate API returned ${res.status}`);
        const data = (await res.json());
        if (data.result !== 'success' || !data.rates)
            throw new Error('ExchangeRate API returned no rates');
        const entries = Object.entries(data.rates).slice(0, 30);
        return `Exchange rates vs ${data.base_code} (${data.time_last_update_utc ?? ''}):\n` + entries.map(([code, rate], i) => `${i + 1}. ${code}: ${rate}`).join('\n');
    }
    async function history(args = {}) {
        const base = (args.base ?? 'USD').toUpperCase();
        const res = await fetch(`${BASE}/latest/${base}`, {
            headers: { 'User-Agent': 'mrfentmen-currency-history-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`ExchangeRate API returned ${res.status}`);
        const data = (await res.json());
        if (data.result !== 'success' || !data.rates)
            throw new Error('ExchangeRate API returned no rates');
        const wanted = (args.symbols ?? '')
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
        const entries = wanted.length
            ? wanted.map((code) => [code, data.rates?.[code]]).filter(([, v]) => typeof v === 'number')
            : Object.entries(data.rates).slice(0, 15);
        if (!entries.length)
            return `No rates found for ${wanted.join(', ')}.`;
        return `Exchange rates vs ${data.base_code} (${data.time_last_update_utc ?? ''}):\n` + entries.map(([code, rate], i) => `${i + 1}. ${code}: ${rate}`).join('\n');
    }
    return { history, latest };
})();
export const convert = m0.convert;
export const history = m1.history;
export const latest = m0.latest;
export const m0_latest = m0.latest;
export const m0_convert = m0.convert;
export const m1_latest = m1.latest;
export const m1_history = m1.history;
// ---- muxC tools:

const ERAPI = 'https://open.er-api.com/v6/latest/USD';
export async function currencyList(args = {}) {
    const search = String(args?.search ?? '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(args?.limit ?? 50) || 50, 1), 200);
    const res = await fetch(ERAPI, {
        headers: { 'User-Agent': 'mrfentmen-er-api-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ExchangeRate API returned ${res.status}`);
    const body = (await res.json());
    if (body.result !== 'success' || !body.rates)
        throw new Error(`ExchangeRate API said: ${body['error-type'] ?? 'no rates'}`);
    let names = {};
    try {
        const nres = await fetch('https://api.frankfurter.app/currencies', {
            headers: { Accept: 'application/json', 'User-Agent': 'mrfentmen-er-api-mcp/1.0' },
            signal: AbortSignal.timeout(10000),
        });
        if (nres.ok)
            names = (await nres.json());
    }
    catch {
        names = {};
    }
    let rows = Object.entries(body.rates).map(([code, rate]) => ({
        code,
        name: String(names[code] ?? ''),
        rate: Number(rate),
    }));
    if (search)
        rows = rows.filter((r) => r.code.toLowerCase().includes(search) || r.name.toLowerCase().includes(search));
    if (!rows.length)
        throw new Error(`No currency matches "${args?.search}"`);
    rows.sort((a, b) => a.code.localeCompare(b.code));
    const shown = rows.slice(0, limit);
    return [
        `Currencies per USD — ${rows.length} match(es), showing ${shown.length}`,
        `Rates updated ${body.time_last_update_utc ?? 'unknown'}`,
        '',
        ...shown.map((r) => `${r.code}${r.name ? ` (${r.name})` : ''}: ${r.rate}`),
        names && Object.keys(names).length ? '' : undefined,
        names && Object.keys(names).length ? 'Names come from the ECB list; other codes show the code only.' : undefined,
    ].filter((l) => l !== undefined && l !== null).join('\n');
}
