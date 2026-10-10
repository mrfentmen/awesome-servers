const UA = 'mrfentmen-upbit-mcp/1.0';

export interface TickerArgs {
  market: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const market = (args.market ?? '').trim().toUpperCase();
  if (!market) return 'Provide a market like KRW-BTC.';
  const url = `https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(market)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Upbit returned ${res.status}`);
  const d = (await res.json()) as Array<{ market?: string; trade_price?: number; opening_price?: number; high_price?: number; low_price?: number; acc_trade_price_24h?: number; signed_change_rate?: number }>;
  const t = d?.[0];
  if (!t) return `No ticker for ${market}.`;
  return [
    `Upbit ${t.market ?? market}:`,
    `Price: ${t.trade_price} KRW | Open: ${t.opening_price} | High: ${t.high_price} | Low: ${t.low_price}`,
    `24h change: ${t.signed_change_rate != null ? (t.signed_change_rate * 100).toFixed(2) : '?'}% | 24h volume: ${t.acc_trade_price_24h != null ? (t.acc_trade_price_24h / 1e6).toFixed(1) : '?'}M KRW`,
  ].filter(Boolean).join('\n');
}

// ---- muxF tools:
const UPBIT = "https://api.upbit.com/v1"

interface MarketRow {
  market?: string
  korean_name?: string
  english_name?: string
}

interface BookUnit {
  bid_price?: number
  bid_size?: number
  ask_price?: number
  ask_size?: number
}

interface BookRow {
  market?: string
  timestamp?: number
  total_ask_size?: number
  total_bid_size?: number
  orderbook_units?: BookUnit[]
  level?: number
}

interface CandleRow {
  market?: string
  candle_date_time_utc?: string
  candle_date_time_kst?: string
  opening_price?: number
  high_price?: number
  low_price?: number
  trade_price?: number
  timestamp?: number
  candle_acc_trade_price?: number
  candle_acc_trade_volume?: number
  unit?: number
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

async function upbit<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params)
  const res = await fetch(`${UPBIT}/${path}?${qs}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Upbit returned ${res.status}`)
  return (await res.json()) as T
}

/** The whole Upbit market list as a census: how many markets, the quote currency split and where an asset trades. */
export async function marketCensus(args: { asset?: string; limit?: number }) {
  const limit = bound(args.limit, 1, 20, 10)
  const rows = await upbit<MarketRow[]>('market/all', {})
  if (!rows.length) throw new Error('Upbit returned no markets.')
  const quotes = new Map<string, number>()
  const bases = new Map<string, number>()
  for (const m of rows) {
    const [quote, base] = String(m.market ?? '').split('-')
    if (quote) quotes.set(quote, (quotes.get(quote) ?? 0) + 1)
    if (base) bases.set(base, (bases.get(base) ?? 0) + 1)
  }
  const asset = (args.asset ?? '').trim().toUpperCase()
  if (asset) {
    const where = rows.filter((m) => String(m.market ?? '').split('-')[1] === asset || String(m.market ?? '').split('-')[0] === asset)
    if (!where.length) return `No Upbit market quotes or is quoted in ${asset}. Quote currencies in the list: ${[...quotes.keys()].sort().join(', ')}.`
    return [
      `Upbit markets for ${asset}: ${where.length}`,
      ...where.slice(0, limit).map((m) => `- ${m.market}: ${m.english_name ?? 'english name not reported'} / ${m.korean_name ?? 'korean name not reported'}`),
      where.length > limit ? `... and ${where.length - limit} more pair(s).` : '',
      `That asset trades in ${new Set(where.map((m) => String(m.market).split('-')[0])).size} quote currency/currencies.`,
    ].filter(Boolean).join('\n')
  }
  const topBases = [...bases.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  return [
    `Upbit market census: ${rows.length} markets`,
    `Quote currencies (${quotes.size}): ${[...quotes.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`,
    `Distinct base assets: ${bases.size}`,
    `Assets listed in the most markets: ${topBases.map(([k, n]) => `${k} (${n})`).join(', ')}`,
    `Newest listings, by the order Upbit returns them: ${rows.slice(0, limit).map((m) => `${m.market} ${m.english_name ?? 'name not reported'}`).join('; ')}`,
    'Upbit returns the market list in its own order, which is not alphabetical and not a popularity ranking.',
  ].join('\n')
}

