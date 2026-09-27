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
// ---- batch-4 tools: last block, ETH transfers, transaction info (2026-09-27) ----
const FREE_KEY = "freekey"

/** The free key allows only a few requests per second, so a 429 gets one retry. */
async function fetchJson<T>(path: string): Promise<T> {
  const url = `https://api.ethplorer.io${path}${path.includes("?") ? "&" : "?"}apiKey=${FREE_KEY}`
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
    if (res.status === 429 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 6000))
      continue
    }
    if (!res.ok) throw new Error(`Ethplorer returned ${res.status}`)
    return (await res.json()) as T
  }
  throw new Error("Ethplorer is rate limiting the free key right now - wait a minute and retry.")
}

const eth = (value: unknown): string => {
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(6)} ETH` : "?"
}

export async function lastBlock(_args: Record<string, never> = {}): Promise<string> {
  const d = await fetchJson<{ lastBlock?: number }>("/getLastBlock")
  if (!d.lastBlock) return "Ethplorer did not return a block height."
  return `Ethereum head block: ${d.lastBlock.toLocaleString()}`
}

export async function addressTransactions(args: AddressArg & LimitArgs): Promise<string> {
  const address = (args.address ?? "").trim()
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("Provide a 0x-prefixed Ethereum address")
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50)
  const d = await fetchJson<Array<{ timestamp?: number; from?: string; to?: string; hash?: string; value?: number; usdPrice?: number; usdValue?: number; success?: boolean }>>(
    `/getAddressTransactions/${encodeURIComponent(address)}?limit=${limit}`
  )
  const rows = Array.isArray(d) ? d : []
  if (!rows.length) return `No ETH transfers found for ${address}.`
  const inCount = rows.filter((t) => (t.to ?? "").toLowerCase() === address.toLowerCase()).length
  return [
    `Latest ${rows.length} ETH transfer(s) for ${address} (${inCount} in, ${rows.length - inCount} out)`,
    ...rows.map((t) => {
      const when = t.timestamp ? new Date(t.timestamp * 1000).toISOString().replace("T", " ").slice(0, 16) : "?"
      const direction = (t.to ?? "").toLowerCase() === address.toLowerCase() ? "in " : "out"
      const usd = Number(t.usdValue)
      return `${when} ${direction} ${eth(t.value)}${Number.isFinite(usd) && usd > 0 ? ` ($${usd.toFixed(2)})` : ""} | ${t.hash ?? "?"}`
    }),
  ].join("\n")
}

export async function txInfo(args: { hash?: string }): Promise<string> {
  const hash = (args.hash ?? "").trim()
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error("Provide a 0x-prefixed 64-character transaction hash")
  const d = await fetchJson<{
    blockNumber?: number; confirmations?: number; timestamp?: number; from?: string; to?: string; hash?: string;
    value?: number; rawValue?: string; success?: boolean; functionName?: string; methodId?: string;
    gasLimit?: number; gasUsed?: number; gasPrice?: number; usdPrice?: number; operations?: unknown[]; logs?: unknown[]
  }>(`/getTxInfo/${hash}`)
  if (!d || !d.hash) return `Ethplorer has no transaction ${hash}.`
  const feeEth = Number(d.gasUsed) && Number(d.gasPrice) ? (Number(d.gasUsed) * Number(d.gasPrice)) / 1e18 : NaN
  const ops = Array.isArray(d.operations) ? d.operations.length : 0
  const logs = Array.isArray(d.logs) ? d.logs.length : 0
  return [
    `Transaction ${d.hash}`,
    `Status: ${d.success === false ? "FAILED" : "success"} | block ${d.blockNumber ?? "?"} | confirmations ${d.confirmations ?? "?"}`,
    `From: ${d.from ?? "?"}`,
    `To:   ${d.to ?? "contract creation"}`,
    `Value: ${eth(d.value)}${d.usdPrice ? ` at $${d.usdPrice}/ETH` : ""}`,
    Number.isFinite(feeEth) ? `Gas: ${Number(d.gasUsed).toLocaleString()} of ${Number(d.gasLimit).toLocaleString()} used | fee ${feeEth.toFixed(6)} ETH` : "",
    d.functionName ? `Method: ${d.functionName}` : d.methodId ? `Method id: ${d.methodId}` : "",
    `Token transfers: ${ops} | event logs: ${logs}`,
    d.timestamp ? `Seen: ${new Date(d.timestamp * 1000).toISOString().replace("T", " ").slice(0, 19)} UTC` : "",
  ].filter(Boolean).join("\n")
}
