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
