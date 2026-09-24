
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
export const m1_price = m1.price;
export const m1_CryptoError = m1.CryptoError;
