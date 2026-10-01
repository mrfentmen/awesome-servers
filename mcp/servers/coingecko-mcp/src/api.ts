
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
// ---- batch-3 tools: extra live market data (2026-09-27) ----
const B3_BASE = 'https://api.coingecko.com/api/v3';
class CgBatch3Error extends Error {}
async function cgBatch3Get<T>(path: string): Promise<T> {
  const res = await fetch(`${B3_BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-coingecko-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 429) throw new CgBatch3Error('CoinGecko rate limit hit, wait and retry');
  if (!res.ok) throw new CgBatch3Error(`CoinGecko error ${res.status}`);
  return (await res.json()) as T;
}

const usd3 = (n?: number) => (n === undefined || !Number.isFinite(n) ? 'n/a' : `$${Math.round(n).toLocaleString()}`);

export async function categories(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 40);
  const d = await cgBatch3Get<{ id?: string; name?: string; market_cap?: number; market_cap_change_24h?: number; volume_24h?: number; top_3_coins_id?: string[] }[]>('/coins/categories');
  const rows = d.filter((c) => Number.isFinite(c.market_cap)).sort((a, b) => Number(b.market_cap) - Number(a.market_cap)).slice(0, limit);
  if (!rows.length) return 'No categories returned.';
  return `Top ${rows.length} CoinGecko categories by market cap:\n` +
    rows.map((c, i) => `${i + 1}. ${c.name ?? '?'} (${c.id ?? '?'}) | cap ${usd3(c.market_cap)} | 24h ${c.market_cap_change_24h?.toFixed(2) ?? '?'}% | vol ${usd3(c.volume_24h)}${c.top_3_coins_id?.length ? ` | top ${c.top_3_coins_id.slice(0, 3).join(', ')}` : ''}`).join('\n');
}

export async function exchanges(args: { limit?: number; page?: number }): Promise<string> {
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 50);
  const page = Math.max(Math.floor(args.page ?? 1), 1);
  const d = await cgBatch3Get<{ id?: string; name?: string; country?: string; year_established?: number; trust_score?: number; trust_score_rank?: number; trade_volume_24h_btc?: number }[]>(`/exchanges?per_page=${limit}&page=${page}`);
  if (!d.length) return `No exchanges returned on page ${page}.`;
  return `CoinGecko exchanges page ${page} (${d.length}):\n` +
    d.map((e) => `#${e.trust_score_rank ?? '?'} ${e.name ?? '?'} (${e.id ?? '?'}) | trust ${e.trust_score ?? '?'} | 24h BTC volume ${Math.round(Number(e.trade_volume_24h_btc ?? 0)).toLocaleString()} | ${e.country ?? '?'}${e.year_established ? ` since ${e.year_established}` : ''}`).join('\n');
}

export async function search(args: { query: string; limit?: number }): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) throw new CgBatch3Error('Provide a search query, e.g. solana or aave');
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30);
  const d = await cgBatch3Get<{ coins?: { id?: string; name?: string; symbol?: string; market_cap_rank?: number }[]; exchanges?: { id?: string; name?: string }[]; categories?: { id?: string; name?: string }[] }>(`/search?query=${encodeURIComponent(query)}`);
  const coins = d.coins ?? [];
  const lines = [`CoinGecko search for "${query}": ${coins.length} coins, ${(d.exchanges ?? []).length} exchanges, ${(d.categories ?? []).length} categories.`];
  if (coins.length) {
    lines.push(`Coins (${Math.min(coins.length, limit)} of ${coins.length}):`);
    lines.push(...coins.slice(0, limit).map((c) => `  ${c.id ?? '?'} — ${c.name ?? '?'} (${(c.symbol ?? '?').toUpperCase()})${c.market_cap_rank ? ` rank #${c.market_cap_rank}` : ' unranked'}`));
  }
  if (d.categories?.length) lines.push(`Category ids: ${d.categories.slice(0, 8).map((c) => c.id ?? '?').join(', ')}`);
  if (d.exchanges?.length) lines.push(`Exchange ids: ${d.exchanges.slice(0, 8).map((e) => e.id ?? '?').join(', ')}`);
  return lines.join('\n');
}

export async function history(args: { date?: string; coin?: string }): Promise<string> {
  const coin = (args.coin ?? 'bitcoin').trim().toLowerCase();
  const date = (args.date ?? '').trim();
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) throw new CgBatch3Error('Date must be dd-mm-yyyy, e.g. 20-09-2026');
  const d = await cgBatch3Get<{ name?: string; symbol?: string; market_data?: { current_price?: Record<string, number>; market_cap?: Record<string, number>; total_volume?: Record<string, number> } }>(
    `/coins/${encodeURIComponent(coin)}/history?date=${encodeURIComponent(date)}&localization=false`);
  const md = d.market_data ?? {};
  const value = (m?: Record<string, number>) => (m && typeof m.usd === 'number' ? `$${m.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'n/a');
  if (!d.name) return `No snapshot found for coin "${coin}" on ${date}.`;
  return [
    `${d.name} (${(d.symbol ?? '?').toUpperCase()}) on ${date}:`,
    `Price: ${value(md.current_price)}`,
    `Market cap: ${value(md.market_cap)}`,
    `24h volume: ${value(md.total_volume)}`,
  ].join('\n');
}

// ---- muxD tools:

const cgNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const cgPct = (v: unknown): string => (Number.isFinite(cgNum(v)) ? `${cgNum(v).toFixed(2)}%` : '?');

interface CgTicker {
  base?: string;
  target?: string;
  market?: { name?: string; identifier?: string; has_trading_incentive?: boolean };
  last?: number;
  volume?: number;
  converted_last?: Record<string, number>;
  converted_volume?: Record<string, number>;
  trust_score?: number | null;
  bid_ask_spread_percentage?: number;
  timestamp?: string;
  last_traded_at?: string;
  is_stale?: boolean;
  is_anomaly?: boolean;
  coin_mcap_usd?: number;
}

const cgSpreadOf = (t: CgTicker): number => cgNum(t.converted_last?.usd ?? t.last);

// CoinGecko sends null for an unrated market, and Number(null) is 0, so a plain
// numeric check would report every unrated market as a trust score of 0.

export interface CoinTickersArgs {
  coin: string;
  limit?: number;
  min_volume?: number;
  only_clean?: string;
}

export interface ExchangeTickersArgs {
  exchange: string;
  limit?: number;
  min_volume?: number;
  quote?: string;
}

/** What one exchange is actually quoting, ranked by volume, which shows where its liquidity really sits. */
export async function exchangeTickers(args: ExchangeTickersArgs): Promise<string> {
  const id = (args.exchange ?? '').trim().toLowerCase();
  if (!id) throw new CgBatch3Error('Provide an exchange id, e.g. binance, coinbase or kraken. Use exchanges to list them.');
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 12), 1), 40);
  const minVolume = Math.max(cgNum(args.min_volume) || 0, 0);
  const quote = (args.quote ?? '').trim().toUpperCase();

  const d = await cgBatch3Get<{ name?: string; tickers?: CgTicker[] }>(
    `/exchanges/${encodeURIComponent(id)}/tickers`,
  );
  const all = d.tickers ?? [];
  if (!all.length) throw new CgBatch3Error(`CoinGecko lists no markets for exchange "${id}".`);
  const name = d.name ?? id;

  const scored = all.map((t) => ({ t, volUsd: cgNum(t.converted_volume?.usd), usd: cgSpreadOf(t) }))
    .filter((x) => Number.isFinite(x.volUsd));
  if (!scored.length) throw new CgBatch3Error(`CoinGecko returned ${all.length} market(s) for ${name} but none carried a usable volume in USD.`);

  let kept = scored;
  if (quote) kept = kept.filter((x) => String(x.t.target ?? '').toUpperCase() === quote);
  if (!kept.length) {
    const targets = [...new Set(scored.map((x) => String(x.t.target ?? '?')))].sort();
    return `${name} lists ${scored.length} market(s) but none quoted in ${quote}. Quote currencies present: ${targets.slice(0, 20).join(', ')}${targets.length > 20 ? ` and ${targets.length - 20} more` : ''}.`;
  }
  const liquid = minVolume > 0 ? kept.filter((x) => x.volUsd >= minVolume) : kept;
  if (!liquid.length) return `None of the ${kept.length} ${name} market(s) in ${quote} reached ${usd3(minVolume)} in 24h volume.`;

  const ranked = liquid.slice().sort((a, b) => b.volUsd - a.volUsd);
  const totalVol = ranked.reduce((s, x) => s + x.volUsd, 0);
  const shown = ranked.slice(0, limit);
  const bases = new Set(ranked.map((x) => x.t.base ?? '?'));

  const lines = [
    `${name} (${id}): ${all.length} market(s) listed, ${kept.length} match the filters, ${ranked.length} above the volume floor`,
    `Combined 24h volume ${usd3(totalVol)} across ${bases.size} base asset(s)`,
    ranked.length === 1 ? 'Only one market clears the floor, so the share column is 100% by definition.' : '',
    '',
    `${"pair".padEnd(18)}${"last".padStart(14)}${"24h vol USD".padStart(16)}${"share".padStart(8)}${"spread".padStart(10)}  last traded`,
    ...shown.map((x) => {
      const share = totalVol > 0 ? (x.volUsd / totalVol) * 100 : NaN;
      return [
        `${x.t.base ?? '?'}/${x.t.target ?? '?'}`.padEnd(18),
        (Number.isFinite(x.usd) ? x.usd.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '?').padStart(14),
        usd3(x.volUsd).padStart(16),
        `${(Number.isFinite(share) ? share.toFixed(1) : '?').padStart(7)}%`,
        cgPct(x.t.bid_ask_spread_percentage).padStart(10),
        `  ${String(x.t.last_traded_at ?? '?').slice(0, 19).replace('T', ' ')}`,
      ].join('');
    }),
  ].filter((l) => l !== '');
  if (ranked.length > shown.length) lines.push('', `...and ${ranked.length - shown.length} more above the floor; raise limit to see them.`);
  return lines.join('\n');
}

export interface OhlcArgs {
  coin: string;
  currency?: string;
  days?: number;
}

