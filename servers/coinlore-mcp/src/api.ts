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
    return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')}\n   $${s('price_usd')} | 24h ${s('percent_change_24h')}% | mcap $${s('market_cap_usd')} | vol $${s('volume24a')} | supply ${s('csupply')}`;
  }).join('\n');
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

/** CoinLore has no search endpoint, so match symbol/name over the top 100 by market cap. */
export async function searchCoins(args: { query: string; limit?: number }): Promise<string> {
  const query = String(args.query ?? '').trim().toLowerCase();
  if (!query) throw new CoinloreError('Provide a coin name or symbol to search for');
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const d = await get<{ data?: Array<Record<string, unknown>> }>(`${BASE}/tickers/?start=0&limit=100`);
  const rows = d.data ?? [];
  const hits = rows.filter((c) =>
    `${String(c.name ?? '').toLowerCase()} ${String(c.symbol ?? '').toLowerCase()} ${String(c.nameid ?? '').toLowerCase()}`.includes(query)
  );
  if (!hits.length) return `No coin in the top 100 matches "${args.query}". Try the exact symbol, e.g. 'ETH'.`;
  return `Coins matching "${args.query}" (${hits.length} of the top 100):\n` + hits.slice(0, limit).map((c, i) => {
    const s = (k: string) => (c[k] != null ? String(c[k]) : '?');
    return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')} | id ${s('id')}\n   $${s('price_usd')} | 24h ${s('percent_change_24h')}% | mcap $${s('market_cap_usd')}`;
  }).join('\n');
}

/** Biggest 24h movers among the top 100 coins by market cap. */
export async function movers(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
  const d = await get<{ data?: Array<Record<string, unknown>> }>(`${BASE}/tickers/?start=0&limit=100`);
  const rows = (d.data ?? []).filter((c) => Number.isFinite(num(c.percent_change_24h)));
  if (!rows.length) return 'No 24h change data returned.';
  const sorted = [...rows].sort((a, b) => num(b.percent_change_24h) - num(a.percent_change_24h));
  const fmt = (c: Record<string, unknown>, i: number) => {
    const s = (k: string) => (c[k] != null ? String(c[k]) : '?');
    return `${i + 1}. ${s('name')} (${s('symbol')}) #${s('rank')} — ${num(c.percent_change_24h) >= 0 ? '+' : ''}${num(c.percent_change_24h).toFixed(2)}% at $${s('price_usd')}`;
  };
  const gainers = sorted.slice(0, limit);
  const losers = sorted.slice(-limit).reverse();
  return (
    `Top ${gainers.length} gainers (24h, of the top 100 coins):\n` + gainers.map(fmt).join('\n') +
    `\n\nTop ${losers.length} losers (24h, of the top 100 coins):\n` + losers.map(fmt).join('\n')
  );
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
  // CoinLore's market `price_usd` is not the USD price of the coin, so quote the
  // local price together with its quote currency and use volume_usd for volume.
  return `Markets for coin ${id} (${d.length}):\n` + d.slice(0, 20).map((m, i) => {
    const quote = String(m.quote ?? '?');
    const price = Number(m.price);
    const volumeUsd = Number(m.volume_usd);
    return `${i + 1}. ${m.name ?? '?'} (${m.base ?? '?'}/${quote}): ` +
      `${Number.isFinite(price) ? price.toLocaleString() : '?'} ${quote} | ` +
      `vol 24h ${Number.isFinite(volumeUsd) ? `$${Math.round(volumeUsd).toLocaleString()}` : 'n/a'}`;
  }).join('\n');
}
