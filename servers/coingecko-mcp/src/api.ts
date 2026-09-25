
export interface m0_PriceArgs {
  coin: string;
  currency?: string;
}

const m0 = (() => {
const BASE = 'https://api.coingecko.com/api/v3';


async function price(args: m0_PriceArgs): Promise<string> {
  const coin = (args.coin ?? '').trim().toLowerCase();
  if (!coin) return 'Provide a coin id like bitcoin or ethereum.';
  const currency = (args.currency ?? 'usd').toLowerCase();
  const url = `${BASE}/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=${encodeURIComponent(currency)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-coingecko-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
  const data = (await res.json()) as Record<string, Record<string, number>>;
  const entry = data[coin];
  if (!entry) return `No price found for coin "${coin}".`;
  const value = entry[currency];
  if (typeof value !== 'number') return `No ${currency} price found for "${coin}".`;
  return `${coin} price: ${value.toLocaleString()} ${currency.toUpperCase()}`;
}

async function trending(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(`${BASE}/search/trending`, {
    headers: { 'User-Agent': 'mrfentmen-coingecko-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
  const data = (await res.json()) as {
    coins?: Array<{
      item?: { id?: string; name?: string; symbol?: string; market_cap_rank?: number; price_btc?: number };
    }>;
  };
  const coins = (data.coins ?? []).slice(0, 10);
  if (!coins.length) throw new Error('CoinGecko returned no trending coins');
  return `Trending coins on CoinGecko:\n` +
    coins
      .map((c, i) => `${i + 1}. ${c.item?.name ?? ''} (${c.item?.symbol ?? ''}) rank ${c.item?.market_cap_rank ?? 'n/a'} | ${c.item?.id ?? ''}`)
      .join('\n');
}

return { price, trending };
})();

const m1 = (() => {
const BASE = "https://api.coingecko.com/api/v3"
const UA = "mrfentmen-crypto-prices-mcp/1.0 (https://github.com/mrfentmen)"
class CryptoError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new CryptoError("CoinGecko rate limit hit, wait and retry")
  if (!res.ok) throw new CryptoError(`CoinGecko error ${res.status}`)
  return (await res.json()) as T
}

async function price(args: { coins?: string; currency?: string }): Promise<string> {
  const coins = (args.coins ?? "bitcoin").split(",").map((c) => c.trim()).filter(Boolean).slice(0, 10)
  const currency = (args.currency ?? "usd").toLowerCase()
  const d = await get<Record<string, Record<string, number>>>(`${BASE}/simple/price?ids=${coins.join(",")}&vs_currencies=${currency}`)
  const out = coins.map((c) => {
    const v = d[c]?.[currency]
    return `${c}: ${v === undefined ? "n/a" : v.toLocaleString()} ${currency.toUpperCase()}`
  })
  return out.join("\n")
}

async function trending(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/search/trending`)
  const rows = (d.coins ?? []).slice(0, limit)
  return rows.map((r: any, i: number) => {
    const c = r.item ?? {}
    return `${i + 1}. ${c.name ?? ""} (${c.symbol ?? ""}) | rank ${c.market_cap_rank ?? "?"}\n   ${(c.data?.price ?? "price n/a").replace(/[<>&$]/g, "")} | ${(c.data?.market_cap ?? "").replace(/[<>&$]/g, "")}`
  }).join("\n\n") || "None trending"
}

return { CryptoError, price, trending };
})();

export const CryptoError = m1.CryptoError;
export const price = m0.price;
export const trending = m0.trending;
export const m0_trending = m0.trending;
export const m0_price = m0.price;
export const m1_trending = m1.trending;

const m2 = (() => {
const BASE2 = 'https://api.coingecko.com/api/v3';
const UA2 = 'mrfentmen-coingecko-mcp/1.0';

async function get2<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA2, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (res.status === 429) throw new m1.CryptoError('CoinGecko rate limit hit, wait and retry');
  if (!res.ok) throw new m1.CryptoError(`CoinGecko error ${res.status}`);
  return (await res.json()) as T;
}

const clamp2 = (value: number | undefined, fallback: number, max = 50) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

async function markets(args: { currency?: string; limit?: number }): Promise<string> {
  const currency = (args.currency ?? 'usd').toLowerCase();
  const limit = clamp2(args.limit, 10, 50);
  const d = await get2<{ id?: string; symbol?: string; name?: string; current_price?: number; market_cap_rank?: number }[]>(
    `${BASE2}/coins/markets?vs_currency=${encodeURIComponent(currency)}&order=market_cap_desc&per_page=${limit}&page=1`);
  if (!d.length) return 'No market data returned.';
  return `Top ${d.length} coins by market cap (${currency.toUpperCase()}):\n` + d.map((c) =>
    `#${c.market_cap_rank ?? '?'} ${c.name ?? '?'} (${(c.symbol ?? '?').toUpperCase()}): ${(c.current_price ?? 0).toLocaleString()} ${currency.toUpperCase()}`).join('\n');
}

async function coin(args: { coin?: string }): Promise<string> {
  const coin = (args.coin ?? '').trim().toLowerCase();
  if (!coin) return 'Provide a coin id like bitcoin or ethereum.';
  const d = await get2<{ id?: string; symbol?: string; name?: string; hashing_algorithm?: string; categories?: string[]; market_data?: { current_price?: Record<string, number>; market_cap_rank?: number; price_change_percentage_24h?: number } }>(
    `${BASE2}/coins/${encodeURIComponent(coin)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
  const md = d.market_data ?? {};
  const cats = (d.categories ?? []).slice(0, 5).join(', ');
  return [
    `${d.name ?? coin} (${(d.symbol ?? '?').toUpperCase()})`,
    `Rank: ${md.market_cap_rank ?? '?'} | 24h change: ${md.price_change_percentage_24h?.toFixed(2) ?? '?'}%`,
    `Algorithm: ${d.hashing_algorithm ?? '?'}`,
    cats ? `Categories: ${cats}` : null,
  ].filter(Boolean).join('\n');
}

async function chart(args: { coin?: string; currency?: string; days?: number }): Promise<string> {
  const coin = (args.coin ?? '').trim().toLowerCase();
  if (!coin) return 'Provide a coin id like bitcoin or ethereum.';
  const currency = (args.currency ?? 'usd').toLowerCase();
  const days = clamp2(args.days, 7, 365);
  const d = await get2<{ prices?: number[][] }>(
    `${BASE2}/coins/${encodeURIComponent(coin)}/market_chart?vs_currency=${encodeURIComponent(currency)}&days=${days}`);
  const prices = d.prices ?? [];
  if (!prices.length) return `No chart data for ${coin}.`;
  const step = Math.max(1, Math.floor(prices.length / 10));
  const rows = prices.filter((_, i) => i % step === 0).map(([t, p]) =>
    `${new Date(t).toISOString().slice(0, 10)} ${Number(p).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  const first = prices[0][1];
  const last = prices[prices.length - 1][1];
  const change = ((last - first) / first * 100).toFixed(2);
  return `${coin} ${days}d in ${currency.toUpperCase()} (${change}%):\n` + rows.join('\n');
}

async function global(args?: unknown): Promise<string> {
  void args;
  const d = await get2<{ data?: { active_cryptocurrencies?: number; markets?: number; total_market_cap?: Record<string, number>; market_cap_percentage?: Record<string, number> } }>(`${BASE2}/global`);
  const g = d.data ?? {};
  const dom = g.market_cap_percentage ?? {};
  const top = Object.entries(dom).slice(0, 5).map(([k, v]) => `${k.toUpperCase()} ${Number(v).toFixed(1)}%`).join(', ');
  return `Crypto market: ${g.active_cryptocurrencies ?? '?'} coins across ${g.markets ?? '?'} markets. Dominance: ${top}.`;
}

return { markets, coin, chart, global };
})();

export const markets = m2.markets;
export const coin = m2.coin;
export const chart = m2.chart;
export const global = m2.global;
export const m1_price = m1.price;
export const m1_CryptoError = m1.CryptoError;
