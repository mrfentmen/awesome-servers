const BASE = 'https://api.poloniex.com';

export interface TickerArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a market like BTC_USDT.';
  const res = await fetch(`${BASE}/markets/${encodeURIComponent(symbol)}/price`, {
    headers: { 'User-Agent': 'mrfentmen-poloniex-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Poloniex returned ${res.status}`);
  const d = (await res.json()) as { symbol?: string; price?: string };
  return `Poloniex ${d.symbol ?? symbol}: ${d.price ?? 'n/a'}`;
}

export async function markets(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/markets`, {
    headers: { 'User-Agent': 'mrfentmen-poloniex-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Poloniex returned ${res.status}`);
  const d = (await res.json()) as Array<{ symbol?: string; baseCurrency?: string; quoteCurrency?: string }>;
  if (!Array.isArray(d) || !d.length) return 'No markets returned.';
  return `Poloniex markets (${d.length}):\n` +
    d.slice(0, 30).map((m, i) => `${i + 1}. ${m.symbol ?? '?'} (${m.baseCurrency ?? ''}/${m.quoteCurrency ?? ''})`).join('\n');
}

// ---- muxB tools:

export interface PriceCandlesArgs {
  symbol: string;
  interval?: string;
  limit?: number;
}

export interface OrderBookArgs {
  symbol: string;
  depth_group?: number;
  depth?: number;
}

