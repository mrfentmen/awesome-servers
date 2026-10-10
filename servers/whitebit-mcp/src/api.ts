const UA = 'mrfentmen-whitebit-mcp/1.0';

export interface TickerArgs {
  market: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const market = (args.market ?? '').trim().toUpperCase();
  if (!market) return 'Provide a market like BTC_USDT.';
  const res = await fetch('https://whitebit.com/api/v4/public/ticker', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`WhiteBIT returned ${res.status}`);
  const d = (await res.json()) as Record<string, { last_price?: string; bid?: string; ask?: string; high?: string; low?: string; volume?: string; change?: string; quote_volume?: string; isFrozen?: boolean }>;
  const t = d[market];
  if (!t) throw new Error(`WhiteBIT: no ticker for ${market}`);
  return [
    `WhiteBIT ${market}:`,
    `Last: ${t.last_price ?? '?'} | Bid: ${t.bid ?? '?'} | Ask: ${t.ask ?? '?'}`,
    `High: ${t.high ?? '?'} | Low: ${t.low ?? '?'} | 24h change: ${t.change ?? '?'}% | Volume: ${t.volume ?? t.quote_volume ?? '?'}${t.isFrozen ? ' (frozen)' : ''}`,
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:
const BOOK_URL = 'https://whitebit.com/api/v4/public/orderbook';
const TRADES_URL = 'https://whitebit.com/api/v4/public/trades';

export interface BookArgs {
  market: string;
  depth?: number;
}

export interface TradesArgs {
  market: string;
  limit?: number;
}

function marketOf(value: string | undefined): string {
  const market = (value ?? '').trim().toUpperCase();
  if (!market) throw new Error('Provide a market like BTC_USDT.');
  return market;
}

export async function orderBook(args: BookArgs): Promise<string> {
  const market = marketOf(args.market);
  const depth = Math.max(1, Math.min(Number(args.depth ?? 5) || 5, 50));
  const res = await fetch(`${BOOK_URL}/${encodeURIComponent(market)}?limit=${depth}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`WhiteBIT returned ${res.status}`);
  const d = (await res.json()) as {
    timestamp?: number;
    asks?: Array<[string, string]>;
    bids?: Array<[string, string]>;
  };
  const asks = (d.asks ?? []).slice(0, depth);
  const bids = (d.bids ?? []).slice(0, depth);
  if (!asks.length && !bids.length) return `WhiteBIT ${market}: order book is empty.`;
  const side = (rows: Array<[string, string]>) =>
    rows.map(([p, s]) => `  ${p} @ ${s}`).join('\n') || '  none reported';
  return [
    `WhiteBIT ${market} order book (top ${asks.length} asks / ${bids.length} bids, book time ${d.timestamp ?? 'not reported'}):`,
    `Asks:\n${side(asks)}`,
    `Bids:\n${side(bids)}`,
  ].join('\n');
}

export async function recentTrades(args: TradesArgs): Promise<string> {
  const market = marketOf(args.market);
  const limit = Math.max(1, Math.min(Number(args.limit ?? 10) || 10, 50));
  const res = await fetch(`${TRADES_URL}/${encodeURIComponent(market)}?limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`WhiteBIT returned ${res.status}`);
  const rows = (await res.json()) as Array<{
    price?: string;
    base_volume?: string;
    quote_volume?: string;
    trade_timestamp?: number;
    type?: string;
  }>;
  if (!Array.isArray(rows) || !rows.length) return `WhiteBIT ${market}: no recent trades reported.`;
  const shown = rows.slice(0, limit);
  return `WhiteBIT ${market} recent trades (${shown.length} shown, price / base_volume / quote_volume fields as sent by WhiteBIT):\n` +
    shown
      .map((t, i) => `${i + 1}. ${t.type ?? '?'} ${t.price ?? '?'} | ${t.base_volume ?? '?'} | ${t.quote_volume ?? '?'} | ts ${t.trade_timestamp ?? '?'}`)
      .join('\n');
}
