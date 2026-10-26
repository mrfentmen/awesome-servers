const BASE = 'https://api.coinlore.net/api';
const UA = 'mrfentmen-coinlore-mcp/1.0 (https://github.com/mrfentmen)';
export class CoinloreError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new CoinloreError('CoinLore rate limit hit, wait and retry');
    if (!res.ok)
        throw new CoinloreError(`CoinLore error ${res.status}`);
    return (await res.json());
}
export async function tickers(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const d = await get(`${BASE}/tickers/?limit=${limit}`);
    const rows = d.data ?? [];
    if (!rows.length)
        return 'No coins returned.';
    return `Top coins (${rows.length} shown):\n` + rows.map((c, i) => {
        const s = (k) => (c[k] != null ? String(c[k]) : '?');
        return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')}\n   $${s('price_usd')} | 24h ${s('percent_change_24h')}% | mcap $${s('market_cap_usd')} | vol $${s('volume24a')} | supply ${s('csupply')}`;
    }).join('\n');
}
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
};
/** CoinLore has no search endpoint, so match symbol/name over the top 100 by market cap. */
export async function searchCoins(args) {
    const query = String(args.query ?? '').trim().toLowerCase();
    if (!query)
        throw new CoinloreError('Provide a coin name or symbol to search for');
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const d = await get(`${BASE}/tickers/?start=0&limit=100`);
    const rows = d.data ?? [];
    const hits = rows.filter((c) => `${String(c.name ?? '').toLowerCase()} ${String(c.symbol ?? '').toLowerCase()} ${String(c.nameid ?? '').toLowerCase()}`.includes(query));
    if (!hits.length)
        return `No coin in the top 100 matches "${args.query}". Try the exact symbol, e.g. 'ETH'.`;
    return `Coins matching "${args.query}" (${hits.length} of the top 100):\n` + hits.slice(0, limit).map((c, i) => {
        const s = (k) => (c[k] != null ? String(c[k]) : '?');
        return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')} | id ${s('id')}\n   $${s('price_usd')} | 24h ${s('percent_change_24h')}% | mcap $${s('market_cap_usd')}`;
    }).join('\n');
}
/** Biggest 24h movers among the top 100 coins by market cap. */
export async function movers(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
    const d = await get(`${BASE}/tickers/?start=0&limit=100`);
    const rows = (d.data ?? []).filter((c) => Number.isFinite(num(c.percent_change_24h)));
    if (!rows.length)
        return 'No 24h change data returned.';
    const sorted = [...rows].sort((a, b) => num(b.percent_change_24h) - num(a.percent_change_24h));
    const fmt = (c, i) => {
        const s = (k) => (c[k] != null ? String(c[k]) : '?');
        return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')} — ${num(c.percent_change_24h) >= 0 ? '+' : ''}${num(c.percent_change_24h).toFixed(2)}% at $${s('price_usd')}`;
    };
    const gainers = sorted.slice(0, limit);
    const losers = sorted.slice(-limit).reverse();
    return (`Top ${gainers.length} gainers (24h, of the top 100 coins):\n` + gainers.map(fmt).join('\n') +
        `\n\nTop ${losers.length} losers (24h, of the top 100 coins):\n` + losers.map(fmt).join('\n'));
}
export async function coin(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        throw new CoinloreError('Provide a coin id');
    const d = await get(`${BASE}/ticker/?id=${id}`);
    const c = d[0];
    if (!c)
        throw new CoinloreError('Coin not found');
    return [
        `${c.name ?? ''} (${c.symbol ?? ''}) #${c.rank ?? '?'}`,
        `Price: $${c.price_usd ?? '?'} | BTC ${c.price_btc ?? '?'}`,
        `24h change: ${c.percent_change_24h ?? '?'}% | 7d: ${c.percent_change_7d ?? '?'}%`,
        `Market cap: $${c.market_cap_usd ?? '?'}`,
        `Volume 24h: $${c.volume24 ?? '?'}`,
        `Supply: ${c.csupply ?? '?'} (total ${c.tsupply ?? '?'})`,
    ].join('\n');
}
export async function globalStats(_args = {}) {
    const d = await get(`${BASE}/global/`);
    const g = d[0] ?? {};
    return [
        `Coins: ${String(g.coins_count ?? '?')}`,
        `Active markets: ${String(g.active_markets ?? '?')}`,
        `Total market cap: $${String(g.total_mcap ?? '?')}`,
        `Total volume: $${String(g.total_volume ?? '?')}`,
        `BTC dominance: ${String(g.btc_d ?? '?')}%`,
        `ETH dominance: ${String(g.eth_d ?? '?')}%`,
        `24h mcap change: ${String(g.mcap_change ?? '?')}%`,
    ].join('\n');
}
export async function markets(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        throw new CoinloreError('Provide a coin id');
    const d = await get(`${BASE}/coin/markets/?id=${id}`);
    if (!d.length)
        return 'No markets returned.';
    // CoinLore's market `price_usd` is not the USD price of the coin, so quote the
    // local price together with its quote currency and use volume_usd for volume.
    return `Markets for coin ${id} (${d.length}):\n` + d.slice(0, 20).map((m, i) => {
        const quote = String(m.quote ?? '?');
        const price = Number(m.price);
        const volumeUsd = Number(m.volume_usd);
        return `${i + 1}. ${m.name ?? '?'} (${m.base ?? '?'}/${quote}): ` +
            `${Number.isFinite(price) ? price.toLocaleString() : '?'} ${quote} | ` +
            `vol 24h ${Number.isFinite(volumeUsd) ? `$${Math.round(volumeUsd).toLocaleString()}` : 'n/a'}`;
    }).join('\n');
}
// ---- batch-3 tools: extra live market data (2026-09-27) ----
export async function socialStats(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        throw new CoinloreError('Provide a coin id, e.g. 90 for Bitcoin');
    const d = await get(`${BASE}/coin/social_stats/?id=${id}`);
    const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : String(v));
    const lines = [];
    const show = (label, obj) => {
        if (!obj)
            return;
        const parts = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== 0).map(([k, v]) => `${k.replace(/_/g, ' ')} ${fmt(v)}`);
        if (parts.length)
            lines.push(`${label}: ${parts.join(' | ')}`);
    };
    show('Reddit', d.reddit);
    show('Twitter', d.twitter);
    show('Telegram', d.telegram);
    if (!lines.length)
        return `CoinLore has no social stats for coin id ${id} (null counters are skipped).`;
    return `CoinLore social stats for coin id ${id}:\n${lines.join('\n')}`;
}
export async function rankRange(args) {
    const start = Math.max(Math.floor(args.start ?? 0), 0);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 25), 1), 100);
    const d = await get(`${BASE}/tickers/?start=${start}&limit=${limit}`);
    const rows = d.data ?? [];
    if (!rows.length)
        return `CoinLore returned no coins from rank ${start + 1}.`;
    return `CoinLore ranks ${start + 1}-${start + rows.length}:\n` + rows.map((c) => {
        const s = (k) => (c[k] != null ? String(c[k]) : '?');
        return `#${s('rank')} ${s('name')} (${s('symbol')}) id ${s('id')} | $${s('price_usd')} | 24h ${s('percent_change_24h')}% | mcap $${s('market_cap_usd')}`;
    }).join('\n');
}
export async function volumeLeaders(args) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 25);
    const sample = Math.min(Math.max(Math.floor(args.sample ?? 100), 25), 200);
    const rows = [];
    for (const start of sample > 100 ? [0, 100] : [0]) {
        const d = await get(`${BASE}/tickers/?start=${start}&limit=100`);
        rows.push(...(d.data ?? []));
    }
    const ranked = rows.map((c) => ({ coin: c, volume: num(c.volume24a) })).filter((r) => Number.isFinite(r.volume) && r.volume > 0);
    if (!ranked.length)
        return 'CoinLore returned no 24h volume data.';
    ranked.sort((a, b) => b.volume - a.volume);
    const total = ranked.reduce((s, r) => s + r.volume, 0);
    const top = ranked.slice(0, limit);
    return `Top ${top.length} coins by 24h volume among the ${rows.length} largest by market cap (sample volume $${Math.round(total).toLocaleString()}):\n` +
        top.map((r, i) => {
            const s = (k) => (r.coin[k] != null ? String(r.coin[k]) : '?');
            return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')} | vol $${Math.round(r.volume).toLocaleString()} (${((r.volume / total) * 100).toFixed(1)}% of sample) | $${s('price_usd')} | 24h ${s('percent_change_24h')}%`;
        }).join('\n');
}
// ---- muxD tools:
const clUsd = (v, dp = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n))
        return 'n/a';
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: dp })}`;
};
/** Compact large USD figures so a market cap line stays readable. */
const clCompact = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n))
        return 'n/a';
    const abs = Math.abs(n);
    if (abs >= 1e12)
        return `$${(n / 1e12).toFixed(2)}T`;
    if (abs >= 1e9)
        return `$${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6)
        return `$${(n / 1e6).toFixed(2)}M`;
    return clUsd(n, 2);
};
const clCoin = (c) => `${String(c.name ?? '?')} (${String(c.symbol ?? '?')}) #${String(c.rank ?? '?')}`;
/**
 * How much of the coin is actually issued, what is still coming, and what the
 * fully diluted valuation implies against the cap that is circulating today.
 */
export async function supplyProfile(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        throw new CoinloreError('Provide a CoinLore coin id, e.g. 90 for Bitcoin.');
    const d = await get(`${BASE}/ticker/?id=${id}`);
    const c = Array.isArray(d) ? d[0] : null;
    if (!c)
        throw new CoinloreError(`CoinLore has no coin with id ${id}.`);
    const price = num(c.price_usd);
    const circ = num(c.csupply);
    const total = num(c.tsupply);
    const max = num(c.msupply);
    const mcap = num(c.market_cap_usd);
    const vol = num(c.volume24a);
    const ceiling = Number.isFinite(max) && max > 0 ? max : total;
    const basis = Number.isFinite(max) && max > 0 ? 'max' : 'total';
    const circPct = Number.isFinite(circ) && Number.isFinite(ceiling) && ceiling > 0 ? (circ / ceiling) * 100 : NaN;
    const overhang = Number.isFinite(circ) && Number.isFinite(ceiling) ? ceiling - circ : NaN;
    const overhangPct = Number.isFinite(overhang) && Number.isFinite(ceiling) && ceiling > 0 ? (overhang / ceiling) * 100 : NaN;
    const fdv = Number.isFinite(price) && Number.isFinite(ceiling) && ceiling > 0 ? price * ceiling : NaN;
    const dilution = Number.isFinite(fdv) && Number.isFinite(mcap) && mcap > 0 ? ((fdv - mcap) / mcap) * 100 : NaN;
    const turnover = Number.isFinite(vol) && Number.isFinite(mcap) && mcap > 0 ? (vol / mcap) * 100 : NaN;
    const lines = [
        `${c.name ?? '?'} (${c.symbol ?? '?'}) #${c.rank ?? '?'} — supply profile`,
        `Price ${clUsd(price, 6)}`,
        `Circulating ${Number.isFinite(circ) ? circ.toLocaleString() : 'n/a'}`,
        `Total issued ${Number.isFinite(total) ? total.toLocaleString() : 'n/a'}`,
        `Maximum supply ${Number.isFinite(max) && max > 0 ? max.toLocaleString() : 'not capped'}`,
        `Circulating against ${basis} supply: ${Number.isFinite(circPct) ? circPct.toFixed(2) + '% issued' : 'n/a'}` +
            (Number.isFinite(overhang) ? `, ${overhang.toLocaleString()} (${Number.isFinite(overhangPct) ? overhangPct.toFixed(2) + '%' : '?'}) still to come` : ''),
        `Market cap today: ${clCompact(mcap)}`,
        `Fully diluted at ${basis} supply: ${clCompact(fdv)}` +
            (Number.isFinite(dilution) ? ` — ${dilution >= 0 ? '+' : ''}${dilution.toFixed(1)}% against the circulating cap` : ''),
        `24h turnover: ${Number.isFinite(turnover) ? (turnover).toFixed(2) + '% of the cap changes hands per day' : 'n/a'}`,
    ];
    if (!Number.isFinite(max) || max <= 0)
        lines.push('CoinLore reports no maximum supply, so dilution is measured against the total issued, not a cap.');
    return lines.join('\n');
}
/**
 * How much of the whole market a handful of names hold: the observed shares in
 * the sample with a running total, set against the published dominance figures.
 */
export async function capConcentration(args = {}) {
    const sample = Math.min(Math.max(Math.floor(args.sample ?? 100), 10), 100);
    const top = Math.min(Math.max(Math.floor(args.top ?? 10), 1), 50);
    const d = await get(`${BASE}/tickers/?start=0&limit=${sample}`);
    const rows = (d.data ?? [])
        .map((c) => ({ c, cap: num(c.market_cap_usd) }))
        .filter((r) => Number.isFinite(r.cap) && r.cap > 0)
        .sort((a, b) => b.cap - a.cap);
    if (!rows.length)
        throw new CoinloreError(`CoinLore returned no market caps across the top ${sample} coins.`);
    const g = (await get(`${BASE}/global/`))?.[0] ?? {};
    const sampleCap = rows.reduce((s, r) => s + r.cap, 0);
    const shown = rows.slice(0, top);
    const topN = (n) => rows.slice(0, n).reduce((s, r) => s + r.cap, 0);
    const totalCap = num(g.total_mcap);
    const ath = num(g.mcap_ath);
    const fromAth = Number.isFinite(ath) && ath > 0 && Number.isFinite(totalCap) ? ((totalCap - ath) / ath) * 100 : NaN;
    let running = 0;
    const lines = [
        `Market concentration across the ${rows.length} largest coins CoinLore prices:`,
        `Sample market cap ${clCompact(sampleCap)}`,
        `BTC dominance ${Number.isFinite(num(g.btc_d)) ? num(g.btc_d).toFixed(2) + '%' : 'n/a'} | ` +
            `ETH dominance ${Number.isFinite(num(g.eth_d)) ? num(g.eth_d).toFixed(2) + '%' : 'n/a'}`,
        Number.isFinite(totalCap) ? `Whole market ${clCompact(totalCap)}` +
            (Number.isFinite(fromAth) ? ` — ${fromAth >= 0 ? '+' : ''}${fromAth.toFixed(1)}% against its all-time high of ${clCompact(ath)}` : '') : '',
        `Top 1 holds ${((topN(1) / sampleCap) * 100).toFixed(1)}% of the sample | ` +
            `top 3 ${((topN(3) / sampleCap) * 100).toFixed(1)}% | ` +
            `top 10 ${((topN(Math.min(10, rows.length)) / sampleCap) * 100).toFixed(1)}%`,
        '',
        `${'#'.padStart(3)}  ${'coin'.padEnd(26)}${'cap'.padStart(14)}${'share'.padStart(9)}${'cumulative'.padStart(12)}`,
        ...shown.map((r, i) => {
            const share = (r.cap / sampleCap) * 100;
            running += share;
            return `${String(i + 1).padStart(3)}  ${clCoin(r.c).slice(0, 26).padEnd(26)}${clCompact(r.cap).padStart(14)}${(share.toFixed(1) + '%').padStart(9)}${(running.toFixed(1) + '%').padStart(12)}`;
        }),
    ].filter((l) => l !== '');
    if (rows.length > shown.length)
        lines.push('', `(${rows.length - shown.length} more coin(s) in the sample are not listed; raise top to see them.)`);
    return lines.join('\n');
}
/**
 * Sorts the large caps by short-term against longer-term move, so a genuine
 * trend stands apart from a coin that is simply bouncing after a drop.
 */
export async function momentumGrid(args = {}) {
    const sample = Math.min(Math.max(Math.floor(args.sample ?? 100), 10), 100);
    const perBucket = Math.min(Math.max(Math.floor(args.limit ?? 6), 1), 20);
    const d = await get(`${BASE}/tickers/?start=0&limit=${sample}`);
    const rows = d.data ?? [];
    const scored = rows
        .map((c) => ({ c, h1: num(c.percent_change_1h), h24: num(c.percent_change_24h), d7: num(c.percent_change_7d), cap: num(c.market_cap_usd) }))
        .filter((x) => Number.isFinite(x.h1) && Number.isFinite(x.h24) && Number.isFinite(x.d7));
    if (!scored.length)
        return `CoinLore returned no 1h, 24h and 7d change data across the top ${sample} coins.`;
    const quad = (x) => {
        const short = x.h24 >= 0;
        const long = x.d7 >= 0;
        if (short && long)
            return x.h1 >= 0 ? 'trending up' : 'pullback inside an uptrend';
        if (short && !long)
            return x.h1 >= 0 ? 'bounce inside a downtrend' : 'falling, and still sliding';
        if (!short && long)
            return x.h1 >= 0 ? 'dipping inside an uptrend' : 'up over the week but selling today';
        return x.h1 >= 0 ? 'bouncing while still down' : 'down on every horizon';
    };
    const buckets = new Map();
    for (const x of scored) {
        const key = quad(x);
        const list = buckets.get(key) ?? [];
        list.push(x);
        buckets.set(key, list);
    }
    const order = [
        'trending up', 'up over the week but selling today', 'dipping inside an uptrend',
        'pullback inside an uptrend', 'bounce inside a downtrend', 'bouncing while still down',
        'down on every horizon', 'falling, and still sliding',
    ];
    const lines = [
        `Momentum grid across the top ${scored.length} coins CoinLore prices with 1h, 24h and 7d changes`,
        'Each coin is placed by whether 24h and 7d agree, with the 1h move deciding trend against pullback.',
        '',
    ];
    for (const key of order) {
        const list = buckets.get(key);
        if (!list?.length)
            continue;
        list.sort((a, b) => b.cap - a.cap);
        lines.push(`${key} (${list.length})`);
        for (const x of list.slice(0, perBucket)) {
            lines.push(`  ${clCoin(x.c).padEnd(26)} 1h ${x.h1 >= 0 ? '+' : ''}${x.h1.toFixed(2)}%  24h ${x.h24 >= 0 ? '+' : ''}${x.h24.toFixed(2)}%  7d ${x.d7 >= 0 ? '+' : ''}${x.d7.toFixed(2)}%  cap ${clCompact(x.cap)}`);
        }
        if (list.length > perBucket)
            lines.push(`  ...and ${list.length - perBucket} more`);
        lines.push('');
    }
    return lines.join('\n').trimEnd();
}
