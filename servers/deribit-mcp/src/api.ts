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
