const BASE = 'https://www.deribit.com/api/v2';
const UA = 'mrfentmen-deribit-mcp/1.0 (https://github.com/mrfentmen)';
export class DeribitError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new DeribitError(`Deribit returned ${res.status}`);
  return (await res.json()) as T;
}

export async function indexPrice(args: { index?: string }): Promise<string> {
  const index = (args.index ?? 'btc_usd').toLowerCase();
  const d = await get<{ result?: { estimated_delivery_price?: number; index_price?: number } }>(`${BASE}/public/get_index_price?index_name=${encodeURIComponent(index)}`);
  const r = d.result ?? {};
  return `Deribit ${index}: ${r.index_price ?? '?'} (estimated delivery ${r.estimated_delivery_price ?? '?'})`;
}

export async function ticker(args: { instrument?: string }): Promise<string> {
  const instrument = (args.instrument ?? 'BTC-PERPETUAL').toUpperCase();
  const d = await get<{ result?: { instrument_name?: string; last_price?: number; mark_price?: number; index_price?: number; funding_8h?: number; open_interest?: number; volume?: number; best_bid_price?: number; best_ask_price?: number; timestamp?: number } }>(`${BASE}/public/ticker?instrument_name=${encodeURIComponent(instrument)}`);
  const r = d.result ?? {};
  return [
    `${r.instrument_name ?? instrument}`,
    `Last: ${r.last_price ?? '?'} | Mark: ${r.mark_price ?? '?'} | Index: ${r.index_price ?? '?'}`,
    `Best bid: ${r.best_bid_price ?? '?'} | Best ask: ${r.best_ask_price ?? '?'}`,
    `Funding 8h: ${r.funding_8h ?? '?'} | Open interest: ${r.open_interest ?? '?'} | Volume: ${r.volume ?? '?'}`,
  ].join('\n');
}

export async function supported(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ result?: Array<{ index_name?: string }> }>(`${BASE}/public/get_supported_index_names`);
  const names = (d.result ?? []).map((i) => i.index_name ?? '?');
  return `Deribit supported indexes (${names.length}):\n${names.join(', ')}`;
}

export async function book(args: { instrument?: string; depth?: number }): Promise<string> {
  const instrument = (args.instrument ?? 'BTC-PERPETUAL').toUpperCase();
  const depth = Math.min(Math.max(args.depth ?? 5, 1), 20);
  const d = await get<{ result?: { bids?: number[][]; asks?: number[][]; state?: string } }>(
    `${BASE}/public/get_order_book?instrument_name=${encodeURIComponent(instrument)}&depth=${depth}`);
  const r = d.result ?? {};
  const fmt = (rows: number[][] | undefined) => (rows ?? []).map((x) => `${x[0]} x ${x[1]}`).join(', ');
  return `Deribit ${instrument} book (${r.state ?? 'n/a'}):\nBids: ${fmt(r.bids)}\nAsks: ${fmt(r.asks)}`;
}

export async function instruments(args: { currency?: string; kind?: string }): Promise<string> {
  const currency = (args.currency ?? 'BTC').toUpperCase();
  const kind = (args.kind ?? 'future').toLowerCase();
  const d = await get<{ result?: { instrument_name?: string; expiration_timestamp?: number }[] }>(
    `${BASE}/public/get_instruments?currency=${encodeURIComponent(currency)}&kind=${encodeURIComponent(kind)}&expired=false`);
  const list = d.result ?? [];
  const sample = list.slice(0, 10).map((i) => i.instrument_name).join(', ');
  return `Deribit ${currency} ${kind} instruments: ${list.length}. Sample: ${sample}. Full list omitted for size.`;
}

export async function trades(args: { instrument?: string; count?: number }): Promise<string> {
  const instrument = (args.instrument ?? 'BTC-PERPETUAL').toUpperCase();
  const count = Math.min(Math.max(args.count ?? 5, 1), 20);
  const d = await get<{ result?: { trades?: { price?: number; amount?: number; direction?: string; timestamp?: number }[] } }>(
    `${BASE}/public/get_last_trades_by_instrument?instrument_name=${encodeURIComponent(instrument)}&count=${count}`);
  const rows = d.result?.trades ?? [];
  if (!rows.length) return `No recent trades for ${instrument}.`;
  return `Deribit ${instrument} last ${rows.length} trades:\n` + rows.map((t) => {
    const time = t.timestamp ? new Date(t.timestamp).toISOString().slice(11, 19) : '?';
    return `${time} ${t.direction ?? '?'} ${t.amount ?? '?'} @ ${t.price ?? '?'}`;
  }).join('\n');
}

export async function summary(args: { currency?: string }): Promise<string> {
  const currency = (args.currency ?? 'BTC').toUpperCase();
  const d = await get<{ result?: { instrument_name?: string; last?: number; mark_price?: number; open_interest?: number; volume?: number }[] }>(
    `${BASE}/public/get_book_summary_by_currency?currency=${encodeURIComponent(currency)}&kind=future`);
  const rows = d.result ?? [];
  if (!rows.length) return `No futures for ${currency}.`;
  return `Deribit ${currency} futures (${rows.length}):\n` + rows.slice(0, 10).map((r) =>
    `${r.instrument_name}: last ${r.last ?? '?'} mark ${r.mark_price ?? '?'} OI ${r.open_interest ?? '?'}`).join('\n');
}
// ---- batch-3 tools: extra live market data (2026-09-27) ----
export async function fundingRateHistory(args: { instrument?: string; hours?: number }): Promise<string> {
  const instrument = (args.instrument ?? 'BTC-PERPETUAL').toUpperCase();
  const hours = Math.min(Math.max(Math.floor(args.hours ?? 168), 8), 720);
  const end = Date.now();
  const start = end - hours * 3_600_000;
  const d = await get<{ result?: { timestamp?: number; interest_8h?: number; interest_1h?: number; index_price?: number }[] }>(
    `${BASE}/public/get_funding_rate_history?instrument_name=${encodeURIComponent(instrument)}&start_timestamp=${start}&end_timestamp=${end}`);
  const rows = (d.result ?? []).slice().sort((a, b) => Number(a.timestamp ?? 0) - Number(b.timestamp ?? 0));
  if (!rows.length) return `No funding history for ${instrument} in the last ${hours}h.`;
  // Deribit charges funding every 8 hours, so interest_8h is one charge's rate.
  const rates = rows.map((r) => Number(r.interest_8h ?? 0));
  const pct = (n: number) => `${(n * 100).toFixed(4)}%`;
  const avg = rates.reduce((s, n) => s + n, 0) / rates.length;
  const last = rates[rates.length - 1];
  const lastAt = rows[rows.length - 1].timestamp
    ? `${new Date(Number(rows[rows.length - 1].timestamp)).toISOString().replace('T', ' ').slice(0, 16)} UTC`
    : '?';
  return [
    `Deribit ${instrument} funding over the last ${hours}h (${rows.length} 8h points):`,
    `Latest rate: ${pct(last)} at ${lastAt} | average: ${pct(avg)}`,
    `Range: ${pct(Math.min(...rates))} to ${pct(Math.max(...rates))}`,
    `Annualised latest: ${(last * 3 * 365 * 100).toFixed(1)}% (a positive rate means longs pay shorts)`,
  ].join('\n');
}

export async function historicalVolatility(args: { currency?: string }): Promise<string> {
  const currency = (args.currency ?? 'BTC').toUpperCase();
  const d = await get<{ result?: [number, number][] }>(`${BASE}/public/get_historical_volatility?currency=${encodeURIComponent(currency)}`);
  const rows = d.result ?? [];
  if (!rows.length) return `Deribit published no volatility series for ${currency}.`;
  const day = (ts: number) => new Date(ts).toISOString().slice(0, 10);
  const vols = rows.map(([, v]) => Number(v));
  const latest = vols[vols.length - 1];
  const week = vols.slice(-7);
  const avg = vols.reduce((s, n) => s + n, 0) / vols.length;
  const weekAvg = week.reduce((s, n) => s + n, 0) / week.length;
  return [
    `Deribit ${currency} historical volatility (${rows.length} daily points, ${day(rows[0][0])} to ${day(rows[rows.length - 1][0])}):`,
    `Latest: ${latest.toFixed(2)}% | 7-day average: ${weekAvg.toFixed(2)}% | series average: ${avg.toFixed(2)}%`,
    `Range: ${Math.min(...vols).toFixed(2)}% to ${Math.max(...vols).toFixed(2)}%`,
  ].join('\n');
}

export async function optionsSummary(args: { currency?: string; limit?: number }): Promise<string> {
  const currency = (args.currency ?? 'BTC').toUpperCase();
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 25);
  const d = await get<{ result?: { instrument_name?: string; mark_price?: number; open_interest?: number; volume?: number; bid_price?: number; ask_price?: number; underlying_price?: number }[] }>(
    `${BASE}/public/get_book_summary_by_currency?currency=${encodeURIComponent(currency)}&kind=option`);
  const rows = d.result ?? [];
  if (!rows.length) return `No listed options for ${currency}.`;
  const totalOi = rows.reduce((s, r) => s + Number(r.open_interest ?? 0), 0);
  const calls = rows.filter((r) => (r.instrument_name ?? '').endsWith('-C')).length;
  const puts = rows.filter((r) => (r.instrument_name ?? '').endsWith('-P')).length;
  const expiries = [...new Set(rows.map((r) => (r.instrument_name ?? '').split('-')[1] ?? ''))].filter(Boolean);
  const top = [...rows].sort((a, b) => Number(b.open_interest ?? 0) - Number(a.open_interest ?? 0)).slice(0, limit);
  return [
    `Deribit ${currency} options: ${rows.length} instruments (${calls} calls, ${puts} puts) across ${expiries.length} expiries: ${expiries.slice(0, 8).join(', ')}`,
    `Total open interest: ${totalOi.toFixed(2)} ${currency}`,
    `Top ${top.length} by open interest:`,
    ...top.map((r) => `  ${r.instrument_name}: OI ${r.open_interest ?? '?'} | mark ${r.mark_price ?? '?'} | bid/ask ${r.bid_price ?? '?'}/${r.ask_price ?? '?'}`),
  ].join('\n');
}

export async function currencies(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ result?: { currency?: string; coin_type?: string; decimals?: number; min_withdrawal_fee?: number }[] }>(
    `${BASE}/public/get_currencies`);
  const rows = d.result ?? [];
  const codes = rows.map((r) => r.currency ?? '').filter(Boolean);
  if (!codes.length) return 'Deribit returned no currencies.';
  const typeCount = new Set(rows.map((r) => r.coin_type ?? '')).size;
  return `Deribit lists ${codes.length} currencies across ${typeCount} coin types:\n${codes.slice(0, 80).join(', ')}${codes.length > 80 ? ` ... (+${codes.length - 80} more)` : ''}`;
}

// ---- muxD tools:

interface BookSummary {
  instrument_name?: string
  high?: number
  low?: number
  last?: number
  bid_price?: number
  ask_price?: number
  mark_price?: number
  index_price?: number
  open_interest?: number
  volume?: number
  volume_usd?: number
  volume_notional?: number
  funding_8h?: number
  price_change?: number
  estimated_delivery_price?: number
  underlying_price?: number
  underlying_index?: string
  mark_iv?: number
  base_currency?: string
  quote_currency?: string
  mid_price?: number
  creation_timestamp?: number
  stats?: { volume?: number; price_change?: number }
}

const dbNum = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

const dbUsd = (n: number): string => {
  if (!Number.isFinite(n)) return 'n/a'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export interface FuturesOiArgs {
  currency: string
  kind?: string
  limit?: number
}

/**
 * points is how many buckets to request, so the lookback is derived from the period
 * length. Deriving it from a separate cap instead is how a "7d" request ends up
 * silently asking for ten days.
 */
const DVOL_PERIODS: Record<string, { resolution: number; points: number; label: string }> = {
  '1d': { resolution: 3600, points: 24, label: 'the last day, hourly' },
  '7d': { resolution: 3600, points: 168, label: 'the last week, hourly' },
  '30d': { resolution: 4 * 3600, points: 180, label: 'the last 30 days, 4-hourly' },
  '90d': { resolution: 12 * 3600, points: 180, label: 'the last 90 days, 12-hourly' },
  '1y': { resolution: 24 * 3600, points: 365, label: 'the last year, daily' },
}

/** Deribit publishes DVOL for BTC and ETH only, and answers anything else with a 400. */
const DVOL_CURRENCIES = ['BTC', 'ETH']

export interface ImpliedVolArgs {
  currency: string
  period?: string
}

export interface OptionsPositioningArgs {
  currency: string
  limit?: number
}

/** Where option open interest sits by strike and expiry, and the put-call imbalance that comes with it. */
export async function optionsPositioning(args: OptionsPositioningArgs): Promise<string> {
  const currency = String(args.currency ?? '').trim().toUpperCase()
  if (!currency) throw new DeribitError('Provide a currency, for example BTC or ETH.')
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 8), 1), 30)

  const d = await get<{ result?: BookSummary[] }>(
    `${BASE}/public/get_book_summary_by_currency?currency=${encodeURIComponent(currency)}&kind=option`,
  )
  const rows = (d.result ?? []).filter((r) => Number.isFinite(dbNum(r.open_interest)) && dbNum(r.open_interest) > 0)
  if (!rows.length) return `Deribit reports no option open interest for ${currency} right now.`

  // Instrument names are CURRENCY-EXPIRY-STRIKE-C|P.
  const parsed = rows.map((r) => {
    const parts = String(r.instrument_name ?? '').split('-')
    return {
      raw: r,
      name: String(r.instrument_name ?? '?'),
      expiry: parts[1] ?? '?',
      strike: dbNum(parts[2]),
      kind: parts[3] === 'C' ? 'call' : parts[3] === 'P' ? 'put' : '?',
      oi: dbNum(r.open_interest),
      mark: dbNum(r.mark_price),
      // Option rows carry underlying_price; the futures rows carry index_price instead.
      index: dbNum(r.underlying_price ?? r.index_price),
    }
  })
  const calls = parsed.filter((p) => p.kind === 'call')
  const puts = parsed.filter((p) => p.kind === 'put')
  const callOi = calls.reduce((s, p) => s + p.oi, 0)
  const putOi = puts.reduce((s, p) => s + p.oi, 0)
  const totalOi = callOi + putOi
  const pcr = callOi > 0 ? putOi / callOi : NaN

  // Max pain proxy: the strike where total OI of calls above plus puts below is smallest.
  const strikes = [...new Set(parsed.map((p) => p.strike))].filter((s) => Number.isFinite(s) && s > 0).sort((a, b) => a - b)
  /*
   * Max pain is the settlement price at which total intrinsic payout to option
   * holders is smallest. Counting worthless contracts instead is degenerate: the
   * minimum of that count always lands on the highest or lowest strike, because
   * far from the money one whole side is worthless. So compute the payout.
   */
  let maxPain: { strike: number; payout: number; worthless: number } | null = null
  if (strikes.length) {
    for (const k of strikes) {
      // At settlement spot = k a put struck above k pays (strike - k) and a call
      // struck below k pays (k - strike). Both are positive by construction.
      let payout = 0
      for (const p of puts) if (p.strike > k) payout += (p.strike - k) * p.oi
      for (const c of calls) if (c.strike < k) payout += (k - c.strike) * c.oi
      const worthless = calls.filter((c) => c.strike > k).reduce((s, c) => s + c.oi, 0) + puts.filter((p) => p.strike < k).reduce((s, p) => s + p.oi, 0)
      if (!maxPain || payout < maxPain.payout) maxPain = { strike: k, payout, worthless }
    }
  }

  const byExpiry = new Map<string, { oi: number; n: number }>()
  for (const p of parsed) {
    const e = byExpiry.get(p.expiry) ?? { oi: 0, n: 0 }
    e.oi += p.oi
    e.n += 1
    byExpiry.set(p.expiry, e)
  }
  const expiries = [...byExpiry.entries()].sort((a, b) => b[1].oi - a[1].oi)
  const underlying = dbNum(parsed[0].index)
  const top = [...parsed].sort((a, b) => b.oi - a.oi).slice(0, limit)

  const lines = [
    `${currency} option positioning: ${parsed.length} instrument(s) with open interest, ${totalOi.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${currency} of contracts (option open interest is denominated in the base currency, unlike futures which is USD notional)`,
    `Calls ${callOi.toLocaleString(undefined, { maximumFractionDigits: 1 })} vs puts ${putOi.toLocaleString(undefined, { maximumFractionDigits: 1 })}, a put-call ratio of ${Number.isFinite(pcr) ? pcr.toFixed(3) : 'n/a'}`,
    Number.isFinite(pcr)
      ? pcr > 1.2
        ? '  Puts dominate open interest, which is usually read as hedging or downside positioning rather than a directional bet.'
        : pcr < 0.8
          ? '  Calls dominate open interest, which is usually read as upside positioning or call-driven buying.'
          : '  Put and call interest are close to balanced.'
      : '',
    underlying ? `Underlying index price ${underlying.toLocaleString()}.` : '',
    '',
    `Open interest by expiry (${expiries.length} expiry date(s)):`,
    ...expiries.slice(0, 10).map(([e, v]) => `  ${e.padEnd(12)} ${v.oi.toLocaleString(undefined, { maximumFractionDigits: 1 }).padStart(14)}  ${v.n} instrument(s)  ${((v.oi / totalOi) * 100).toFixed(1)}% of OI`),
    maxPain
      ? `\nMax-pain estimate: ${maxPain.strike.toLocaleString()}, the settlement price with the smallest total intrinsic payout (${maxPain.payout.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency} across all strikes, and ${maxPain.worthless.toLocaleString(undefined, { maximumFractionDigits: 1 })} contracts expiring worthless). Underlying is ${underlying ? underlying.toLocaleString() : '?'}, so this sits ${underlying ? `${(((maxPain.strike - underlying) / underlying) * 100).toFixed(1)}%` : '?'} away from spot. It is a mechanical estimate from open interest alone, not a forecast.`
      : '',
    `\nLargest single positions:`,
    `${"instrument".padEnd(26)}${"open interest".padStart(16)}${"moneyness".padStart(13)}`,
    ...top.map((p) => {
      const mny = p.strike > 0 && p.index > 0 ? `${(((p.strike - p.index) / p.index) * 100).toFixed(1)}%` : '?'
      return `${p.name.slice(0, 26).padEnd(26)}${p.oi.toLocaleString(undefined, { maximumFractionDigits: 1 }).padStart(16)}${mny.padStart(13)}`
    }),
    '',
    'Moneyness is strike against the underlying index price, so a positive number is an out-of-the-money call and a negative one an out-of-the-money put. Open interest shows where contracts were placed, not which way those holders expect price to move.',
  ].filter((l) => l !== '')
  return lines.join('\n')
}
