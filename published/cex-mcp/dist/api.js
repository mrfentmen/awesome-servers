const UA = 'mrfentmen-cex-mcp/1.0';
export async function ticker(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like BTC/USD.';
    const [c1, c2] = pair.split('/');
    if (!c1 || !c2)
        return 'Pair format: BTC/USD.';
    const res = await fetch(`https://cex.io/api/ticker/${encodeURIComponent(c1)}/${encodeURIComponent(c2)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`CEX.IO returned ${res.status}`);
    const d = (await res.json());
    if (d.error)
        throw new Error(`CEX.IO: ${String(d.error)}`);
    const get = (k) => d[k] ?? '?';
    return [
        `CEX.IO ${c1}/${c2}:`,
        `Last: ${get('last')} | Bid: ${get('bid')} | Ask: ${get('ask')}`,
        `High: ${get('high')} | Low: ${get('low')} | Volume: ${get('volume')} ${c1}`,
    ].filter(Boolean).join('\n');
}
function cexPair(pair, fallback = 'BTC/USD') {
    const raw = (pair ?? fallback).trim().toUpperCase();
    const parts = raw.split('/');
    const c1 = parts[0];
    const c2 = parts[1];
    if (!c1 || !c2)
        throw new Error('Pair format: BTC/USD.');
    return [c1, c2];
}
async function cexGet(path) {
    const res = await fetch(`https://cex.io/api/${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`CEX.IO returned ${res.status}`);
    return (await res.json());
}
export async function cexTradingLimits(args) {
    const d = await cexGet('currency_limits');
    const pairs = d.data?.pairs ?? [];
    if (!pairs.length)
        return 'CEX.IO returned no trading limits.';
    if (args.pair && args.pair.trim()) {
        const [c1, c2] = cexPair(args.pair);
        const hit = pairs.find((p) => p.symbol1 === c1 && p.symbol2 === c2);
        if (!hit) {
            return `CEX.IO lists no ${c1}/${c2} market. It currently lists ${pairs.length} pairs.`;
        }
        return [
            `CEX.IO trading limits for ${c1}/${c2}:`,
            `  Price precision : ${hit.pricePrecision ?? 'not reported'} decimal places`,
            `  Minimum order   : ${hit.minLotSize ?? 'not reported'} ${c1}`,
            `  Minimum value   : ${hit.minLotSizeS2 ?? 'not reported'} ${c2}`,
            `  Maximum order   : ${hit.maxLotSize ?? 'no maximum reported'}`,
            `  Allowed price   : ${hit.minPrice ?? 'not reported'} — ${hit.maxPrice ?? 'not reported'} ${c2}`,
        ].join('\n');
    }
    const sample = pairs
        .slice(0, 8)
        .map((p) => `      ${p.symbol1}/${p.symbol2} min ${p.minLotSize ?? '?'} ${p.symbol1}, precision ${p.pricePrecision ?? '?'}`);
    return [
        `CEX.IO lists ${pairs.length} tradable pairs. Pass a pair like BTC/USD for its exact limits.`,
        `  First 8:`,
        sample.join('\n'),
    ].join('\n');
}
