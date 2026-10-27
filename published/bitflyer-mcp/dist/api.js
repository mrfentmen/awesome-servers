const BASE = 'https://api.bitflyer.com/v1';
const UA = 'mrfentmen-bitflyer-mcp/1.0 (https://github.com/mrfentmen)';
export class BitflyerError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new BitflyerError(`BitFlyer returned ${res.status}`);
    return (await res.json());
}
export async function ticker(args) {
    const product = (args.product ?? 'BTC_JPY').toUpperCase();
    const d = await get(`${BASE}/ticker?product_code=${encodeURIComponent(product)}`);
    return [
        `${d.product_code ?? product}: ${d.ltp ?? '?'} JPY`,
        `Best bid: ${d.best_bid ?? '?'} (${d.best_bid_size ?? '?'}) | Best ask: ${d.best_ask ?? '?'} (${d.best_ask_size ?? '?'})`,
        `Volume: ${d.volume ?? '?'} | State: ${d.state ?? '?'}`,
        `Time: ${d.timestamp ?? '?'}`,
    ].join('\n');
}
export async function board(args) {
    const product = (args.product ?? 'BTC_JPY').toUpperCase();
    const depth = Math.max(1, Math.min(args.depth ?? 5, 20));
    const d = await get(`${BASE}/board?product_code=${encodeURIComponent(product)}`);
    const bids = (d.bids ?? []).slice(0, depth);
    const asks = (d.asks ?? []).slice(0, depth);
    const fmt = (side, rows) => rows.map((r) => `${side} ${r.price ?? '?'} @ ${r.size ?? '?'}`).join('\n');
    return `Order book ${product} (top ${depth}):\n${fmt('ASK', asks)}\n---\n${fmt('BID', bids)}`;
}
export async function markets(_args = {}) {
    const d = await get(`${BASE}/markets`);
    const rows = (d ?? []).filter((m) => m.market_type === 'Spot').slice(0, 30);
    return `BitFlyer spot markets (${rows.length} shown):\n${rows.map((m, i) => `${i + 1}. ${m.product_code ?? '?'}`).join('\n')}`;
}
// A rejected product answers HTTP 400 with a JSON body carrying error_message,
// which the existing helper drops, so the reason is read before throwing.
async function bfGet(path, missing) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new BitflyerError(missing);
    if (!res.ok) {
        const body = (await res.json().catch(() => null));
        throw new BitflyerError(`BitFlyer answered ${res.status}${body?.error_message ? `: ${body.error_message}` : ''}`);
    }
    return (await res.json());
}
function bfMid(ticker) {
    if (typeof ticker.best_bid !== 'number' || typeof ticker.best_ask !== 'number')
        return null;
    return (ticker.best_bid + ticker.best_ask) / 2;
}
function bfSpread(ticker) {
    const mid = bfMid(ticker);
    if (mid === null || typeof ticker.best_bid !== 'number' || typeof ticker.best_ask !== 'number')
        return null;
    const spread = ticker.best_ask - ticker.best_bid;
    return { spread, percent: mid === 0 ? 0 : (spread / mid) * 100 };
}
function bfNumber(value, digits = 2) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return 'not reported';
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
export async function marketSummary(_args = {}) {
    const markets = await bfGet('/getmarkets', 'BitFlyer returned no market list');
    const spot = (markets ?? []).filter((market) => market.market_type === 'Spot' && market.product_code);
    if (!spot.length)
        return 'BitFlyer listed no spot markets.';
    const rows = [];
    const paused = [];
    for (const market of spot) {
        const product = market.product_code;
        const ticker = await bfGet(`/ticker?product_code=${encodeURIComponent(product)}`, `no ticker for ${product}`);
        const spread = bfSpread(ticker);
        if (ticker.state !== 'RUNNING')
            paused.push(`${product} reports state ${ticker.state ?? 'unknown'}`);
        const imbalance = typeof ticker.total_bid_depth === 'number' && typeof ticker.total_ask_depth === 'number' && ticker.total_ask_depth > 0
            ? ticker.total_bid_depth / ticker.total_ask_depth
            : null;
        rows.push(`    ${product.padEnd(9)} last ${bfNumber(ticker.ltp, 4).padStart(14)}  ` +
            `spread ${spread ? `${bfNumber(spread.spread, 6)} (${spread.percent.toFixed(3)} percent)` : 'not reported'}  ` +
            `volume ${bfNumber(ticker.volume, 4)}  ` +
            `book depth bid/ask ${imbalance === null ? 'not reported' : imbalance.toFixed(3)}x`);
    }
    return [
        `BitFlyer spot market summary, ${spot.length} markets, each read from its own ticker snapshot:`,
        ...rows,
        '',
        '  The spread is the difference between the best bid and the best ask, in the quote currency of that market.',
        '  Book depth is total bid size divided by total ask size, so a value above one means more resting size on the bid side.',
        ...(paused.length ? ['', `  Not running normally: ${paused.join('; ')}.`] : ['', '  Every market reports state RUNNING.']),
        '  Prices are not converted between markets, so BTC_JPY and ETH_BTC figures are not comparable directly.',
    ].join('\n');
}
