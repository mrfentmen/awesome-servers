const BASE = 'https://api.geckoterminal.com/api/v2';
const UA = 'mrfentmen-geckoterminal-mcp/1.0';
export async function token(args) {
    const network = (args?.network ?? 'eth').trim().toLowerCase();
    const address = (args.address ?? '').trim();
    if (!address)
        return 'Provide a token address.';
    const res = await fetch(`${BASE}/networks/${network}/tokens/${encodeURIComponent(address)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    const d = (await res.json());
    const a = d.data?.attributes ?? {};
    return [
        `GeckoTerminal token (${network}):`,
        `Name: ${a.name ?? '?'} (${a.symbol ?? '?'})`,
        `Address: ${a.address ?? address}`,
        a.decimals != null ? `Decimals: ${a.decimals}` : null,
        a.image_url ? `Image: ${a.image_url}` : null,
    ].filter(Boolean).join('\n');
}
export async function trending(args) {
    const network = (args?.network ?? 'eth').trim().toLowerCase();
    const res = await fetch(`${BASE}/networks/${network}/trending_pools?page=1`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    const d = (await res.json());
    const pools = d.data ?? [];
    if (!pools.length)
        return `No trending pools on ${network}.`;
    return `Trending pools on ${network} (${pools.length}):\n` +
        pools.slice(0, 12).map((p, i) => {
            const a = p.attributes ?? {};
            const vol = a.volume_usd?.h24 ? `vol $${Number(a.volume_usd.h24).toFixed(0)}` : '';
            return `${i + 1}. ${a.name ?? '?'} $${a.base_token_price_usd ?? '?'} ${vol}`.trim();
        }).join('\n');
}
function poolLine(p) {
    const a = p.attributes ?? {};
    const vol = a.volume_usd?.h24 ? `vol $${Number(a.volume_usd.h24).toFixed(0)}` : '';
    return `${a.name ?? p.id ?? '?'} $${a.base_token_price_usd ?? '?'} ${vol}`.trim();
}
export async function networks() {
    const res = await fetch(`${BASE}/networks?page=1`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    const d = (await res.json());
    const nets = d.data ?? [];
    if (!nets.length)
        return 'No networks returned.';
    return `GeckoTerminal tracks ${nets.length} networks (page 1). Sample: ` +
        nets.slice(0, 20).map((n) => `${n.id} (${n.attributes?.name ?? '?'})`).join(', ') + '. Full list omitted for size.';
}
export async function pool(args) {
    const network = (args?.network ?? 'eth').trim().toLowerCase();
    const raw = (args.pool ?? '').trim();
    if (!raw)
        return 'Provide a pool id like eth_0xa43fe16908251ee70ef74718545e4fe6c5ccec9f (see search).';
    const address = raw.includes('_') ? raw.split('_').slice(1).join('_') : raw;
    const res = await fetch(`${BASE}/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(address)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429)
        throw new Error('GeckoTerminal rate limit hit, wait and retry.');
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    const d = (await res.json());
    if (!d.data)
        return `No pool ${address} on ${network}.`;
    const a = d.data.attributes ?? {};
    return [
        `Pool ${a.name ?? d.data.id ?? address}:`,
        `Base price USD: ${a.base_token_price_usd ?? '?'} | Quote USD: ${a.quote_token_price_usd ?? '?'}`,
        `Reserve USD: ${a.reserve_in_usd ?? '?'} | Created: ${a.pool_created_at ?? '?'}`,
    ].join('\n');
}
export async function newPools(args) {
    const network = (args?.network ?? 'eth').trim().toLowerCase();
    const res = await fetch(`${BASE}/networks/${encodeURIComponent(network)}/new_pools?page=1`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429)
        throw new Error('GeckoTerminal rate limit hit, wait and retry.');
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    const d = (await res.json());
    const pools = d.data ?? [];
    if (!pools.length)
        return `No new pools on ${network}.`;
    return `New pools on ${network} (${pools.length}):\n` + pools.slice(0, 12).map((p, i) => `${i + 1}. ${poolLine(p)}`).join('\n');
}
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide a search query like pepe.';
    const network = (args?.network ?? '').trim().toLowerCase();
    const params = new URLSearchParams({ query });
    if (network)
        params.set('network', network);
    params.set('page', '1');
    const res = await fetch(`${BASE}/search/pools?${params.toString()}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429)
        throw new Error('GeckoTerminal rate limit hit, wait and retry.');
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    const d = (await res.json());
    const pools = d.data ?? [];
    if (!pools.length)
        return `No pools match ${query}.`;
    return `Pools matching ${query} (${pools.length}, use an id with the pool tool):\n` +
        pools.slice(0, 12).map((p, i) => `${i + 1}. ${p.id ?? '?'} — ${poolLine(p)}`).join('\n');
}
// ---- batch-4 tools: token pools, simple prices, DEX list (2026-09-27) ----
async function gtGet(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429)
        throw new Error("GeckoTerminal rate limit hit, wait and retry.");
    if (!res.ok)
        throw new Error(`GeckoTerminal returned ${res.status}`);
    return (await res.json());
}
const usd = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0)
        return "n/a";
    if (n >= 1e9)
        return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6)
        return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3)
        return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
};
/** Every pool a token trades in, biggest liquidity first, so a price can be checked against real depth. */
export async function tokenPools(args) {
    const network = (args.network ?? "eth").trim().toLowerCase();
    const address = (args.address ?? "").trim();
    if (!address)
        throw new Error("Provide a token address.");
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 20);
    const d = await gtGet(`/networks/${encodeURIComponent(network)}/tokens/${encodeURIComponent(address)}/pools?page=1`);
    const pools = d.data ?? [];
    if (!pools.length)
        return `No pools found for ${address} on ${network}.`;
    const ranked = [...pools].sort((a, b) => Number(b.attributes?.reserve_in_usd ?? 0) - Number(a.attributes?.reserve_in_usd ?? 0));
    const depth = ranked.reduce((sum, p) => sum + Number(p.attributes?.reserve_in_usd ?? 0), 0);
    return [
        `Pools for ${address} on ${network}: ${pools.length} returned, ${usd(depth)} total liquidity`,
        ...ranked.slice(0, limit).map((p, i) => {
            const a = p.attributes ?? {};
            const created = a.pool_created_at ? a.pool_created_at.slice(0, 10) : "?";
            return `${i + 1}. ${a.name ?? p.id ?? "?"} | price ${a.base_token_price_usd ?? "?"} | reserves ${usd(a.reserve_in_usd)} | 24h vol ${usd(a.volume_usd?.h24)} | since ${created}`;
        }),
        "",
        `Use the pool ids with the pool tool, e.g. ${pools[0]?.id ?? "eth_0x..."}.`,
    ].join("\n");
}
/** Batch USD prices for up to 30 token addresses on one network. */
export async function tokenPrices(args) {
    const network = (args.network ?? "eth").trim().toLowerCase();
    const list = (args.addresses ?? "").split(/[,\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 30);
    if (!list.length)
        throw new Error("Provide up to 30 token addresses, comma separated.");
    const d = await gtGet(`/simple/networks/${encodeURIComponent(network)}/token_price/${list.map(encodeURIComponent).join(",")}`);
    const prices = d.data?.attributes?.token_prices ?? {};
    const rows = list.map((address) => {
        const price = prices[address.toLowerCase()];
        return `${price === undefined ? "no price" : `$${Number(price).toLocaleString(undefined, { maximumFractionDigits: 8 })}`}  ${address}`;
    });
    return [
        `Spot prices on ${network} (${rows.length} address(es)):`,
        ...rows,
        "",
        "Prices come from the deepest pools GeckoTerminal tracks on that network.",
    ].join("\n");
}
/** Decentralised exchanges tracked on one network, with their pool counts. */
export async function dexes(args) {
    const network = (args.network ?? "eth").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(args.limit ?? 25) || 25, 1), 50);
    const d = await gtGet(`/networks/${encodeURIComponent(network)}/dexes?page=1`);
    const list = d.data ?? [];
    if (!list.length)
        return `GeckoTerminal lists no DEXes on ${network}.`;
    const ranked = [...list].sort((a, b) => Number(b.attributes?.pool_count ?? 0) - Number(a.attributes?.pool_count ?? 0));
    return [
        `DEXes on ${network}: ${list.length} tracked (page 1)`,
        ...ranked.slice(0, limit).map((x, i) => {
            const a = x.attributes ?? {};
            return `${i + 1}. ${a.name ?? a.identifier ?? x.id ?? "?"}${a.pool_count !== undefined ? ` | ${a.pool_count} pool(s)` : ""}`;
        }),
    ].join("\n");
}
// ---- muxG tools:
const OHLCV_TIMEFRAMES = ['minute', 'hour', 'day'];
// The free tier allows about 30 calls a minute, so a 429 is worth waiting out
// rather than handing the caller an error.
async function gtGetPatient(path) {
    let last;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt)
            await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
        try {
            return await gtGet(path);
        }
        catch (e) {
            last = e;
            if (!e.message.includes('rate limit'))
                throw e;
        }
    }
    throw last;
}
const num = (value, digits = 4) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : 'not reported';
};
/** Recent trades in a pool, with side, size in USD and the transaction, so flow can be read directly. */
export async function poolTrades(args) {
    const network = (args.network ?? 'eth').trim().toLowerCase();
    const pool = (args.pool ?? '').trim();
    if (!pool)
        throw new Error('Provide a pool address.');
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30);
    const d = await gtGetPatient(`/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(pool)}/trades?page=1`);
    const trades = d.data ?? [];
    if (!trades.length)
        throw new Error(`GeckoTerminal returned no trades for ${network} pool ${pool}.`);
    const volume = trades.reduce((sum, t) => sum + (Number(t.attributes?.volume_in_usd) || 0), 0);
    const buys = trades.filter((t) => t.attributes?.kind === 'buy').length;
    const lines = [
        `Last ${trades.length} trade(s) in ${network} pool ${pool} — ${usd(volume)} of volume, ${buys} buy / ${trades.length - buys} sell`,
    ];
    for (const [i, trade] of trades.slice(0, limit).entries()) {
        const a = trade.attributes ?? {};
        const when = String(a.block_timestamp ?? 'not reported').replace('T', ' ').replace('Z', ' UTC');
        const side = (a.kind ?? '?').toUpperCase();
        lines.push(`  ${i + 1}. ${when} block ${a.block_number ?? '?'} ${side}`);
        lines.push(`     ${a.from_token_amount ?? '?'} of ${String(a.from_token_address ?? '?').slice(0, 10)}... → ${a.to_token_amount ?? '?'} of ${String(a.to_token_address ?? '?').slice(0, 10)}...`);
        lines.push(`     ${usd(a.volume_in_usd)} · tx ${String(a.tx_hash ?? 'not reported').slice(0, 18)}...`);
    }
    if (trades.length > limit)
        lines.push(`  ...and ${trades.length - limit} more trade(s) on this page.`);
    return lines.join('\n');
}
/** OHLCV candles for a pool, so a price move can be read as bars instead of a single quote. */
export async function poolOhlc(args) {
    const network = (args.network ?? 'eth').trim().toLowerCase();
    const pool = (args.pool ?? '').trim();
    if (!pool)
        throw new Error('Provide a pool address.');
    const timeframe = (args.timeframe ?? 'hour').trim().toLowerCase();
    if (!OHLCV_TIMEFRAMES.includes(timeframe)) {
        throw new Error(`Timeframe must be one of ${OHLCV_TIMEFRAMES.join(', ')}.`);
    }
    const limit = Math.min(Math.max(Number(args.limit ?? 12) || 12, 1), 1000);
    const aggregate = timeframe === 'minute' ? 5 : timeframe === 'hour' ? 1 : 1;
    const d = await gtGetPatient(`/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(pool)}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}`);
    const candles = d.data?.attributes?.ohlcv_list ?? [];
    if (!candles.length)
        throw new Error(`GeckoTerminal returned no ${timeframe} candles for ${network} pool ${pool}.`);
    const rows = candles.slice(-limit);
    const highs = rows.map((c) => c[2]);
    const lows = rows.map((c) => c[3]);
    const last = rows[rows.length - 1];
    const first = rows[0];
    const change = first[4] !== 0 ? ((last[4] - first[4]) / first[4]) * 100 : Number.NaN;
    const lines = [
        `${rows.length} ${timeframe}ly candle(s) for ${network} pool ${pool} (aggregate ${aggregate})`,
        `Last close ${num(last[4])} · change over the window ${Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'not reported'}`,
        `High ${num(Math.max(...highs))} · low ${num(Math.min(...lows))}`,
        '',
    ];
    for (const [ts, open, high, low, close, volume] of rows) {
        const when = new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 16);
        lines.push(`  ${when} UTC  O ${num(open)}  H ${num(high)}  L ${num(low)}  C ${num(close)}  vol ${usd(volume)}`);
    }
    return lines.join('\n');
}
