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
