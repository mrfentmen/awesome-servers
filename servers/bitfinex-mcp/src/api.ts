const BASE = 'https://api-pub.bitfinex.com/v2';

export interface TickerArgs {
  symbol: string;
}

export interface PriceArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  let symbol = (args.symbol ?? '').trim();
  if (!symbol) return 'Provide a symbol like tBTCUSD.';
  if (!symbol.startsWith('t')) symbol = 't' + symbol;
  const res = await fetch(`${BASE}/ticker/${encodeURIComponent(symbol)}`, {
    headers: { 'User-Agent': 'mrfentmen-bitfinex-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bitfinex returned ${res.status}`);
  const d = (await res.json()) as number[];
  if (!Array.isArray(d) || d.length < 10) return `No ticker for ${symbol}.`;
  const last = d[6];
  const high = d[8];
  const low = d[9];
  const vol = d[7];
  return [
    `Bitfinex ${symbol}:`,
    `Last: ${String(last ?? '?')}`,
    `24h: high ${String(high ?? '?')} low ${String(low ?? '?')}`,
    `Volume: ${String(vol ?? '?')}`,
  ].filter(Boolean).join('\n');
}

export async function price(args: PriceArgs): Promise<string> {
  let symbol = (args.symbol ?? '').trim();
  if (!symbol) return 'Provide a symbol like tBTCUSD.';
  if (!symbol.startsWith('t')) symbol = 't' + symbol;
  const res = await fetch(`${BASE}/ticker/${encodeURIComponent(symbol)}`, {
    headers: { 'User-Agent': 'mrfentmen-bitfinex-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bitfinex returned ${res.status}`);
  const d = (await res.json()) as number[];
  if (!Array.isArray(d) || d.length < 7) return `No price for ${symbol}.`;
  return `Bitfinex ${symbol}: ${d[6]}`;
}

// ---- muxA tools:

function normalise(symbol: string): string {
  const s = (symbol ?? '').trim()
  if (!s) throw new Error('Provide a symbol like tBTCUSD.')
  return s.startsWith('t') ? s : `t${s}`
}

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max))
}

export interface CandleArgs {
  symbol: string
  period?: string
  limit?: number
}

export interface TradesArgs {
  symbol: string
  limit?: number
}

export async function recentTrades(args: TradesArgs): Promise<string> {
  const symbol = normalise(args.symbol)
  const limit = bound(args.limit, 15, 100)
  const res = await fetch(`${BASE}/trades/${encodeURIComponent(symbol)}/hist?limit=${limit}&sort=-1`, {
    headers: { 'User-Agent': 'mrfentmen-bitfinex-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Bitfinex returned ${res.status} for ${symbol}`)
  const rows = (await res.json()) as number[][]
  if (!Array.isArray(rows) || !rows.length) return `Bitfinex returned no recent trades for ${symbol}.`
  // [ID, MTS, AMOUNT, PRICE], a positive amount is a buy and negative a sell
  const buys = rows.filter((r) => Number(r[2]) > 0).length
  const prices = rows.map((r) => Number(r[3]))
  return [
    `${rows.length} most recent trade(s) on ${symbol}, newest first.`,
    `Buys ${buys}, sells ${rows.length - buys} | price range ${Math.min(...prices)} to ${Math.max(...prices)}`,
    ...rows.map((r, i) => {
      const amount = Number(r[2])
      const when = new Date(Number(r[1])).toISOString().slice(0, 19).replace('T', ' ')
      return `${i + 1}. ${when} | ${amount > 0 ? 'BUY' : 'SELL'} ${Math.abs(amount)} @ ${r[3]} | trade id ${r[0]}`
    }),
  ].join('\n')
}

export interface BookArgs {
  symbol: string
  levels?: number
}

