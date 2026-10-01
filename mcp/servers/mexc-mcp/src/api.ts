const BASE = 'https://api.mexc.com/api/v3';

export interface TickerArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a trading pair like BTCUSDT.';
  const res = await fetch(`${BASE}/ticker/price?symbol=${encodeURIComponent(symbol)}`, {
    headers: { 'User-Agent': 'mrfentmen-mexc-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`MEXC returned ${res.status}`);
  const data = (await res.json()) as { symbol?: string; price?: string };
  if (!data.price) return `No price found for ${symbol}.`;
  return `${data.symbol ?? symbol} price on MEXC: ${data.price}`;
}

// ---- muxB tools:

const MEXC_INTERVALS: Record<string, string> = {
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '4h': '4 hours',
  '1d': '1 day',
  '1w': '1 week',
  '1M': '1 month',
};

const mexcGet = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-mexc-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 429) throw new Error('MEXC rate limit hit, wait and retry');
  if (!res.ok) throw new Error(`MEXC returned ${res.status}`);
  return (await res.json()) as T;
};

const mexcNum = (value: unknown): string => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 8 }) : 'not reported';
};

const mexcSym = (args: { symbol?: string }): string => {
  const s = (args.symbol ?? '').trim().toUpperCase();
  if (!s) throw new Error('Provide a trading pair like BTCUSDT.');
  return s;
};

export interface Stats24hArgs {
  symbol: string;
}

export interface CandlesArgs {
  symbol: string;
  interval?: string;
  limit?: number;
}

export interface OrderBookArgs {
  symbol: string;
  limit?: number;
}

export async function orderBook(args: OrderBookArgs): Promise<string> {
  const symbol = mexcSym(args);
  const limit = Math.max(1, Math.min(Number(args.limit ?? 5) || 5, 100));
  const d = await mexcGet<{ lastUpdateId?: number; timestamp?: number; bids?: Array<[string, string]>; asks?: Array<[string, string]> }>(
    `/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
  );
  const bids = Array.isArray(d?.bids) ? d.bids : [];
  const asks = Array.isArray(d?.asks) ? d.asks : [];
  if (!bids.length && !asks.length) return `No order book returned for ${symbol}.`;
  const stamp = d?.timestamp ? new Date(Number(d.timestamp)).toISOString().slice(0, 19).replace('T', ' ') + ' UTC' : 'not reported';
  const side = (label: string, rows: Array<[string, string]>) =>
    rows.length ? `   ${label}:\n${rows.slice(0, limit).map((r, i) => `      ${i + 1}. ${mexcNum(r[0])} x ${mexcNum(r[1])}`).join('\n')}` : `   ${label}: none returned`;
  return [`${symbol} order book (${stamp}, update id ${d?.lastUpdateId ?? 'not reported'}):`, side('bids', bids), side('asks', asks)].join('\n');
}
