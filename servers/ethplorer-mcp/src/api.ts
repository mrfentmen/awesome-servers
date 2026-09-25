const UA = 'mrfentmen-ethplorer-mcp/1.0';

export interface AddressArg {
  address: string;
}
export interface TokenHistoryArgs {
  address: string;
  limit?: number;
}

export async function tokenInfo(args: AddressArg): Promise<string> {
  const res = await fetch(`https://api.ethplorer.io/getTokenInfo/${encodeURIComponent(args.address)}?apiKey=freekey`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`);
  const d = (await res.json()) as { address?: string; name?: string; symbol?: string; decimals?: number; totalSupply?: string; holdersCount?: number; price?: { rate?: number; currency?: string } };
  if (!d.name) return `No token found at ${args.address}.`;
  return `Token ${d.name} (${d.symbol}) | ${d.address}\nDecimals: ${d.decimals}\nTotal supply: ${d.totalSupply ?? '?'}\nHolders: ${d.holdersCount ?? '?'}\nPrice: ${d.price?.rate != null ? `${d.price.rate} ${d.price.currency}` : 'unavailable'}`;
}

export async function addressInfo(args: AddressArg): Promise<string> {
  const res = await fetch(`https://api.ethplorer.io/getAddressInfo/${encodeURIComponent(args.address)}?apiKey=freekey`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`);
  const d = (await res.json()) as { address?: string; ETH?: { balance?: number; rawBalance?: string }; tokens?: Array<{ tokenInfo?: { symbol?: string; name?: string }; balance?: number }> };
  if (!d.address) return `No address data for ${args.address}.`;
  const tokens = d.tokens ?? [];
  const lines = tokens.slice(0, 10).map((t) => `${t.tokenInfo?.symbol ?? '?'} (${t.tokenInfo?.name ?? '?'}): ${t.balance ?? 0}`);
  return `Address ${d.address}\nETH balance: ${d.ETH?.balance ?? 0}\nTokens (${tokens.length} total):\n${lines.join('\n') || 'none'}`;
}

export async function tokenHistory(args: TokenHistoryArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
  const res = await fetch(`https://api.ethplorer.io/getTokenHistory/${encodeURIComponent(args.address)}?apiKey=freekey&limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`);
  const d = (await res.json()) as { operations?: Array<{ from?: string; to?: string; value?: number; timestamp?: number }> };
  const ops = d.operations ?? [];
  if (!ops.length) return `No token history for ${args.address}.`;
  return `Token history for ${args.address} (${ops.length} shown):\n` + ops.map((o, i) => `${i + 1}. ${o.from?.slice(0, 8)}... -> ${o.to?.slice(0, 8)}... value ${o.value ?? 0} at ${new Date((o.timestamp ?? 0) * 1000).toISOString()}`).join('\n');
}

export interface LimitArgs {
  limit?: number;
}

export async function topTokens(args: LimitArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
  const res = await fetch(`https://api.ethplorer.io/getTopTokens?apiKey=freekey`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`);
  const d = (await res.json()) as { tokens?: Array<{ name?: string; symbol?: string; holdersCount?: number; txsCount?: number }> };
  const tokens = (d.tokens ?? []).slice(0, limit);
  if (!tokens.length) return 'No top tokens returned.';
  return `Top ERC-20 tokens by activity (${tokens.length} shown):\n` + tokens.map((t, i) =>
    `${i + 1}. ${t.name ?? '?'} (${t.symbol ?? '?'}) holders ${t.holdersCount ?? '?'} txs ${t.txsCount ?? '?'}`).join('\n');
}

export async function tokenHolders(args: AddressArg & LimitArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
  const res = await fetch(`https://api.ethplorer.io/getTopTokenHolders/${encodeURIComponent(args.address)}?apiKey=freekey&limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`);
  const d = (await res.json()) as { holders?: Array<{ address?: string; balance?: number; share?: number }> };
  const holders = d.holders ?? [];
  if (!holders.length) return `No holders for ${args.address}.`;
  return `Top holders of ${args.address} (${holders.length} shown):\n` + holders.map((h, i) =>
    `${i + 1}. ${h.address} balance ${h.balance ?? 0} share ${h.share ?? '?'}%`).join('\n');
}

export async function addressHistory(args: AddressArg & LimitArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
  const res = await fetch(`https://api.ethplorer.io/getAddressHistory/${encodeURIComponent(args.address)}?apiKey=freekey&limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`);
  const d = (await res.json()) as { operations?: Array<{ from?: string; to?: string; value?: number; timestamp?: number; tokenInfo?: { symbol?: string } }> };
  const ops = d.operations ?? [];
  if (!ops.length) return `No address history for ${args.address}.`;
  return `Address history for ${args.address} (${ops.length} shown):\n` + ops.map((o, i) =>
    `${i + 1}. ${o.tokenInfo?.symbol ?? '?'} ${o.from?.slice(0, 8)}... -> ${o.to?.slice(0, 8)}... value ${o.value ?? 0}`).join('\n');
}
