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
