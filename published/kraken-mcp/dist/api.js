const BASE = 'https://api.kraken.com/0/public';
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Kraken returned ${res.status}`);
    return (await res.json());
}
function check(d) {
    if (d.error?.length)
        throw new Error(`Kraken error: ${d.error.join('; ')}`);
    return (d.result ?? {});
}
const clamp = (value, fallback, max = 50) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
export async function ticker(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like XBTUSD.';
    const res = await fetch(`${BASE}/Ticker?pair=${encodeURIComponent(pair)}`, {
        headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Kraken returned ${res.status}`);
    const d = (await res.json());
    const result = d.result ?? {};
    const key = Object.keys(result)[0];
    if (!key)
        return `No ticker for ${pair}.`;
    const r = result[key];
    const a = (r.a ?? []);
    const c = (r.c ?? []);
    const v = (r.v ?? []);
    const h = (r.h ?? []);
    const l = (r.l ?? []);
    const num = (x) => (x != null ? Number(x) : NaN);
    return [
        `Kraken ${key}:`,
        `Last: ${String(c[0] ?? '')} | Ask: ${String(a[0] ?? '')}`,
        `24h: high ${String(h[1] ?? '')} low ${String(l[1] ?? '')}`,
        `24h volume: ${String(v[1] ?? '')}`,
        `Spread: ${num(c[0]) - num(a[0])}`,
    ].filter(Boolean).join('\n');
}
export async function assets(_args) {
    const res = await fetch(`${BASE}/Assets`, {
        headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Kraken returned ${res.status}`);
    const d = (await res.json());
    const result = d.result ?? {};
    const keys = Object.keys(result);
    if (!keys.length)
        return 'No assets returned.';
    return `Kraken assets (${keys.length}):\n` +
        keys.slice(0, 30).map((k, i) => {
            const a = result[k];
            const name = String((a.altname ?? a.asset ?? k));
            return `${i + 1}. ${name}`;
        }).join('\n');
}
export async function pairs() {
    const d = await getJson('/AssetPairs');
    const result = check(d);
    const keys = Object.keys(result);
    const sample = keys.slice(0, 15).map((k) => result[k].wsname ?? result[k].altname ?? k).join(', ');
    return `Kraken lists ${keys.length} pairs. Sample: ${sample}. Full list omitted for size.`;
}
export async function ohlc(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like XBTUSD.';
    const interval = clamp(args.interval, 1440, 10080);
    const d = await getJson(`/OHLC?pair=${encodeURIComponent(pair)}&interval=${interval}`);
    const result = check(d);
    const key = Object.keys(result)[0];
    if (!key)
        return `No candles for ${pair}.`;
    const candles = result[key].slice(-10).map((c) => {
        const t = new Date(Number(c[0]) * 1000).toISOString().slice(0, 10);
        return `${t} o:${c[1]} h:${c[2]} l:${c[3]} c:${c[4]} v:${c[6]}`;
    });
    return `Kraken ${key} daily candles (${interval}-min interval, last ${candles.length}):\n` + candles.join('\n');
}
export async function depth(args) {
    const pair = (args.pair ?? '').trim().toUpperCase();
    if (!pair)
        return 'Provide a pair like XBTUSD.';
    const count = clamp(args.count, 5, 25);
    const d = await getJson(`/Depth?pair=${encodeURIComponent(pair)}&count=${count}`);
    const result = check(d);
    const key = Object.keys(result)[0];
    if (!key)
        return `No book for ${pair}.`;
    const book = result[key];
    const fmt = (rows) => (rows ?? []).map((r) => `${r[0]} x ${r[1]}`).join(', ');
    return `Kraken ${key} top of book:\nAsks: ${fmt(book.asks)}\nBids: ${fmt(book.bids)}`;
}
export async function time() {
    const d = await getJson('/Time');
    const result = check(d);
    return `Kraken server time: ${result.rfc1123 ?? 'n/a'} (epoch ${result.unixtime ?? 'n/a'})`;
}
export async function status() {
    const d = await getJson('/SystemStatus');
    const result = check(d);
    return `Kraken status: ${result.status ?? 'n/a'} as of ${result.timestamp ?? 'n/a'}`;
}
// ---- batch-4 tools: trades, spread and pair details (2026-09-27) ----
function pairParam(pair) {
    const clean = String(pair ?? "").trim().toUpperCase();
    if (!clean)
        throw new Error("Provide a pair like XBTUSD.");
    return encodeURIComponent(clean);
}
function firstArray(result) {
    const key = Object.keys(result).find((k) => Array.isArray(result[k]) && result[k].length > 0);
    if (!key)
        return { key: "", rows: [] };
    return { key, rows: result[key] };
}
const utcClock = (seconds) => new Date(seconds * 1000).toISOString().slice(11, 19);
const money = (n) => `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 6 : 2 })}`;
export async function recentTrades(args) {
    const count = clamp(args?.count, 20, 100);
    const d = await getJson(`/Trades?pair=${pairParam(args?.pair)}&count=${count}`);
    const result = check(d);
    const { key, rows } = firstArray(result);
    if (!key || !rows.length)
        return `No trades returned for ${args?.pair}.`;
    const trades = rows.map((r) => ({
        price: Number(r[0]),
        volume: Number(r[1]),
        at: Number(r[2]),
        side: String(r[3]) === "b" ? "buy" : "sell",
        type: String(r[4]) === "m" ? "market" : "limit",
    })).filter((t) => Number.isFinite(t.price) && Number.isFinite(t.volume));
    if (!trades.length)
        return `Kraken returned no readable trades for ${key}.`;
    const buys = trades.filter((t) => t.side === "buy");
    const sells = trades.filter((t) => t.side === "sell");
    const volume = trades.reduce((sum, t) => sum + t.volume, 0);
    const notional = trades.reduce((sum, t) => sum + t.volume * t.price, 0);
    const vwap = volume > 0 ? notional / volume : 0;
    const largest = trades.reduce((best, t) => (t.volume * t.price > best.volume * best.price ? t : best), trades[0]);
    const span = trades[trades.length - 1].at - trades[0].at;
    return [
        `Kraken last ${trades.length} trade(s) on ${key}:`,
        "",
        `  window       ${utcClock(trades[0].at)}Z to ${utcClock(trades[trades.length - 1].at)}Z (${span.toFixed(0)}s)`,
        `  buy / sell   ${buys.length} / ${sells.length}`,
        `  volume       ${volume.toFixed(8)} base`,
        `  notional     ${money(notional)}`,
        `  VWAP         ${money(vwap)}`,
        `  largest      ${largest.volume} at ${money(largest.price)} = ${money(largest.volume * largest.price)}`,
        "",
        "Newest first:",
        ...trades.map((t) => `  ${utcClock(t.at)}Z  ${t.side.padEnd(4)} ${t.type.padEnd(6)} ${money(t.price)} x ${t.volume}`),
    ].join("\n");
}
export async function spreadHistory(args) {
    const count = clamp(args?.count, 20, 100);
    const d = await getJson(`/Spread?pair=${pairParam(args?.pair)}&count=${count}`);
    const result = check(d);
    const { key, rows } = firstArray(result);
    if (!key || !rows.length)
        return `No spread data for ${args?.pair}.`;
    const points = rows.map((r) => {
        const bid = Number(r[1]);
        const ask = Number(r[2]);
        const mid = (bid + ask) / 2;
        return { at: Number(r[0]), bid, ask, spread: ask - bid, bps: mid > 0 ? ((ask - bid) / mid) * 10000 : 0 };
    }).filter((p) => Number.isFinite(p.spread) && Number.isFinite(p.bps));
    if (!points.length)
        return `Kraken returned no readable spread rows for ${key}.`;
    const spreads = points.map((p) => p.spread);
    const bpss = points.map((p) => p.bps);
    const latest = points[points.length - 1];
    const avg = spreads.reduce((a, b) => a + b, 0) / spreads.length;
    const avgBps = bpss.reduce((a, b) => a + b, 0) / bpss.length;
    const tightest = points.reduce((best, p) => (p.bps < best.bps ? p : best), points[0]);
    const widest = points.reduce((best, p) => (p.bps > best.bps ? p : best), points[0]);
    return [
        `Kraken bid/ask spread history for ${key} (${points.length} quote(s)):`,
        "",
        `  latest      ${money(latest.bid)} / ${money(latest.ask)} = spread ${latest.spread.toFixed(8)} (${latest.bps.toFixed(2)} bps) at ${utcClock(latest.at)}Z`,
        `  average     ${avg.toFixed(8)} (${avgBps.toFixed(2)} bps)`,
        `  tightest    ${tightest.spread.toFixed(8)} (${tightest.bps.toFixed(2)} bps) at ${utcClock(tightest.at)}Z`,
        `  widest      ${widest.spread.toFixed(8)} (${widest.bps.toFixed(2)} bps) at ${utcClock(widest.at)}Z`,
        "",
        "Spread in basis points is the round-trip cost of a market order; a wide reading means thin liquidity.",
    ].join("\n");
}
export async function pairDetails(args) {
    const d = await getJson(`/AssetPairs?pair=${pairParam(args?.pair)}`);
    const result = check(d);
    const key = Object.keys(result)[0];
    if (!key)
        return `Kraken has no pair named ${args?.pair}.`;
    const p = result[key];
    const lever = (v) => (Array.isArray(v) && v.length ? Math.max(...v.map(Number)) : null);
    const buy = lever(p.leverage_buy);
    const sell = lever(p.leverage_sell);
    const fees = Array.isArray(p.fees) ? p.fees.length : 0;
    return [
        `Kraken pair ${p.wsname ?? p.altname ?? key} (id ${key})`,
        "",
        `  base / quote   ${p.base ?? "n/a"} / ${p.quote ?? "n/a"}`,
        `  price decimals ${p.pair_decimals ?? "n/a"}  |  lot decimals ${p.lot_decimals ?? "n/a"}  |  lot multiplier ${p.lot_multiplier ?? "n/a"}`,
        `  tick size      ${p.tick_size ?? "n/a"}`,
        `  minimum order  ${p.ordermin ?? "n/a"} base  |  minimum cost ${p.costmin ?? "n/a"}`,
        `  leverage       buy up to ${buy ?? "n/a"}x, sell up to ${sell ?? "n/a"}x`,
        `  fee tiers      ${fees || "n/a"} | margin call ${p.margin_call ?? "n/a"}% | stop ${p.margin_stop ?? "n/a"}%`,
        `  trading status ${p.status ?? "n/a"}`,
        "",
        "Use these decimals to size orders: rounding a Kraken order to fewer decimals than pair_decimals gets it rejected.",
    ].join("\n");
}
// ---- muxG tools:
const CB_BASE = "https://api.exchange.coinbase.com";
const BS_BASE = "https://www.bitstamp.net/api/v2";
// The venues publish the same pair under different tickers, so map them once.
const VENUES = {
    BTC: { kraken: "XBTUSD", coinbase: "BTC-USD", bitstamp: "btcusd", label: "Bitcoin" },
    ETH: { kraken: "ETHUSD", coinbase: "ETH-USD", bitstamp: "ethusd", label: "Ethereum" },
    SOL: { kraken: "SOLUSD", coinbase: "SOL-USD", bitstamp: "solusd", label: "Solana" },
    DOGE: { kraken: "XDGUSD", coinbase: "DOGE-USD", bitstamp: "dogeusd", label: "Dogecoin" },
    LTC: { kraken: "LTCUSD", coinbase: "LTC-USD", bitstamp: "ltcusd", label: "Litecoin" },
    XRP: { kraken: "XRPUSD", coinbase: "XRP-USD", bitstamp: "xrpusd", label: "XRP" },
    ADA: { kraken: "ADAUSD", coinbase: "ADA-USD", bitstamp: "adausd", label: "Cardano" },
    DOT: { kraken: "DOTUSD", coinbase: "DOT-USD", bitstamp: "dotusd", label: "Polkadot" },
    BCH: { kraken: "BCHUSD", coinbase: "BCH-USD", bitstamp: "bchusd", label: "Bitcoin Cash" },
    LINK: { kraken: "LINKUSD", coinbase: "LINK-USD", bitstamp: "linkusd", label: "Chainlink" },
};
const UA = 'mrfentmen-kraken-mcp/1.0';
async function venueJson(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 404)
        throw new Error(`Upstream returned 404 for ${new URL(url).pathname}`);
    if (!res.ok)
        throw new Error(`Upstream returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new Error("Upstream returned an empty body.");
    return JSON.parse(text);
}
const venueKey = (input) => {
    const raw = String(input ?? "").trim().toUpperCase().replace(/^XBT$/, "BTC");
    const key = Object.keys(VENUES).find((name) => name === raw || VENUES[name].label.toUpperCase() === raw);
    if (!key) {
        return { symbol: "", row: { kraken: raw, coinbase: raw, bitstamp: raw, label: raw } };
    }
    return { symbol: key, row: VENUES[key] };
};
const usd = (value) => `$${value.toLocaleString("en-US", { maximumFractionDigits: value < 10 ? 6 : 2 })}`;
/** The same asset on three venues at once: where the prices disagree and by how much. */
export async function crossExchangePrice(args) {
    const { symbol, row } = venueKey(args?.symbol);
    if (!symbol) {
        return `No cross-venue map for "${args?.symbol}". Mapped assets: ${Object.keys(VENUES).join(", ")}. For other pairs, use the single-venue tools.`;
    }
    const results = [];
    try {
        const data = await venueJson(`${BASE}/Ticker?pair=${encodeURIComponent(row.kraken)}`);
        const result = data.result ?? {};
        const first = Object.values(result)[0];
        if (first && !Array.isArray(first)) {
            const cell = first;
            results.push({ venue: "kraken", last: Number(cell.c?.[0]), bid: Number(cell.b?.[0]), ask: Number(cell.a?.[0]) });
        }
    }
    catch (e) {
        results.push({ venue: "kraken", note: e.message });
    }
    try {
        const data = await venueJson(`${CB_BASE}/products/${row.coinbase}/ticker`);
        results.push({ venue: "coinbase", last: Number(data.price), bid: Number(data.bid), ask: Number(data.ask) });
    }
    catch (e) {
        results.push({ venue: "coinbase", note: e.message });
    }
    try {
        const data = await venueJson(`${BS_BASE}/ticker/${row.bitstamp}/`);
        results.push({ venue: "bitstamp", last: Number(data.last), bid: Number(data.bid), ask: Number(data.ask) });
    }
    catch (e) {
        results.push({ venue: "bitstamp", note: e.message });
    }
    const priced = results.filter((entry) => typeof entry.last === "number" && Number.isFinite(entry.last));
    const lines = [`${row.label} (${symbol}) last traded price on each venue:`];
    for (const entry of results) {
        if (typeof entry.last !== "number" || !Number.isFinite(entry.last)) {
            lines.push(`  ${entry.venue.padEnd(10)} unavailable: ${entry.note ?? "no price returned"}`);
            continue;
        }
        const spread = typeof entry.bid === "number" && typeof entry.ask === "number" ? entry.ask - entry.bid : Number.NaN;
        lines.push(`  ${entry.venue.padEnd(10)} ${usd(entry.last)}${Number.isFinite(spread) ? ` · bid ${usd(entry.bid)} ask ${usd(entry.ask)} (${spread.toFixed(2)} wide)` : ""}`);
    }
    if (priced.length > 1) {
        const values = priced.map((entry) => entry.last);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const gap = min > 0 ? ((max - min) / min) * 100 : Number.NaN;
        lines.push("");
        lines.push(`Venue spread: ${usd(min)} to ${usd(max)}, ${gap.toFixed(3)}% between the cheapest and dearest venue.`);
    }
    else {
        lines.push("");
        lines.push("Only one venue answered, so no cross-venue gap can be computed.");
    }
    return lines.join("\n");
}
/** A market-wide view of which pairs are actually liquid and how tight their spreads are. */
export async function liquidityMap(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 15) || 15, 1), 40);
    const minVolume = Math.max(0, Math.min(Number(args?.min_volume ?? 100_000) || 100_000, 1e12));
    const data = await venueJson(`${BASE}/Ticker`);
    const result = data.result ?? {};
    const rows = [];
    for (const [pair, cell] of Object.entries(result)) {
        if (pair.endsWith(".d"))
            continue;
        const volume = Number((cell.v?.[1]) ?? 0);
        const last = Number((cell.c?.[0]) ?? 0);
        const bid = Number((cell.b?.[0]) ?? 0);
        const ask = Number((cell.a?.[0]) ?? 0);
        if (!Number.isFinite(volume) || volume < minVolume || !Number.isFinite(last) || last <= 0)
            continue;
        const mid = (bid + ask) / 2;
        rows.push({ pair, volume, last, bps: mid > 0 && Number.isFinite(bid) && Number.isFinite(ask) ? ((ask - bid) / mid) * 10000 : null });
    }
    if (!rows.length) {
        return `No Kraken pair has a 24 hour volume of ${minVolume.toLocaleString("en-US")} or more in this snapshot.`;
    }
    const wanted = String(args?.quote ?? "").trim().toUpperCase();
    const filtered = wanted ? rows.filter((row) => row.pair.replace(/^[X-Z]/, "X").endsWith(wanted)) : rows;
    const ranked = [...filtered].sort((a, b) => b.volume - a.volume).slice(0, limit);
    const total = filtered.reduce((sum, row) => sum + row.volume, 0);
    const tight = ranked.filter((row) => row.bps !== null).sort((a, b) => (a.bps ?? Infinity) - (b.bps ?? Infinity));
    const lines = [
        `Kraken liquidity map: ${filtered.length} pair(s) above ${minVolume.toLocaleString("en-US")} base volume in 24 hours, ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })} combined, showing ${ranked.length}`,
        "Volume is the 24 hour figure Kraken publishes per pair; spread is in basis points of the mid.",
        "",
    ];
    for (const [i, row] of ranked.entries()) {
        lines.push(`  ${i + 1}. ${row.pair} last ${usd(row.last)} · volume ${row.volume.toLocaleString("en-US", { maximumFractionDigits: 0 })} · spread ${row.bps === null ? "not reported" : `${row.bps.toFixed(1)} bps`}`);
    }
    if (tight.length) {
        lines.push("");
        lines.push(`Tightest spread on this page: ${tight[0].pair} at ${(tight[0].bps ?? 0).toFixed(1)} bps; widest ${tight[tight.length - 1].pair} at ${(tight[tight.length - 1].bps ?? 0).toFixed(1)} bps.`);
    }
    return lines.join("\n");
}
