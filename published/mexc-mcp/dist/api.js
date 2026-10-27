const BASE = 'https://api.mexc.com/api/v3';
export async function ticker(args) {
    const symbol = (args.symbol ?? '').trim().toUpperCase();
    if (!symbol)
        return 'Provide a trading pair like BTCUSDT.';
    const res = await fetch(`${BASE}/ticker/price?symbol=${encodeURIComponent(symbol)}`, {
        headers: { 'User-Agent': 'mrfentmen-mexc-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MEXC returned ${res.status}`);
    const data = (await res.json());
    if (!data.price)
        return `No price found for ${symbol}.`;
    return `${data.symbol ?? symbol} price on MEXC: ${data.price}`;
}
// ---- muxB tools:
const MEXC_INTERVALS = {
    '5m': '5 minutes',
    '15m': '15 minutes',
    '1h': '1 hour',
    '4h': '4 hours',
    '1d': '1 day',
    '1w': '1 week',
    '1M': '1 month',
};
const mexcGet = async (path) => {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-mexc-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 429)
        throw new Error('MEXC rate limit hit, wait and retry');
    if (!res.ok)
        throw new Error(`MEXC returned ${res.status}`);
    return (await res.json());
};
const mexcNum = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 8 }) : 'not reported';
};
const mexcSym = (args) => {
    const s = (args.symbol ?? '').trim().toUpperCase();
    if (!s)
        throw new Error('Provide a trading pair like BTCUSDT.');
    return s;
};
export async function orderBook(args) {
    const symbol = mexcSym(args);
    const limit = Math.max(1, Math.min(Number(args.limit ?? 5) || 5, 100));
    const d = await mexcGet(`/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    const bids = Array.isArray(d?.bids) ? d.bids : [];
    const asks = Array.isArray(d?.asks) ? d.asks : [];
    if (!bids.length && !asks.length)
        return `No order book returned for ${symbol}.`;
    const stamp = d?.timestamp ? new Date(Number(d.timestamp)).toISOString().slice(0, 19).replace('T', ' ') + ' UTC' : 'not reported';
    const side = (label, rows) => rows.length ? `   ${label}:\n${rows.slice(0, limit).map((r, i) => `      ${i + 1}. ${mexcNum(r[0])} x ${mexcNum(r[1])}`).join('\n')}` : `   ${label}: none returned`;
    return [`${symbol} order book (${stamp}, update id ${d?.lastUpdateId ?? 'not reported'}):`, side('bids', bids), side('asks', asks)].join('\n');
}
