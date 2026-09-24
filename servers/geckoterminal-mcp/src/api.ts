const BASE = 'https://api.geckoterminal.com/api/v2';
const UA = 'mrfentmen-geckoterminal-mcp/1.0';

export interface TokenArgs {
  network?: string;
  address: string;
}

export interface TrendingArgs {
  network?: string;
}

export async function token(args: TokenArgs): Promise<string> {
  const network = (args?.network ?? 'eth').trim().toLowerCase();
  const address = (args.address ?? '').trim();
  if (!address) return 'Provide a token address.';
  const res = await fetch(`${BASE}/networks/${network}/tokens/${encodeURIComponent(address)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`);
  const d = (await res.json()) as { data?: { id?: string; attributes?: { name?: string; symbol?: string; address?: string; decimals?: number; image_url?: string } } };
  const a = d.data?.attributes ?? {};
  return [
    `GeckoTerminal token (${network}):`,
    `Name: ${a.name ?? '?'} (${a.symbol ?? '?'})`,
    `Address: ${a.address ?? address}`,
    a.decimals != null ? `Decimals: ${a.decimals}` : null,
    a.image_url ? `Image: ${a.image_url}` : null,
  ].filter(Boolean).join('\n');
}

export async function trending(args: TrendingArgs): Promise<string> {
  const network = (args?.network ?? 'eth').trim().toLowerCase();
  const res = await fetch(`${BASE}/networks/${network}/trending_pools?page=1`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ attributes?: { name?: string; base_token_price_usd?: string; volume_usd?: { h24?: string } } }> };
  const pools = d.data ?? [];
  if (!pools.length) return `No trending pools on ${network}.`;
  return `Trending pools on ${network} (${pools.length}):\n` +
    pools.slice(0, 12).map((p, i) => {
      const a = p.attributes ?? {};
      const vol = a.volume_usd?.h24 ? `vol $${Number(a.volume_usd.h24).toFixed(0)}` : '';
      return `${i + 1}. ${a.name ?? '?'} $${a.base_token_price_usd ?? '?'} ${vol}`.trim();
    }).join('\n');
}
