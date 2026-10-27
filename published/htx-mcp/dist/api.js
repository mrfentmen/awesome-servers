const UA = 'mrfentmen-htx-mcp/1.0';
const BASE = 'https://api.huobi.pro';
export async function ticker(args) {
    const symbol = String(args.symbol).trim().toLowerCase();
    if (!symbol)
        throw new Error('Provide a symbol like btcusdt.');
    const res = await fetch(`${BASE}/market/detail/merged?symbol=${encodeURIComponent(symbol)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`HTX returned ${res.status}`);
    const d = (await res.json());
    if (d.status !== 'ok' || !d.tick)
        throw new Error(`No ticker for ${symbol}.`);
    const t = d.tick;
    const change = t.open ? t.close != null ? ((t.close - t.open) / t.open) * 100 : null : null;
    return `HTX ${symbol.toUpperCase()}:\nLast: ${t.close ?? '?'}${change != null ? ` (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)` : ''}\nOpen: ${t.open ?? '?'} | High: ${t.high ?? '?'} | Low: ${t.low ?? '?'}\nBid: ${t.bid ?? '?'} | Ask: ${t.ask ?? '?'}\nVolume: ${t.vol ?? '?'} | Turnover: ${t.amount ?? '?'} | Trades: ${t.count ?? '?'}`;
}
export async function depth(args) {
    const symbol = String(args.symbol).trim().toLowerCase();
    const depth = Math.min(Math.max(Number(args?.depth ?? 5) || 5, 1), 20);
    const res = await fetch(`${BASE}/market/depth?symbol=${encodeURIComponent(symbol)}&type=step0&depth=${depth}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`HTX returned ${res.status}`);
    const d = (await res.json());
    const bids = d.tick?.bids ?? [], asks = d.tick?.asks ?? [];
    if (d.status !== 'ok')
        throw new Error(`No depth for ${symbol}.`);
    return `HTX ${symbol.toUpperCase()} order book (top ${depth}):\nBids:\n` + bids.slice(0, depth).map(([p, s]) => `  ${p} @ ${s}`).join('\n') + `\nAsks:\n` + asks.slice(0, depth).map(([p, s]) => `  ${p} @ ${s}`).join('\n');
}
// ---- muxB tools:
const TRADE = `${BASE}/market/trade`;
function symbolOf(value) {
    const symbol = String(value ?? '').trim().toLowerCase();
    if (!symbol)
        throw new Error('Provide a symbol like btcusdt.');
    return symbol;
}
export async function recentTrades(args) {
    const symbol = symbolOf(args.symbol);
    const limit = Math.max(1, Math.min(Number(args.limit ?? 10) || 10, 50));
    const res = await fetch(`${TRADE}?symbol=${encodeURIComponent(symbol)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`HTX returned ${res.status}`);
    const d = (await res.json());
    if (d.status !== 'ok')
        throw new Error(`No trades for ${symbol}.`);
    const rows = (d.tick?.data ?? []).slice(0, limit);
    if (!rows.length)
        return `HTX ${symbol.toUpperCase()}: no trades reported.`;
    return `HTX ${symbol.toUpperCase()} recent trades (${rows.length} shown, newest first):\n` +
        rows
            .map((t, i) => `${i + 1}. ${t.direction ?? '?'} ${t.amount ?? '?'} @ ${t.price ?? '?'} | ${t.ts ? new Date(t.ts).toISOString().replace('T', ' ').slice(0, 19) : 'time not reported'}`)
            .join('\n');
}
