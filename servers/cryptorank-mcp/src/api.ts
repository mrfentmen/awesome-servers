const BASE = 'https://api.cryptorank.io/v0';
const UA = 'mrfentmen-cryptorank-mcp/1.0';

export interface CoinsArgs {
  limit?: number;
}

export interface CoinArgs {
  key: string;
}

export async function coins(args: CoinsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 20) || 20, 1), 50);
  const res = await fetch(`${BASE}/coins?limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CryptoRank returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ rank?: number; name?: string; symbol?: string; key?: string; values?: { USD?: { price?: number; percentChange24h?: number } } }> };
  const list = d.data ?? [];
  if (!list.length) return 'No coins returned.';
  return `CryptoRank top coins (${list.length}):\n` +
    list.map((c, i) => {
      const usd = c.values?.USD ?? {};
      const chg = usd.percentChange24h != null ? `${usd.percentChange24h >= 0 ? '+' : ''}${usd.percentChange24h.toFixed(2)}%` : '?';
      return `${i + 1}. #${c.rank ?? '?'} ${c.name ?? '?'} (${c.symbol ?? '?'}) $${usd.price ?? '?'} ${chg}`;
    }).join('\n');
}

export async function coin(args: CoinArgs): Promise<string> {
  const key = (args.key ?? '').trim().toLowerCase();
  if (!key) return 'Provide a coin key like bitcoin.';
  const res = await fetch(`${BASE}/coins/${encodeURIComponent(key)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CryptoRank returned ${res.status}`);
  const d = (await res.json()) as { data?: { rank?: number; name?: string; symbol?: string; description?: string; values?: { USD?: { price?: number; percentChange24h?: number; marketCap?: number; volume24h?: number } } } };
  const c = d.data ?? {};
  const usd = c.values?.USD ?? {};
  const fmt = (n?: number) => (n != null ? `$${n >= 1000 ? n.toLocaleString() : n}` : '?');
  return [
    `CryptoRank ${c.name ?? key} (${c.symbol ?? '?'})`,
    c.rank != null ? `Rank: #${c.rank}` : null,
    `Price: ${fmt(usd.price)}`,
    usd.percentChange24h != null ? `24h: ${usd.percentChange24h >= 0 ? '+' : ''}${usd.percentChange24h.toFixed(2)}%` : null,
    usd.marketCap != null ? `Market cap: ${fmt(usd.marketCap)}` : null,
    usd.volume24h != null ? `Volume 24h: ${fmt(usd.volume24h)}` : null,
    c.description ? `Description: ${c.description.slice(0, 300)}` : null,
  ].filter(Boolean).join('\n');
}
