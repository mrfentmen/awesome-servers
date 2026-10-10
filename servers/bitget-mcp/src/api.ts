const BASE = 'https://api.bitget.com/api/v2/spot/market/tickers';
const UA = 'mrfentmen-bitget-mcp/1.0';

export interface TickerArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a symbol like BTCUSDT.';
  const res = await fetch(`${BASE}?symbol=${encodeURIComponent(symbol)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bitget returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ symbol?: string; lastPr?: string; askPr?: string; bidPr?: string; high24h?: string; low24h?: string; baseVolume?: string }> };
  const rows = d.data ?? [];
  if (!rows.length) return `No ticker for ${symbol}.`;
  const t = rows[0];
  return [
    `Bitget ${t.symbol ?? symbol}:`,
    `Last: ${t.lastPr ?? '?'} | Bid: ${t.bidPr ?? '?'} | Ask: ${t.askPr ?? '?'}`,
    `24h: high ${t.high24h ?? '?'} low ${t.low24h ?? '?'}`,
    `Volume: ${t.baseVolume ?? '?'}`,
  ].filter(Boolean).join('\n');
}

// ---- muxE tools:
// The one existing tool reports a single spot quote and nothing else, so a
// caller cannot see the depth behind the best bid and ask, cannot reconstruct
// any series of prices from the 24 hour high and low alone, and cannot tell
// spot from the perpetual market at all. These three reach three other public
// Bitget endpoints and each returns the shape the ticker cannot produce.
const ORDERS = 'https://api.bitget.com/api/v2/spot/market/orderbook';
const CANDLES = 'https://api.bitget.com/api/v2/spot/market/candles';
const CONTRACTS = 'https://api.bitget.com/api/v2/mix/market/ticker';

// Verified against the live API on 2026-09-28: the spot candle route accepts
// these eleven granularities and rejects the mixed-case forms the futures
// route uses, and the futures route in turn wants 1H and 1D rather than 1h.
// Sending the wrong case earns a 400171 with the list of what it wanted, so the
// two sets are kept apart deliberately rather than normalised into one.
const SPOT_GRANULARITIES = ['1min', '3min', '5min', '15min', '30min', '1h', '4h', '6h', '12h', '1day', '1week'] as const;
const FUTURES_GRANULARITIES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '6H', '12H', '1D', '1W', '1M', '6Hutc', '12Hutc', '1Dutc', '3Dutc', '1Wutc', '1Mutc'] as const;

const num = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : null;
};

const fixed = (n: number | null, places = 8): string => (n === null ? '?' : n.toFixed(places).replace(/0+$/, '').replace(/\.$/, ''));

async function get<T>(url: string): Promise<{ rows: T[]; requestTime: number; code: string; msg: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  const body = (await res.json().catch(() => ({}))) as { code?: string; msg?: string; requestTime?: number; data?: T };
  const code = body.code ?? 'unknown';
  const msg = body.msg ?? '';
  // An unknown symbol comes back as an HTTP 400 carrying a 40034 and a plain
  // sentence, which is far more use than the status alone, so the body is read
  // before the status is judged and the API's own wording is passed through.
  if (code !== '00000') {
    if (res.ok) throw new Error(`Bitget refused the request (${code}): ${msg || 'no reason given'}`);
    if (!msg) throw new Error(`Bitget returned ${res.status}`);
    throw new Error(`Bitget returned ${res.status} and said: ${msg}`);
  }
  const data = body.data;
  return { rows: Array.isArray(data) ? (data as T[]) : data ? [data as T] : [], requestTime: body.requestTime ?? 0, code, msg };
}

interface Level {
  price: number;
  size: number;
}

// The ladder arrives as [price, size] string pairs, so it is parsed in one
// place with a real guard rather than filtered with a bare predicate, which
// would leave the type as number | null and push casts into every caller.
const levels = (raw: string[][] | undefined): Level[] => {
  const out: Level[] = [];
  for (const [p, s] of raw ?? []) {
    const price = num(p);
    const size = num(s);
    if (price !== null && size !== null) out.push({ price, size });
  }
  return out;
};

const stamp = (ms: number): string => {
  if (!ms) return 'unknown';
  return `${new Date(ms).toISOString().replace('.000Z', 'Z')} (${new Date(ms).toUTCString()})`;
};

export interface OrderbookArgs {
  symbol: string;
  limit?: number;
}

export interface CandlesArgs {
  symbol: string;
  granularity?: string;
  limit?: number;
}

export async function candles(args: CandlesArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a symbol like BTCUSDT.';
  const granularity = (args.granularity ?? '1h').trim().toLowerCase();
  if (!SPOT_GRANULARITIES.includes(granularity as (typeof SPOT_GRANULARITIES)[number])) {
    return `Bitget's spot candles accept these granularities: ${SPOT_GRANULARITIES.join(', ')}. You asked for ${args.granularity}.`;
  }
  const limit = Math.max(1, Math.min(200, Math.floor(Number(args.limit ?? 24) || 24)));
  const { rows, requestTime } = await get<string[]>(
    `${CANDLES}?symbol=${encodeURIComponent(symbol)}&granularity=${encodeURIComponent(granularity)}&limit=${limit}`,
  );
  const bars = rows
    .map((r) => ({ ts: num(r[0]), open: num(r[1]), high: num(r[2]), low: num(r[3]), close: num(r[4]), base: num(r[5]), quote: num(r[6]) }))
    .filter((b): b is { ts: number; open: number; high: number; low: number; close: number; base: number; quote: number } => b.ts !== null)
    .sort((a, b) => a.ts - b.ts);
  if (!bars.length) return `Bitget returned no candles for ${symbol} at ${granularity}.`;
  const first = bars[0];
  const last = bars[bars.length - 1];
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const span = { high: Math.max(...highs), low: Math.min(...lows) };
  const rising = bars.filter((b, i) => i > 0 && b.close > bars[i - 1].close).length;
  const falling = bars.filter((b, i) => i > 0 && b.close < bars[i - 1].close).length;
  const stepMs = granularity === '1week' ? 7 * 864e5 : granularity === '1day' ? 864e5 : 0;
  const lines = [
    `Bitget ${symbol} spot candles, ${bars.length} ${granularity} bar(s):`,
    `  returned ${stamp(Number(last.ts))}, each bar stamped ${stepMs ? stamp(Number(last.ts) - stepMs) : 'by its own open time'}`,
  ];
  lines.push(`  first bar ${stamp(Number(first.ts))} | last bar ${stamp(Number(last.ts))}`);
  lines.push(`  period high ${fixed(span.high, 8)} | period low ${fixed(span.low, 8)} | range ${fixed(span.high - span.low, 8)} (${(((span.high - span.low) / span.low) * 100).toFixed(2)}% of the low)`);
  lines.push(`  last close ${fixed(last.close, 8)}, ${fixed(((last.close - first.open) / first.open) * 100, 4)}% against the first open of ${fixed(first.open, 8)}`);
  lines.push(`  bars closing up ${rising}, closing down ${falling}, unchanged ${bars.length - 1 - rising - falling}`);
  const totalBase = bars.reduce((acc, b) => acc + b.base, 0);
  const totalQuote = bars.reduce((acc, b) => acc + b.quote, 0);
  lines.push(`  traded across these bars: ${fixed(totalBase, 8)} of the base asset, ${fixed(totalQuote, 4)} of quote`);
  const busiest = [...bars].sort((a, b) => b.quote - a.quote)[0];
  lines.push(`  busiest bar ${stamp(Number(busiest.ts))} at ${fixed(busiest.quote, 4)} of quote, ${((busiest.quote / totalQuote) * 100).toFixed(1)}% of the total`);
  const show = bars.slice(-Math.min(10, bars.length)).reverse();
  lines.push(`  the last ${show.length} bar(s), newest first:`);
  lines.push(`    ${"open".padEnd(15)}${"high".padEnd(15)}${"low".padEnd(15)}${"close".padEnd(15)}volume`);
  for (const b of show) {
    const move = b.open ? (((b.close - b.open) / b.open) * 100).toFixed(2) : '?';
    lines.push(`    ${fixed(b.open, 8).padEnd(15)}${fixed(b.high, 8).padEnd(15)}${fixed(b.low, 8).padEnd(15)}${fixed(b.close, 8).padEnd(15)}${fixed(b.base, 6).padEnd(12)} (${move}%)`);
  }
  lines.push(`  source timestamp ${stamp(requestTime)}, which is when Bitget answered rather than when the last bar closed.`);
  return lines.join('\n');
}

export interface ContractTickerArgs {
  symbol: string;
  productType?: string;
}

