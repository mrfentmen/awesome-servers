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
    `Pool ${a.name ?? d.data.id ?? address}:`,
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
// ---- batch-4 tools: token pools, simple prices, DEX list (2026-09-27) ----
async function gtGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 429) throw new Error("GeckoTerminal rate limit hit, wait and retry.")
  if (!res.ok) throw new Error(`GeckoTerminal returned ${res.status}`)
  return (await res.json()) as T
}

const usd = (value: unknown): string => {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return "n/a"
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

/** Every pool a token trades in, biggest liquidity first, so a price can be checked against real depth. */
export async function tokenPools(args: { network?: string; address: string; limit?: number }): Promise<string> {
  const network = (args.network ?? "eth").trim().toLowerCase()
  const address = (args.address ?? "").trim()
  if (!address) throw new Error("Provide a token address.")
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 20)
  const d = await gtGet<{ data?: Array<{ id?: string; attributes?: PoolAttrs }> }>(
    `/networks/${encodeURIComponent(network)}/tokens/${encodeURIComponent(address)}/pools?page=1`
  )
  const pools = d.data ?? []
  if (!pools.length) return `No pools found for ${address} on ${network}.`
  const ranked = [...pools].sort((a, b) => Number(b.attributes?.reserve_in_usd ?? 0) - Number(a.attributes?.reserve_in_usd ?? 0))
  const depth = ranked.reduce((sum, p) => sum + Number(p.attributes?.reserve_in_usd ?? 0), 0)
  return [
    `Pools for ${address} on ${network}: ${pools.length} returned, ${usd(depth)} total liquidity`,
    ...ranked.slice(0, limit).map((p, i) => {
      const a = p.attributes ?? {}
      const created = a.pool_created_at ? a.pool_created_at.slice(0, 10) : "?"
      return `${i + 1}. ${a.name ?? p.id ?? "?"} | price ${a.base_token_price_usd ?? "?"} | reserves ${usd(a.reserve_in_usd)} | 24h vol ${usd(a.volume_usd?.h24)} | since ${created}`
    }),
    "",
    `Use the pool ids with the pool tool, e.g. ${pools[0]?.id ?? "eth_0x..."}.`,
  ].join("\n")
}

/** Batch USD prices for up to 30 token addresses on one network. */
export async function tokenPrices(args: { addresses: string; network?: string }): Promise<string> {
  const network = (args.network ?? "eth").trim().toLowerCase()
  const list = (args.addresses ?? "").split(/[,\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 30)
  if (!list.length) throw new Error("Provide up to 30 token addresses, comma separated.")
  const d = await gtGet<{ data?: { attributes?: { token_prices?: Record<string, string> } } }>(
    `/simple/networks/${encodeURIComponent(network)}/token_price/${list.map(encodeURIComponent).join(",")}`
  )
  const prices = d.data?.attributes?.token_prices ?? {}
  const rows = list.map((address) => {
    const price = prices[address.toLowerCase()]
    return `${price === undefined ? "no price" : `$${Number(price).toLocaleString(undefined, { maximumFractionDigits: 8 })}`}  ${address}`
  })
  return [
    `Spot prices on ${network} (${rows.length} address(es)):`,
    ...rows,
    "",
    "Prices come from the deepest pools GeckoTerminal tracks on that network.",
  ].join("\n")
}

/** Decentralised exchanges tracked on one network, with their pool counts. */
export async function dexes(args: { network?: string; limit?: number }): Promise<string> {
  const network = (args.network ?? "eth").trim().toLowerCase()
  const limit = Math.min(Math.max(Number(args.limit ?? 25) || 25, 1), 50)
  const d = await gtGet<{ data?: Array<{ id?: string; attributes?: { name?: string; identifier?: string; pool_count?: number } }> }>(
    `/networks/${encodeURIComponent(network)}/dexes?page=1`
  )
  const list = d.data ?? []
  if (!list.length) return `GeckoTerminal lists no DEXes on ${network}.`
  const ranked = [...list].sort((a, b) => Number(b.attributes?.pool_count ?? 0) - Number(a.attributes?.pool_count ?? 0))
  return [
    `DEXes on ${network}: ${list.length} tracked (page 1)`,
    ...ranked.slice(0, limit).map((x, i) => {
      const a = x.attributes ?? {}
      return `${i + 1}. ${a.name ?? a.identifier ?? x.id ?? "?"}${a.pool_count !== undefined ? ` | ${a.pool_count} pool(s)` : ""}`
    }),
  ].join("\n")
}
