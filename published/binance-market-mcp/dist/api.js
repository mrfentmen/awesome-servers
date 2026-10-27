const BASE = "https://data-api.binance.vision/api/v3";
const UA = "mrfentmen-binance-market-mcp/1.0 (https://github.com/mrfentmen)";
export class BinanceError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new BinanceError("Binance rate limit hit, wait and retry");
    if (!res.ok)
        throw new BinanceError(`Binance error ${res.status}`);
    return (await res.json());
}
const VALID = /^[A-Z0-9]{4,20}$/;
// Error payloads from Binance are untyped JSON, and only `msg` is ever read.
function readMsg(value) {
    if (typeof value !== "object" || value === null)
        return undefined;
    const msg = value.msg;
    return msg === undefined ? undefined : String(msg);
}
export async function ticker(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const t = await get(`${BASE}/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
    if (t?.code)
        throw new BinanceError(`Binance: ${String(t.msg ?? "invalid symbol")}`);
    const change = Number(t?.priceChangePercent ?? 0);
    return `${symbol} 24h:\nPrice: ${Number(t?.lastPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}\nChange: ${change.toFixed(2)}% (${Number(t?.priceChange ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })})\nHigh: ${t?.highPrice ?? "n/a"} | Low: ${t?.lowPrice ?? "n/a"}\nVolume: ${Number(t?.volume ?? 0).toLocaleString()} ${symbol.replace(/USDT$/, "")}`;
}
export async function klines(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const interval = (args.interval ?? "1d").toLowerCase();
    if (!["1m", "5m", "15m", "1h", "4h", "1d", "1w"].includes(interval))
        throw new BinanceError("Interval must be 1m, 5m, 15m, 1h, 4h, 1d, or 1w");
    const limit = Math.min(args.limit ?? 7, 100);
    const d = await get(`${BASE}/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`);
    if (!Array.isArray(d))
        throw new BinanceError(`Binance: ${readMsg(d) ?? "invalid symbol"}`);
    return d.map((k) => {
        const date = new Date(k[0]).toISOString().slice(0, 10);
        return `${date} | O ${Number(k[1]).toFixed(2)} H ${Number(k[2]).toFixed(2)} L ${Number(k[3]).toFixed(2)} C ${Number(k[4]).toFixed(2)}`;
    }).join("\n");
}
export async function price(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const d = await get(`${BASE}/ticker/price?symbol=${encodeURIComponent(symbol)}`);
    if (d?.code)
        throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`);
    return `${symbol}: ${Number(d.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}`;
}
export async function book(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const d = await get(`${BASE}/ticker/bookTicker?symbol=${encodeURIComponent(symbol)}`);
    if (d?.code)
        throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`);
    return `${symbol} best bid/ask:\nBid: ${d.bidPrice ?? 'n/a'} x ${d.bidQty ?? 'n/a'}\nAsk: ${d.askPrice ?? 'n/a'} x ${d.askQty ?? 'n/a'}`;
}
export async function avg(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const d = await get(`${BASE}/avgPrice?symbol=${encodeURIComponent(symbol)}`);
    if (d?.code)
        throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`);
    return `${symbol} 5-minute average price: ${Number(d.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} (interval ${d.mins ?? 5} min)`;
}
export async function depth(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const d = await get(`${BASE}/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    if (d?.code)
        throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`);
    const fmt = (rows) => (rows ?? []).map((r) => `${r[0]} x ${r[1]}`).join(', ');
    return `${symbol} order book (top ${limit}):\nBids: ${fmt(d.bids)}\nAsks: ${fmt(d.asks)}`;
}
export async function markets() {
    const d = await get(`${BASE}/exchangeInfo`);
    const symbols = d.symbols ?? [];
    const trading = symbols.filter((s) => s.status === 'TRADING').length;
    const sample = symbols.slice(0, 12).map((s) => s.symbol).join(', ');
    return `Binance lists ${symbols.length} symbols (${trading} TRADING). Sample: ${sample}. Full list omitted for size.`;
}
// ---- batch-3 tools: extra live market data (2026-09-27) ----
export async function recentTrades(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 50);
    const d = await get(`${BASE}/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    if (!Array.isArray(d))
        throw new BinanceError(`Binance: ${readMsg(d) ?? "invalid symbol"}`);
    const rows = d;
    if (!rows.length)
        return `No recent trades for ${symbol}.`;
    const quoteOf = (r) => Number(r.price ?? 0) * Number(r.qty ?? 0);
    const buys = rows.filter((r) => r.isBuyerMaker !== true);
    const sells = rows.filter((r) => r.isBuyerMaker === true);
    const buyVolume = buys.reduce((s, r) => s + quoteOf(r), 0);
    const sellVolume = sells.reduce((s, r) => s + quoteOf(r), 0);
    const total = buyVolume + sellVolume;
    const qty = rows.reduce((s, r) => s + Number(r.qty ?? 0), 0);
    const vwap = qty > 0 ? rows.reduce((s, r) => s + quoteOf(r), 0) / qty : 0;
    return [
        `${symbol} last ${rows.length} trades (taker flow):`,
        `Buy ${buyVolume.toFixed(2)} quote (${total > 0 ? ((buyVolume / total) * 100).toFixed(1) : '0'}%) vs sell ${sellVolume.toFixed(2)} quote`,
        `VWAP ${vwap.toFixed(8)}`,
        ...rows.slice(0, 10).map((r) => `${r.time ? new Date(r.time).toISOString().slice(11, 19) : '?'} ${r.isBuyerMaker === true ? "sell" : "buy"} ${r.qty ?? "?"} @ ${r.price ?? "?"}`),
    ].join("\n");
}
export async function symbolInfo(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const d = await get(`${BASE}/exchangeInfo?symbol=${encodeURIComponent(symbol)}`);
    if (d?.code)
        throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`);
    const s = (d.symbols ?? [])[0];
    if (!s)
        throw new BinanceError(`Binance has no symbol ${symbol}`);
    const filter = (type) => (s.filters ?? []).find((f) => f.filterType === type);
    const price = filter("PRICE_FILTER");
    const lot = filter("LOT_SIZE");
    const notional = filter("NOTIONAL");
    return [
        `${s.symbol ?? symbol} — ${s.status ?? "?"} | ${s.baseAsset ?? "?"}/${s.quoteAsset ?? "?"} | spot trading ${s.isSpotTradingAllowed ? "allowed" : "not allowed"}`,
        `Precision: base ${s.baseAssetPrecision ?? "?"}, quote ${s.quoteAssetPrecision ?? "?"}`,
        `Tick size ${price?.tickSize ?? "?"} | step size ${lot?.stepSize ?? "?"} | min qty ${lot?.minQty ?? "?"} | min notional ${notional?.minNotional ?? "?"}`,
        `Order types: ${(s.orderTypes ?? []).join(", ") || "?"}`,
        `Permissions: ${(s.permissions ?? []).join(", ") || "?"} | exchange timezone ${d.timezone ?? "?"}`,
    ].join("\n");
}
export async function volumeLeaders(args) {
    const quote = (args.quote ?? "USDT").trim().toUpperCase();
    if (!/^[A-Z]{2,6}$/.test(quote))
        throw new BinanceError("Quote like USDT, USDC or BTC");
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 15), 1), 30);
    const d = await get(`${BASE}/ticker/24hr`);
    if (!Array.isArray(d))
        throw new BinanceError(`Binance: ${readMsg(d) ?? "ticker list unavailable"}`);
    const rows = d
        .filter((t) => (t.symbol ?? "").endsWith(quote) && (t.symbol ?? "").length > quote.length);
    if (!rows.length)
        throw new BinanceError(`Binance lists no ${quote} pairs`);
    const ranked = rows.map((t) => ({ ...t, volume: Number(t.quoteVolume ?? 0) })).filter((t) => t.volume > 0)
        .sort((a, b) => b.volume - a.volume);
    if (!ranked.length)
        throw new BinanceError(`Binance reported no 24h volume for ${quote} pairs`);
    const total = ranked.reduce((s, t) => s + t.volume, 0);
    const top = ranked.slice(0, limit);
    return [
        `Binance ${quote} pairs: ${rows.length} listed, ${ranked.length} with 24h volume, ${Math.round(total).toLocaleString()} ${quote} total quote volume.`,
        `Top ${top.length} by 24h quote volume:`,
        ...top.map((t, i) => `  ${i + 1}. ${t.symbol ?? "?"} | ${Number(t.lastPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} | ${Number(t.priceChangePercent ?? 0).toFixed(2)}% | vol ${Math.round(t.volume).toLocaleString()} ${quote} (${((t.volume / total) * 100).toFixed(1)}%)`),
    ].join("\n");
}
async function allTickers() {
    const d = await get(`${BASE}/ticker/24hr`);
    if (!Array.isArray(d))
        throw new BinanceError(`Binance: ${readMsg(d) ?? "ticker list unavailable"}`);
    return d;
}
/** GET /ticker/24hr for a comma-separated list of symbols, side by side. */
export async function compareTickers(args) {
    const wanted = (args.symbols ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!wanted.length)
        throw new BinanceError("Provide symbols like BTCUSDT,ETHUSDT,SOLUSDT");
    if (wanted.length > 20)
        throw new BinanceError("Compare at most 20 symbols at a time");
    const bad = wanted.filter((s) => !VALID.test(s));
    if (bad.length)
        throw new BinanceError(`Not a Binance symbol: ${bad.join(", ")}`);
    const rows = await allTickers();
    const bySym = new Map(rows.map((t) => [t.symbol ?? "", t]));
    const lines = [`Binance 24h comparison for ${wanted.length} symbol(s)`, ""];
    let missing = 0;
    for (const s of wanted) {
        const t = bySym.get(s);
        if (!t) {
            missing += 1;
            lines.push(`${s}: not listed on Binance`);
            continue;
        }
        const change = Number(t.priceChangePercent ?? 0);
        const rangeLow = Number(t.lowPrice ?? 0);
        const rangeHigh = Number(t.highPrice ?? 0);
        const position = rangeHigh > rangeLow ? ((Number(t.lastPrice ?? 0) - rangeLow) / (rangeHigh - rangeLow)) * 100 : null;
        lines.push(`${s} | last ${Number(t.lastPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} | ${change >= 0 ? "+" : ""}${change.toFixed(2)}% | ` +
            `24h range ${rangeLow.toLocaleString(undefined, { maximumFractionDigits: 8 })} - ${rangeHigh.toLocaleString(undefined, { maximumFractionDigits: 8 })}` +
            (position === null ? "" : ` | ${position.toFixed(0)}% through the range`) +
            ` | quote volume ${Math.round(Number(t.quoteVolume ?? 0)).toLocaleString()}`);
    }
    const priced = wanted.length - missing;
    if (priced < 2) {
        lines.push("");
        lines.push("Fewer than two symbols priced, so there is nothing to compare.");
    }
    else {
        const moves = wanted.map((s) => bySym.get(s)).filter((t) => Boolean(t)).map((t) => Number(t.priceChangePercent ?? 0));
        const best = wanted[moves.indexOf(Math.max(...moves))];
        const worst = wanted[moves.indexOf(Math.min(...moves))];
        lines.push("");
        lines.push(`Best 24h move: ${best} (${Math.max(...moves).toFixed(2)}%) | worst: ${worst} (${Math.min(...moves).toFixed(2)}%)`);
    }
    return lines.join("\n");
}
// ---- muxF tools:
const price8 = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 });
function moverLine(t, quote) {
    const last = Number(t.lastPrice ?? 0);
    const change = Number(t.priceChangePercent ?? 0);
    const low = Number(t.lowPrice ?? 0);
    const high = Number(t.highPrice ?? 0);
    const position = high > low ? ((last - low) / (high - low)) * 100 : null;
    return (`${t.symbol ?? "?"} | ${price8(last)} | ${change >= 0 ? "+" : ""}${change.toFixed(2)}%` +
        ` | range ${price8(low)} - ${price8(high)}` +
        (position === null ? "" : ` | ${position.toFixed(0)}% through`) +
        ` | vol ${Math.round(Number(t.quoteVolume ?? 0)).toLocaleString()} ${quote}`);
}
export async function marketMovers(args) {
    const quote = (args.quote ?? "USDT").trim().toUpperCase();
    if (!/^[A-Z]{2,6}$/.test(quote))
        throw new BinanceError("Quote like USDT, BTC or USDC");
    const limit = Math.min(Math.max(Math.floor(Number(args.limit ?? 8) || 8), 1), 20);
    const d = await get(`${BASE}/ticker/24hr`);
    if (!Array.isArray(d))
        throw new BinanceError(`Binance: ${readMsg(d) ?? "ticker list unavailable"}`);
    const rows = d.filter((t) => {
        const s = t.symbol ?? "";
        return s.endsWith(quote) && s.length > quote.length && Number(t.quoteVolume ?? 0) > 0;
    });
    if (!rows.length)
        throw new BinanceError(`Binance lists no ${quote} pairs with 24h volume`);
    const ranked = [...rows].sort((a, b) => Number(b.priceChangePercent ?? 0) - Number(a.priceChangePercent ?? 0));
    const gainers = ranked.slice(0, limit);
    const gainerSymbols = new Set(gainers.map((t) => t.symbol));
    const losers = ranked
        .slice(-Math.min(limit * 2, ranked.length))
        .filter((t) => !gainerSymbols.has(t.symbol))
        .slice(-limit)
        .reverse();
    return [
        `Binance ${quote}: ${rows.length.toLocaleString()} pairs with 24h volume, ${rows.filter((t) => Number(t.priceChangePercent ?? 0) >= 0).length.toLocaleString()} up and ${rows.filter((t) => Number(t.priceChangePercent ?? 0) < 0).length.toLocaleString()} down.`,
        "",
        `Top ${gainers.length} gainer(s) in 24h:`,
        ...gainers.map((t, i) => `  ${i + 1}. ${moverLine(t, quote)}`),
        "",
        `Top ${losers.length} loser(s) in 24h:`,
        ...(losers.length ? losers.map((t, i) => `  ${i + 1}. ${moverLine(t, quote)}`) : ["  none"]),
    ].join("\n");
}
const CANDLES_PER_YEAR = { "1m": 525600, "5m": 105120, "15m": 35040, "1h": 8760, "4h": 2190, "1d": 365, "1w": 52 };
export async function klineIndicators(args) {
    const symbol = (args.symbol ?? "").trim().toUpperCase();
    if (!VALID.test(symbol))
        throw new BinanceError("Provide a symbol like BTCUSDT");
    const interval = (args.interval ?? "1d").toLowerCase();
    if (!(interval in CANDLES_PER_YEAR))
        throw new BinanceError("Interval must be 1m, 5m, 15m, 1h, 4h, 1d, or 1w");
    const limit = Math.min(Math.max(Math.floor(Number(args.limit ?? 100) || 100), 30), 500);
    const d = await get(`${BASE}/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`);
    if (!Array.isArray(d))
        throw new BinanceError(`Binance: ${readMsg(d) ?? "invalid symbol"}`);
    const candles = d
        .map((k) => ({ openTime: Number(k[0]), close: Number(k[4]) }))
        .filter((c) => Number.isFinite(c.close) && c.close > 0);
    if (candles.length < 30)
        throw new BinanceError(`Binance returned ${candles.length} usable candles, which is too few for these indicators`);
    const closes = candles.map((c) => c.close);
    const last = closes[closes.length - 1];
    const sma = (window) => (closes.length >= window
        ? closes.slice(-window).reduce((a, b) => a + b, 0) / window
        : null);
    const returns = [];
    for (let i = 1; i < closes.length; i += 1)
        returns.push(Math.log(closes[i] / closes[i - 1]));
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(returns.length - 1, 1);
    const vol = Math.sqrt(variance) * Math.sqrt(CANDLES_PER_YEAR[interval]) * 100;
    const period = 14;
    let gain = 0;
    let loss = 0;
    const rsiWindow = closes.slice(-(period + 1));
    for (let i = 1; i < rsiWindow.length; i += 1) {
        const diff = rsiWindow[i] - rsiWindow[i - 1];
        if (diff >= 0)
            gain += diff;
        else
            loss -= diff;
    }
    const avgGain = gain / period;
    const avgLoss = loss / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    const peak = Math.max(...closes);
    const drawdown = ((last - peak) / peak) * 100;
    const windowChange = ((last - closes[0]) / closes[0]) * 100;
    const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
    const smaLine = [7, 30, 50]
        .map((w) => {
        const v = sma(w);
        return v === null ? `SMA ${w}: n/a` : `SMA ${w}: ${price8(v)}`;
    })
        .join(" | ");
    const tone = rsi >= 70 ? "overbought" : rsi <= 30 ? "oversold" : "neutral";
    return [
        `${symbol} ${interval} — ${candles.length} candles, ${new Date(candles[0].openTime).toISOString().slice(0, 10)} to ${new Date(candles[candles.length - 1].openTime).toISOString().slice(0, 10)}`,
        `Last close ${price8(last)} | change over the window ${fmtPct(windowChange)}`,
        smaLine,
        `RSI 14: ${rsi.toFixed(1)} (${tone})`,
        `Annualised realised volatility: ${vol.toFixed(1)}% (from ${returns.length} candle returns)`,
        `Drawdown from the window high (${price8(peak)}): ${drawdown.toFixed(2)}%`,
    ].join("\n");
}
