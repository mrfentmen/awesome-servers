const UA = 'mrfentmen-crypto-com-mcp/1.0';
export async function ticker(args) {
    const symbol = (args.symbol ?? '').trim().toUpperCase();
    if (!symbol)
        return 'Provide a symbol like BTC_USDT.';
    const res = await fetch(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${encodeURIComponent(symbol)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Crypto.com returned ${res.status}`);
    const d = (await res.json());
    const rows = d.result?.data ?? [];
    const t = rows.find((r) => r.i === symbol);
    if (!t)
        throw new Error(`Crypto.com: no ticker for ${symbol}`);
    return [
        `Crypto.com ${t.i ?? symbol}:`,
        `Last: ${t.a ?? '?'} | Bid: ${t.b ?? '?'} | Ask: ${t.c ?? '?'}`,
        `High: ${t.h ?? '?'} | Low: ${t.l ?? '?'} | Volume: ${t.v ?? '?'}`,
    ].filter(Boolean).join('\n');
}
export async function orderBook(args) {
    const symbol = (args.symbol ?? '').trim().toUpperCase();
    if (!symbol)
        return 'Provide a symbol like BTC_USDT.';
    const depth = Math.max(1, Math.min(Math.trunc(args.depth ?? 10), 50));
    const res = await fetch(`https://api.crypto.com/v2/public/get-book?instrument_name=${encodeURIComponent(symbol)}&depth=${depth}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Crypto.com returned ${res.status}`);
    const d = (await res.json());
    if (d.code !== 0)
        throw new Error(`Crypto.com: ${d.msg ?? `code ${d.code}`}`);
    const book = (d.result?.data ?? [])[0];
    if (!book)
        throw new Error(`Crypto.com: no order book for ${symbol}`);
    const level = ([price, qty], i) => `  ${i + 1}. ${price ?? 'not reported'} x ${qty ?? 'not reported'}`;
    const bids = (book.bids ?? []).slice(0, depth).map(level);
    const asks = (book.asks ?? []).slice(0, depth).map(level);
    return [
        `Crypto.com ${symbol} order book, ${depth} level(s) per side:`,
        'Bids (highest first):',
        ...(bids.length ? bids : ['  none reported']),
        'Asks (lowest first):',
        ...(asks.length ? asks : ['  none reported']),
    ].join('\n');
}
// ---- up1 tools:
const V1 = 'https://api.crypto.com/exchange/v1/public';
export async function instruments(args) {
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 25), 100));
    const query = (args.query ?? '').trim().toUpperCase();
    const res = await fetch(`${V1}/get-instruments`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Crypto.com returned ${res.status}`);
    const d = (await res.json());
    if (d.code !== 0)
        throw new Error(`Crypto.com: ${d.message ?? `code ${d.code}`}`);
    const all = d.result?.data ?? [];
    if (!all.length)
        throw new Error('Crypto.com returned no instruments');
    const matches = query
        ? all.filter((r) => (r.symbol ?? '').toUpperCase().includes(query) || (r.base_ccy ?? '').toUpperCase() === query)
        : all;
    if (!matches.length)
        return `No Crypto.com instrument matches "${args.query ?? ''}" (${all.length} instruments returned).`;
    const rows = matches.slice(0, limit);
    const lines = rows.map((r, i) => `  ${i + 1}. ${r.symbol ?? '?'} - ${r.inst_type ?? 'not reported'} - ${r.base_ccy ?? '?'}/${r.quote_ccy ?? '?'} - tradable ${r.tradable === undefined ? 'not reported' : r.tradable}`);
    return [`Crypto.com instruments (${rows.length} shown of ${matches.length} matching ${all.length} total):`, ...lines].join('\n');
}
