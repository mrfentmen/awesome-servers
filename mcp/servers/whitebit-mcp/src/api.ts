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

export interface BookArgs {
  market: string;
  depth?: number;
}

export interface TradesArgs {
  market: string;
  limit?: number;
}

// ---- gap4d3 tools:

async function whitebitPublic<T>(path: string): Promise<T> {
  const res = await fetch(`https://whitebit.com/api/v4/public/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`WhiteBIT returned ${res.status}`)
  return await res.json() as T
}

export async function marketRules(args: { market?: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 40))
  const market = args.market?.trim().toUpperCase()
  const all = await whitebitPublic<Array<{ name?: string; stock?: string; money?: string; type?: string; minAmount?: string; minTotal?: string; tickSize?: string; stepSize?: string; tradesEnabled?: boolean }>>('markets')
  const rows = all.filter(r => !market || r.name === market).slice(0, limit)
  if (!rows.length) return 'No matching WhiteBIT markets.'
  return 'WhiteBIT market trading rules:\n' + rows.map(r => `${r.name ?? 'not reported'} | type ${r.type ?? 'not reported'} | trading ${r.tradesEnabled ?? 'not reported'} | minimum amount ${r.minAmount ?? 'not reported'} ${r.stock ?? ''} | minimum total ${r.minTotal ?? 'not reported'} ${r.money ?? ''} | tick ${r.tickSize ?? 'not reported'} | step ${r.stepSize ?? 'not reported'}`).join('\n')
}

