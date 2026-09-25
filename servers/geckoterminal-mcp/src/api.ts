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

export interface NetworkArgs {
  network?: string;
}

export interface PoolArgs {
  network?: string;
  pool: string;
}

export interface SearchArgs {
  query: string;
  network?: string;
}

interface PoolAttrs {
  name?: string;
  base_token_price_usd?: string;
  quote_token_price_usd?: string;
  volume_usd?: { h24?: string };
  reserve_in_usd?: string;
  pool_created_at?: string;
}

function poolLine(p: { id?: string; attributes?: PoolAttrs }): string {
  const a = p.attributes ?? {};
  const vol = a.volume_usd?.h24 ? `vol $${Number(a.volume_usd.h24).toFixed(0)}` : '';
  return `${a.name ?? p.id ?? '?'} $${a.base_token_price_usd ?? '?'} ${vol}`.trim();
}

export async function networks(): Promise<string> {
  const res = await fetch(`${BASE}/networks?page=1`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ id?: string; attributes?: { name?: string } }> };
  const nets = d.data ?? [];
  if (!nets.length) return 'No networks returned.';
  return `GeckoTerminal tracks ${nets.length} networks (page 1). Sample: ` +
    nets.slice(0, 20).map((n) => `${n.id} (${n.attributes?.name ?? '?'})`).join(', ') + '. Full list omitted for size.';
}

export async function pool(args: PoolArgs): Promise<string> {
  const network = (args?.network ?? 'eth').trim().toLowerCase();
  const raw = (args.pool ?? '').trim();
  if (!raw) return 'Provide a pool id like eth_0xa43fe16908251ee70ef74718545e4fe6c5ccec9f (see search).';
  const address = raw.includes('_') ? raw.split('_').slice(1).join('_') : raw;
  const res = await fetch(`${BASE}/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(address)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429) throw new Error('GeckoTerminal rate limit hit, wait and retry.');
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`);
  const d = (await res.json()) as { data?: { id?: string; attributes?: PoolAttrs } };
  if (!d.data) return `No pool ${address} on ${network}.`;
  const a = d.data.attributes ?? {};
  return [
    `Pool ${a.name ?? d.data.id ?? short}:`,
    `Base price USD: ${a.base_token_price_usd ?? '?'} | Quote USD: ${a.quote_token_price_usd ?? '?'}`,
    `Reserve USD: ${a.reserve_in_usd ?? '?'} | Created: ${a.pool_created_at ?? '?'}`,
  ].join('\n');
}

export async function newPools(args: NetworkArgs): Promise<string> {
  const network = (args?.network ?? 'eth').trim().toLowerCase();
  const res = await fetch(`${BASE}/networks/${encodeURIComponent(network)}/new_pools?page=1`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429) throw new Error('GeckoTerminal rate limit hit, wait and retry.');
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ id?: string; attributes?: PoolAttrs }> };
  const pools = d.data ?? [];
  if (!pools.length) return `No new pools on ${network}.`;
  return `New pools on ${network} (${pools.length}):\n` + pools.slice(0, 12).map((p, i) => `${i + 1}. ${poolLine(p)}`).join('\n');
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a search query like pepe.';
  const network = (args?.network ?? '').trim().toLowerCase();
  const params = new URLSearchParams({ query });
  if (network) params.set('network', network);
  params.set('page', '1');
  const res = await fetch(`${BASE}/search/pools?${params.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429) throw new Error('GeckoTerminal rate limit hit, wait and retry.');
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ id?: string; attributes?: PoolAttrs }> };
  const pools = d.data ?? [];
  if (!pools.length) return `No pools match ${query}.`;
  return `Pools matching ${query} (${pools.length}, use an id with the pool tool):\n` +
    pools.slice(0, 12).map((p, i) => `${i + 1}. ${p.id ?? '?'} — ${poolLine(p)}`).join('\n');
}
