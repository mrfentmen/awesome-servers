const BASE = 'https://api.coinpaprika.com/v1';
export async function coin(args) {
    const id = (args.id ?? '').trim().toLowerCase();
    if (!id)
        return 'Provide a coin id like btc-bitcoin.';
    const res = await fetch(`${BASE}/coins/${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': 'mrfentmen-coinpaprika-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`CoinPaprika returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    return [
        `${s('name')} (${s('symbol')})`,
        s('description') ? `Desc: ${s('description').slice(0, 140)}` : '',
        s('rank') ? `Rank: ${s('rank')}` : '',
        s('type') ? `Type: ${s('type')}` : '',
        s('website_url') ? `Site: ${s('website_url')}` : '',
    ].filter(Boolean).join('\n') || `No data for ${id}.`;
}
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ q, limit: String(limit) });
    const res = await fetch(`${BASE}/search?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-coinpaprika-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`CoinPaprika returned ${res.status}`);
    const d = (await res.json());
    const rows = (d.currencies ?? []).slice(0, limit);
    if (!rows.length)
        return `No coins found for "${q}".`;
    return `Coins for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('name')} (${s('symbol')})${s('rank') ? ` | rank ${s('rank')}` : ''}`;
        })
            .join('\n');
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-coinpaprika-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`CoinPaprika returned ${res.status}`);
    return res.json();
}
function quoteRow(r) {
    const q = r.quotes?.USD ?? {};
    const s = (k) => (q[k] != null ? String(q[k]) : '?');
    return `${String(r.name ?? '?')} (${String(r.symbol ?? '?')}) $${s('price')} 24h ${s('percent_change_24h')}%`;
}
export async function ticker(args) {
    const id = (args.id ?? '').trim().toLowerCase();
    if (!id)
        return 'Provide a coin id like btc-bitcoin.';
    const d = (await getJson(`/tickers/${encodeURIComponent(id)}?quotes=USD`));
    return quoteRow(d);
}
export async function tickers(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const d = (await getJson(`/tickers?quotes=USD`));
    return `Top tickers:\n` + d.slice(0, limit).map((r, i) => `${i + 1}. ${quoteRow(r)}`).join('\n');
}
export async function markets(args) {
    const id = (args.id ?? '').trim().toLowerCase();
    if (!id)
        return 'Provide a coin id like btc-bitcoin.';
    const d = (await getJson(`/coins/${encodeURIComponent(id)}/markets?quotes=USD`));
    if (!d.length)
        return `No markets for ${id}.`;
    return `Markets for ${id}:\n` + d.slice(0, 15).map((m, i) => {
        const q = m.quotes?.USD ?? {};
        return `${i + 1}. ${String(m.exchange_name ?? '?')} ${String(m.pair ?? '?')} $${q.price != null ? String(q.price) : '?'} vol $${q.volume_24h != null ? String(q.volume_24h) : '?'}`;
    }).join('\n');
}
export async function ohlcvToday(args) {
    const id = (args.id ?? '').trim().toLowerCase();
    if (!id)
        return 'Provide a coin id like btc-bitcoin.';
    const d = (await getJson(`/coins/${encodeURIComponent(id)}/ohlcv/today?quotes=USD`));
    const r = d[0];
    if (!r)
        return `No OHLCV for ${id}.`;
    return `${id} today: open $${r.open ?? '?'} high $${r.high ?? '?'} low $${r.low ?? '?'} close $${r.close ?? '?'} vol $${r.volume ?? '?'}`;
}
export async function exchanges(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const d = (await getJson(`/exchanges`));
    return `Exchanges:\n` + d.slice(0, limit).map((e, i) => `${i + 1}. ${String(e.name ?? '?')} (${String(e.id ?? '?')})`).join('\n');
}
export async function exchangeMarkets(args) {
    const id = (args.id ?? '').trim().toLowerCase();
    if (!id)
        return 'Provide an exchange id like binance.';
    const d = (await getJson(`/exchanges/${encodeURIComponent(id)}/markets?quotes=USD`));
    if (!d.length)
        return `No markets for ${id}.`;
    return `Top markets on ${id}:\n` + d.slice(0, 15).map((m, i) => `${i + 1}. ${String(m.pair ?? '?')} $${String(m.quotes?.USD?.price ?? '?')}`).join('\n');
}
export async function tags(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const d = (await getJson(`/tags?additional_fields=coins`));
    return `Tags:\n` + d.slice(0, limit).map((t, i) => `${i + 1}. ${String(t.name ?? '?')} (${String(t.coin_counter ?? '?')} coins)`).join('\n');
}
export async function globalStats() {
    const d = (await getJson(`/global`));
    return `Global: mcap $${d.market_cap_usd ?? '?'} 24h vol $${d.volume_24h_usd ?? '?'} BTC dominance ${d.bitcoin_dominance_percentage ?? '?'}% cryptocurrencies ${d.cryptocurrencies_number ?? '?'}`;
}
