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
