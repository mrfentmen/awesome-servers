const BASE = 'https://api.coinbase.com/v2';
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Coinbase returned ${res.status}`);
    return (await res.json());
}
export async function spot(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like BTC-USD.';
    const res = await fetch(`${BASE}/prices/${encodeURIComponent(pair)}/spot`, {
        headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Coinbase returned ${res.status}`);
    const d = (await res.json());
    const data = d.data ?? {};
    return `Coinbase ${data.base ?? pair}/${data.currency ?? 'USD'}: ${data.amount ?? 'n/a'}`;
}
export async function exchange(args) {
    const currency = (args?.currency ?? 'USD').trim().toUpperCase();
    const res = await fetch(`${BASE}/exchange-rates?currency=${encodeURIComponent(currency)}`, {
        headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Coinbase returned ${res.status}`);
    const d = (await res.json());
    const data = d.data ?? {};
    const rates = data.rates ?? {};
    const keys = Object.keys(rates);
    if (!keys.length)
        return 'No rates returned.';
    return `Coinbase exchange rates from ${data.currency ?? currency} (${keys.length} currencies):\n` +
        keys.slice(0, 40).map((k) => `  ${k}: ${rates[k]}`).join('\n');
}
export async function buy(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like BTC-USD.';
    const d = await getJson(`/prices/${encodeURIComponent(pair)}/buy`);
    const data = d.data ?? {};
    return `Coinbase buy price ${data.base ?? pair}/${data.currency ?? 'USD'}: ${data.amount ?? 'n/a'}`;
}
export async function sell(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like BTC-USD.';
    const d = await getJson(`/prices/${encodeURIComponent(pair)}/sell`);
    const data = d.data ?? {};
    return `Coinbase sell price ${data.base ?? pair}/${data.currency ?? 'USD'}: ${data.amount ?? 'n/a'}`;
}
export async function currencies() {
    const d = await getJson('/currencies');
    const list = d.data ?? [];
    const fiats = list.filter((c) => c.id && c.id.length === 3).length;
    const sample = list.slice(0, 15).map((c) => `${c.id} (${c.name ?? '?'})`).join(', ');
    return `Coinbase supports ${list.length} currencies (${fiats} fiat codes). Sample: ${sample}. Full list omitted for size.`;
}
export async function time() {
    const d = await getJson('/time');
    return `Coinbase server time: ${d.data?.iso ?? 'n/a'} (epoch ${d.data?.epoch ?? 'n/a'})`;
}
// ---- batch-3 tools: extra live market data (2026-09-27) ----
const EX_BASE = 'https://api.exchange.coinbase.com';
async function exGet(path) {
    const res = await fetch(`${EX_BASE}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`Coinbase Exchange has no such product (404): ${path}`);
    if (!res.ok)
        throw new Error(`Coinbase Exchange returned ${res.status}`);
    return (await res.json());
}
export async function exchangeStats(args) {
    const pair = (args.pair ?? 'BTC-USD').trim().toUpperCase();
    const d = await exGet(`/products/${encodeURIComponent(pair)}/stats`);
    const high = Number(d.high);
    const low = Number(d.low);
    const range = Number.isFinite(high) && Number.isFinite(low) && low > 0 ? `${(((high - low) / low) * 100).toFixed(2)}%` : '?';
    const base = pair.split('-')[0] ?? pair;
    return [
        `Coinbase Exchange ${pair} 24h stats:`,
        `Last ${d.last ?? '?'} | open ${d.open ?? '?'} | high ${d.high ?? '?'} | low ${d.low ?? '?'}`,
        `24h range: ${range} | volume ${d.volume ?? '?'} ${base}`,
        `30-day volume: ${d.volume_30day ?? '?'}`,
    ].join('\n');
}
const GRANULARITIES = { 60: '1m', 300: '5m', 900: '15m', 3600: '1h', 21600: '6h', 86400: '1d' };
export async function candles(args) {
    const pair = (args.pair ?? 'BTC-USD').trim().toUpperCase();
    const granularity = Math.floor(args.granularity ?? 3600);
    const label = GRANULARITIES[granularity];
    if (!label)
        throw new Error(`Granularity must be one of ${Object.keys(GRANULARITIES).join(', ')} seconds`);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 50);
    const rows = await exGet(`/products/${encodeURIComponent(pair)}/candles?granularity=${granularity}`);
    if (!rows.length)
        return `No candles returned for ${pair} at ${label}.`;
    const sorted = rows.slice().sort((a, b) => a[0] - b[0]);
    const shown = sorted.slice(-limit);
    const first = sorted[0][4];
    const last = sorted[sorted.length - 1][4];
    const change = first > 0 ? `${(((last - first) / first) * 100).toFixed(2)}%` : '?';
    return [
        `Coinbase Exchange ${pair} ${label} candles (${sorted.length} returned, last ${shown.length} shown, period change ${change}):`,
        ...shown.map(([t, lo, hi, open, close, volume]) => `${new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ')} | O ${open} H ${hi} L ${lo} C ${close} | vol ${volume}`),
    ].join('\n');
}
export async function exchangeTicker(args) {
    const pair = (args.pair ?? 'BTC-USD').trim().toUpperCase();
    const d = await exGet(`/products/${encodeURIComponent(pair)}/ticker`);
    const bid = Number(d.bid);
    const ask = Number(d.ask);
    const mid = (bid + ask) / 2;
    const spread = Number.isFinite(bid) && Number.isFinite(ask) && mid > 0 ? `${(((ask - bid) / mid) * 100).toFixed(4)}%` : '?';
    return [
        `Coinbase Exchange ${pair} ticker:`,
        `Price ${d.price ?? '?'} (last size ${d.size ?? '?'}) | bid ${d.bid ?? '?'} / ask ${d.ask ?? '?'} | spread ${spread}`,
        `24h volume ${d.volume ?? '?'} | trade id ${d.trade_id ?? '?'} | ${d.time ?? '?'}`,
    ].join('\n');
}
export async function orderBook(args) {
    const pair = (args.pair ?? 'BTC-USD').trim().toUpperCase();
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 5), 1), 20);
    const d = await exGet(`/products/${encodeURIComponent(pair)}/book?level=2`);
    const fmt = (rows) => (rows ?? []).slice(0, limit).map((r) => `${r[0]} x ${r[1]}${r[2] !== undefined ? ` (${r[2]} orders)` : ''}`);
    const bestBid = Number(d.bids?.[0]?.[0]);
    const bestAsk = Number(d.asks?.[0]?.[0]);
    const mid = (bestBid + bestAsk) / 2;
    const spread = Number.isFinite(bestBid) && Number.isFinite(bestAsk) && mid > 0
        ? `${(bestAsk - bestBid).toFixed(8)} (${(((bestAsk - bestBid) / mid) * 100).toFixed(4)}%)`
        : '?';
    return [
        `Coinbase Exchange ${pair} order book, best bid ${d.bids?.[0]?.[0] ?? '?'} / ask ${d.asks?.[0]?.[0] ?? '?'}, spread ${spread}:`,
        `Bids (${d.bids?.length ?? 0} levels): ${fmt(d.bids).join(', ')}`,
        `Asks (${d.asks?.length ?? 0} levels): ${fmt(d.asks).join(', ')}`,
    ].join('\n');
}
export async function tradingProducts(args) {
    const quote = (args.quote ?? 'USD').trim().toUpperCase();
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 50);
    const all = await exGet('/products');
    const rows = all.filter((p) => (p.quote_currency ?? '').toUpperCase() === quote);
    if (!rows.length)
        throw new Error(`Coinbase Exchange lists no products quoted in ${quote}`);
    const online = rows.filter((p) => p.status !== 'offline' && p.trading_disabled !== true);
    const bases = new Set(online.map((p) => p.base_currency ?? '')).size;
    return [
        `Coinbase Exchange products quoted in ${quote}: ${rows.length} (${online.length} online, ${bases} base assets).`,
        `First ${Math.min(online.length, limit)}:`,
        ...online.slice(0, limit).map((p) => `  ${p.id ?? '?'} — ${p.display_name ?? p.base_currency ?? '?'}`),
    ].join('\n');
}
/**
 * Ranks every online product quoted in one currency by 24 hour volume from the
 * exchange stats endpoint, so it shows what is actually liquid rather than what
 * merely exists in the product list.
 */
export async function marketOverview(args) {
    const quote = (args.quote ?? 'USD').trim().toUpperCase();
    if (!quote)
        throw new Error('Provide a quote currency such as USD.');
    const minVolume = Math.max(Number(args.min_volume ?? 0) || 0, 0);
    const top = Math.min(Math.max(Math.floor(args.limit ?? 15), 1), 40);
    const all = await exGet('/products');
    const candidates = all.filter((p) => (p.quote_currency ?? '').toUpperCase() === quote
        && p.status !== 'offline' && p.trading_disabled !== true);
    if (!candidates.length)
        throw new Error(`Coinbase Exchange lists no online products quoted in ${quote}`);
    const rows = [];
    let failed = 0;
    // Sequential and polite: this walks the stats endpoint once per product.
    for (const p of candidates) {
        try {
            const s = await exGet(`/products/${encodeURIComponent(String(p.id))}/stats`);
            const volume = Number(s.volume ?? NaN);
            if (!Number.isFinite(volume)) {
                failed += 1;
                continue;
            }
            const high = Number(s.high ?? NaN);
            const low = Number(s.low ?? NaN);
            const last = Number(s.last ?? NaN);
            rows.push({
                id: String(p.id ?? ''),
                base: String(p.base_currency ?? ''),
                last,
                high,
                low,
                volume,
                range: Number.isFinite(high) && Number.isFinite(low) && low > 0 ? ((high - low) / low) * 100 : NaN,
                v30: Number(s.volume_30day ?? NaN),
                notional: Number.isFinite(last) ? volume * last : NaN,
            });
        }
        catch {
            failed += 1;
        }
    }
    if (!rows.length) {
        return `Coinbase Exchange listed ${candidates.length} online ${quote} product(s) but the stats endpoint returned usable numbers for none of them (${failed} failed).`;
    }
    const liquid = minVolume > 0 ? rows.filter((r) => r.notional >= minVolume) : rows;
    const busiest = rows.slice().sort((a, b) => (b.notional || 0) - (a.notional || 0))[0];
    if (!liquid.length) {
        return `None of the ${rows.length} online ${quote} product(s) reached a 24 hour notional of ${minVolume}. Busiest was ${busiest.id} at ${Number.isFinite(busiest.notional) ? busiest.notional.toFixed(2) : '?'} ${quote}.`;
    }
    const ranked = liquid.slice().sort((a, b) => (b.notional || 0) - (a.notional || 0));
    const totalNotional = ranked.reduce((s, r) => s + (Number.isFinite(r.notional) ? r.notional : 0), 0);
    const shown = ranked.slice(0, top);
    const width = Math.max(...shown.map((r) => r.id.length));
    const notionalLabel = `notional ${quote.toUpperCase()}`;
    const lines = [
        `${quote} market on Coinbase Exchange: ${rows.length} online product(s) priced, ${liquid.length} at or above a ${minVolume} ${quote} 24h notional`,
        `Combined 24h notional of the ${liquid.length} qualifying product(s): ${totalNotional.toFixed(2)} ${quote}`,
        '',
        'Coinbase reports volume in the base asset, so products are ranked here on notional',
        `(24h volume x last price) in ${quote}. Adding the raw volume column across pairs would`,
        'rank a token with a huge unit count above a coin with far more money behind it.',
        failed ? `${failed} product(s) returned no usable stats and were left out.` : '',
        '',
        `${"product".padEnd(width)}  ${notionalLabel.padStart(20)}  ${"share".padStart(6)}  last        24h range`,
        ...shown.map((r) => {
            const share = totalNotional > 0 && Number.isFinite(r.notional) ? (r.notional / totalNotional) * 100 : NaN;
            const range = Number.isFinite(r.range) ? `${r.range.toFixed(1)}%` : '?';
            const notional = Number.isFinite(r.notional) ? r.notional.toFixed(2).padStart(20) : '?'.padStart(20);
            return `${r.id.padEnd(width)}  ${notional}  ${(Number.isFinite(share) ? share.toFixed(1) : '?').padStart(5)}%  ${(Number.isFinite(r.last) ? r.last : '?').toString().slice(0, 10).padEnd(10)}  ${range}`;
        }),
    ].filter((l) => l !== '');
    if (ranked.length > shown.length)
        lines.push('', `...and ${ranked.length - shown.length} more above the floor; raise limit to see them.`);
    return lines.join('\n');
}
