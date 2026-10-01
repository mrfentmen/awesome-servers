const BASE = 'https://api.kraken.com/0/public';

export interface TickerArgs {
  pair: string;
}

export interface OhlcArgs {
  pair: string;
  interval?: number;
}

export interface DepthArgs {
  pair: string;
  count?: number;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Kraken returned ${res.status}`);
  return (await res.json()) as T;
}

interface KrakenEnvelope<T> {
  error: string[];
  result?: T;
}

function check<T>(d: KrakenEnvelope<T>): T {
  if (d.error?.length) throw new Error(`Kraken error: ${d.error.join('; ')}`);
  return (d.result ?? {}) as T;
}

const clamp = (value: number | undefined, fallback: number, max = 50) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

export async function ticker(args: TickerArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like XBTUSD.';
  const res = await fetch(`${BASE}/Ticker?pair=${encodeURIComponent(pair)}`, {
    headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Kraken returned ${res.status}`);
  const d = (await res.json()) as { result?: Record<string, Record<string, unknown>> };
  const result = d.result ?? {};
  const key = Object.keys(result)[0];
  if (!key) return `No ticker for ${pair}.`;
  const r = result[key];
  const a = (r.a ?? []) as Array<unknown>;
  const c = (r.c ?? []) as Array<unknown>;
  const v = (r.v ?? []) as Array<unknown>;
  const h = (r.h ?? []) as Array<unknown>;
  const l = (r.l ?? []) as Array<unknown>;
  const num = (x: unknown) => (x != null ? Number(x) : NaN);
  return [
    `Kraken ${key}:`,
    `Last: ${String(c[0] ?? '')} | Ask: ${String(a[0] ?? '')}`,
    `24h: high ${String(h[1] ?? '')} low ${String(l[1] ?? '')}`,
    `24h volume: ${String(v[1] ?? '')}`,
    `Spread: ${num(c[0]) - num(a[0])}`,
  ].filter(Boolean).join('\n');
}

export async function assets(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/Assets`, {
    headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Kraken returned ${res.status}`);
  const d = (await res.json()) as { result?: Record<string, Record<string, unknown>> };
  const result = d.result ?? {};
  const keys = Object.keys(result);
  if (!keys.length) return 'No assets returned.';
  return `Kraken assets (${keys.length}):\n` +
    keys.slice(0, 30).map((k, i) => {
      const a = result[k];
      const name = String((a.altname ?? a.asset ?? k));
      return `${i + 1}. ${name}`;
    }).join('\n');
}

export async function pairs(): Promise<string> {
  const d = await getJson<KrakenEnvelope<Record<string, { altname?: string; wsname?: string }>>>('/AssetPairs');
  const result = check(d);
  const keys = Object.keys(result);
  const sample = keys.slice(0, 15).map((k) => result[k].wsname ?? result[k].altname ?? k).join(', ');
  return `Kraken lists ${keys.length} pairs. Sample: ${sample}. Full list omitted for size.`;
}

export async function ohlc(args: OhlcArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like XBTUSD.';
  const interval = clamp(args.interval, 1440, 10080);
  const d = await getJson<KrakenEnvelope<Record<string, (string | number)[][]>>>(
    `/OHLC?pair=${encodeURIComponent(pair)}&interval=${interval}`);
  const result = check(d);
  const key = Object.keys(result)[0];
  if (!key) return `No candles for ${pair}.`;
  const candles = result[key].slice(-10).map((c) => {
    const t = new Date(Number(c[0]) * 1000).toISOString().slice(0, 10);
    return `${t} o:${c[1]} h:${c[2]} l:${c[3]} c:${c[4]} v:${c[6]}`;
  });
  return `Kraken ${key} daily candles (${interval}-min interval, last ${candles.length}):\n` + candles.join('\n');
}

export async function depth(args: DepthArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like XBTUSD.';
  const count = clamp(args.count, 5, 25);
  const d = await getJson<KrakenEnvelope<Record<string, { asks?: string[][]; bids?: string[][] }>>>(
    `/Depth?pair=${encodeURIComponent(pair)}&count=${count}`);
  const result = check(d);
  const key = Object.keys(result)[0];
  if (!key) return `No book for ${pair}.`;
  const book = result[key];
  const fmt = (rows: string[][] | undefined) => (rows ?? []).map((r) => `${r[0]} x ${r[1]}`).join(', ');
  return `Kraken ${key} top of book:\nAsks: ${fmt(book.asks)}\nBids: ${fmt(book.bids)}`;
}

export async function time(): Promise<string> {
  const d = await getJson<KrakenEnvelope<{ unixtime?: number; rfc1123?: string }>>('/Time');
  const result = check(d);
  return `Kraken server time: ${result.rfc1123 ?? 'n/a'} (epoch ${result.unixtime ?? 'n/a'})`;
}

export async function status(): Promise<string> {
  const d = await getJson<KrakenEnvelope<{ status?: string; timestamp?: string }>>('/SystemStatus');
  const result = check(d);
  return `Kraken status: ${result.status ?? 'n/a'} as of ${result.timestamp ?? 'n/a'}`;
}
// ---- batch-4 tools: trades, spread and pair details (2026-09-27) ----
function pairParam(pair?: string): string {
  const clean = String(pair ?? "").trim().toUpperCase()
  if (!clean) throw new Error("Provide a pair like XBTUSD.")
  return encodeURIComponent(clean)
}

function firstArray(result: Record<string, unknown>): { key: string; rows: unknown[][] } {
  const key = Object.keys(result).find((k) => Array.isArray(result[k]) && (result[k] as unknown[]).length > 0)
  if (!key) return { key: "", rows: [] }
  return { key, rows: result[key] as unknown[][] }
}

const utcClock = (seconds: number) => new Date(seconds * 1000).toISOString().slice(11, 19)
const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 6 : 2 })}`

export async function recentTrades(args: { pair: string; count?: number }): Promise<string> {
  const count = clamp(args?.count, 20, 100)
  const d = await getJson<KrakenEnvelope<Record<string, unknown>>>(`/Trades?pair=${pairParam(args?.pair)}&count=${count}`)
  const result = check(d)
  const { key, rows } = firstArray(result)
  if (!key || !rows.length) return `No trades returned for ${args?.pair}.`
  const trades = rows.map((r) => ({
    price: Number(r[0]),
    volume: Number(r[1]),
    at: Number(r[2]),
    side: String(r[3]) === "b" ? "buy" : "sell",
    type: String(r[4]) === "m" ? "market" : "limit",
  })).filter((t) => Number.isFinite(t.price) && Number.isFinite(t.volume))
  if (!trades.length) return `Kraken returned no readable trades for ${key}.`
  const buys = trades.filter((t) => t.side === "buy")
  const sells = trades.filter((t) => t.side === "sell")
  const volume = trades.reduce((sum, t) => sum + t.volume, 0)
  const notional = trades.reduce((sum, t) => sum + t.volume * t.price, 0)
  const vwap = volume > 0 ? notional / volume : 0
  const largest = trades.reduce((best, t) => (t.volume * t.price > best.volume * best.price ? t : best), trades[0])
  const span = trades[trades.length - 1].at - trades[0].at
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
  ].join("\n")
}

export async function spreadHistory(args: { pair: string; count?: number }): Promise<string> {
  const count = clamp(args?.count, 20, 100)
  const d = await getJson<KrakenEnvelope<Record<string, unknown>>>(`/Spread?pair=${pairParam(args?.pair)}&count=${count}`)
  const result = check(d)
  const { key, rows } = firstArray(result)
  if (!key || !rows.length) return `No spread data for ${args?.pair}.`
  const points = rows.map((r) => {
    const bid = Number(r[1])
    const ask = Number(r[2])
    const mid = (bid + ask) / 2
    return { at: Number(r[0]), bid, ask, spread: ask - bid, bps: mid > 0 ? ((ask - bid) / mid) * 10000 : 0 }
  }).filter((p) => Number.isFinite(p.spread) && Number.isFinite(p.bps))
  if (!points.length) return `Kraken returned no readable spread rows for ${key}.`
  const spreads = points.map((p) => p.spread)
  const bpss = points.map((p) => p.bps)
  const latest = points[points.length - 1]
  const avg = spreads.reduce((a, b) => a + b, 0) / spreads.length
  const avgBps = bpss.reduce((a, b) => a + b, 0) / bpss.length
  const tightest = points.reduce((best, p) => (p.bps < best.bps ? p : best), points[0])
  const widest = points.reduce((best, p) => (p.bps > best.bps ? p : best), points[0])
  return [
    `Kraken bid/ask spread history for ${key} (${points.length} quote(s)):`,
    "",
    `  latest      ${money(latest.bid)} / ${money(latest.ask)} = spread ${latest.spread.toFixed(8)} (${latest.bps.toFixed(2)} bps) at ${utcClock(latest.at)}Z`,
    `  average     ${avg.toFixed(8)} (${avgBps.toFixed(2)} bps)`,
    `  tightest    ${tightest.spread.toFixed(8)} (${tightest.bps.toFixed(2)} bps) at ${utcClock(tightest.at)}Z`,
    `  widest      ${widest.spread.toFixed(8)} (${widest.bps.toFixed(2)} bps) at ${utcClock(widest.at)}Z`,
    "",
    "Spread in basis points is the round-trip cost of a market order; a wide reading means thin liquidity.",
  ].join("\n")
}

export async function pairDetails(args: { pair: string }): Promise<string> {
  const d = await getJson<KrakenEnvelope<Record<string, Record<string, unknown>>>>(`/AssetPairs?pair=${pairParam(args?.pair)}`)
  const result = check(d)
  const key = Object.keys(result)[0]
  if (!key) return `Kraken has no pair named ${args?.pair}.`
  const p = result[key]
  const lever = (v: unknown) => (Array.isArray(v) && v.length ? Math.max(...v.map(Number)) : null)
  const buy = lever(p.leverage_buy)
  const sell = lever(p.leverage_sell)
  const fees = Array.isArray(p.fees) ? p.fees.length : 0
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
  ].join("\n")
}

// ---- muxG tools:
const CB_BASE = "https://api.exchange.coinbase.com"
const BS_BASE = "https://www.bitstamp.net/api/v2"

// The venues publish the same pair under different tickers, so map them once.
const VENUES: Record<string, { kraken: string; coinbase: string; bitstamp: string; label: string }> = {
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
}

const UA = 'mrfentmen-kraken-mcp/1.0'

async function venueJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (res.status === 404) throw new Error(`Upstream returned 404 for ${new URL(url).pathname}`);
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("Upstream returned an empty body.");
  return JSON.parse(text) as T;
}

const venueKey = (input: string): { symbol: string; row: (typeof VENUES)[string] } => {
  const raw = String(input ?? "").trim().toUpperCase().replace(/^XBT$/, "BTC");
  const key = Object.keys(VENUES).find((name) => name === raw || VENUES[name].label.toUpperCase() === raw);
  if (!key) {
    return { symbol: "", row: { kraken: raw, coinbase: raw, bitstamp: raw, label: raw } };
  }
  return { symbol: key, row: VENUES[key] };
};

const usd = (value: number): string =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: value < 10 ? 6 : 2 })}`

