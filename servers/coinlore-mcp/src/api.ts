const BASE = 'https://api.coinlore.net/api';
const UA = 'mrfentmen-coinlore-mcp/1.0 (https://github.com/mrfentmen)';
export class CoinloreError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (res.status === 429) throw new CoinloreError('CoinLore rate limit hit, wait and retry');
  if (!res.ok) throw new CoinloreError(`CoinLore error ${res.status}`);
  return (await res.json()) as T;
}

export async function tickers(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const d = await get<{ data?: Array<Record<string, unknown>> }>(`${BASE}/tickers/?limit=${limit}`);
  const rows = d.data ?? [];
  if (!rows.length) return 'No coins returned.';
  return `Top coins (${rows.length} shown):\n` + rows.map((c, i) => {
    const s = (k: string) => (c[k] != null ? String(c[k]) : '?');
    return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')}\n   $${s('price_usd')} | 24h ${s('percent_change_24h')}% | mcap $${s('market_cap_usd')} | supply ${s('csupply')}`;
  }).join('\n');
}

export async function coin(args: { id?: number }): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) throw new CoinloreError('Provide a coin id');
  const d = await get<any[]>(`${BASE}/ticker/?id=${id}`);
  const c = d[0];
  if (!c) throw new CoinloreError('Coin not found');
  return [
    `${c.name ?? ''} (${c.symbol ?? ''}) #${c.rank ?? '?'}`,
    `Price: $${c.price_usd ?? '?'} | BTC ${c.price_btc ?? '?'}`,
    `24h change: ${c.percent_change_24h ?? '?'}% | 7d: ${c.percent_change_7d ?? '?'}%`,
    `Market cap: $${c.market_cap_usd ?? '?'}`,
    `Volume 24h: $${c.volume24 ?? '?'}`,
    `Supply: ${c.csupply ?? '?'} (total ${c.tsupply ?? '?'})`,
  ].join('\n');
}

export async function globalStats(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Array<Record<string, unknown>>>(`${BASE}/global/`);
  const g = d[0] ?? {};
  return [
    `Coins: ${String(g.coins_count ?? '?')}`,
    `Active markets: ${String(g.active_markets ?? '?')}`,
    `Total market cap: $${String(g.total_mcap ?? '?')}`,
    `Total volume: $${String(g.total_volume ?? '?')}`,
    `BTC dominance: ${String(g.btc_d ?? '?')}%`,
    `ETH dominance: ${String(g.eth_d ?? '?')}%`,
    `24h mcap change: ${String(g.mcap_change ?? '?')}%`,
  ].join('\n');
}

export async function markets(args: { id?: number }): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) throw new CoinloreError('Provide a coin id');
  const d = await get<any[]>(`${BASE}/coin/markets/?id=${id}`);
  if (!d.length) return 'No markets returned.';
  return `Markets for coin ${id} (${d.length}):\n` + d.slice(0, 20).map((m, i) => {
    const s = (k: string) => (m[k] != null ? String(m[k]) : '?');
    return `${i + 1}. ${s('name')} (${s('base')}/${s('quote')}): $${s('price_usd')} | 24h vol $${s('volume24')}`;
  }).join('\n');
}
