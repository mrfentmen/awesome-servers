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

// ---- muxD tools:

/**
 * Ethplorer answers with a documented error code in the body (1 invalid key,
 * 133 suspended, 135 method disabled, 104 invalid address, 150 not a token
 * contract, and so on). The shared helper collapses all of that to a bare status
 * code, which turns a revoked freekey into an unhelpful "Ethplorer returned 401"
 * instead of "Invalid API key". This surfaces the code.
 */
const ETHPLORER_ERRORS: Record<number, string> = {
  1: "Invalid API key. The shared freekey has stopped working, so a personal key from ethplorer.io is now required.",
  3: "Database connection failed on Ethplorer's side.",
  101: "A transaction hash was required but not supplied.",
  102: "The transaction hash is not a valid 32-byte hash.",
  104: "The address format was rejected.",
  108: "The timestamp was rejected.",
  109: "The limit was rejected.",
  111: "An address is required.",
  133: "This API key has been suspended.",
  135: "This method is disabled for the API key being used.",
  136: "getAddressHistory with a token filter is disabled for this key, which is a freekey restriction.",
  150: "That address is not a token contract.",
  404: "Not found.",
  999: "Internal error on Ethplorer's side.",
}

async function epGet<T>(base: string, path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams({ apiKey: FREE_KEY })
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, v)
  let res: Response
  try {
    // The chain bases are written with a trailing slash and the paths with a
    // leading one, which would otherwise produce a double slash. Ethplorer
    // happens to tolerate it, so the bug would have stayed hidden.
    res = await fetch(`${base.replace(/\/$/, "")}${path}?${qs.toString()}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new Error(`Network error reaching ${new URL(base).hostname}: ${(e as Error).message}`)
  }
  const body = await res.text()
  let parsed: any
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new Error(`Ethplorer returned HTTP ${res.status} with a non-JSON body: ${body.slice(0, 200)}`)
  }
  if (parsed?.error) {
    const code = Number(parsed.error.code)
    const meaning = ETHPLORER_ERRORS[code]
    throw new Error(`Ethplorer error ${code}: ${parsed.error.message ?? "no message"}${meaning ? ` — ${meaning}` : ""}`)
  }
  if (!res.ok) throw new Error(`Ethplorer returned HTTP ${res.status}`)
  return parsed as T
}

const CHAINS: Record<string, { name: string; base: string; note?: string }> = {
  "1": { name: "Ethereum Mainnet", base: "https://api.ethplorer.io/" },
  "56": { name: "BNB Smart Chain", base: "https://api.binplorer.com/", note: "ETH in the response means BNB here" },
  "59144": { name: "Linea", base: "https://api.lineaplorer.build/", note: "ETH in the response means the Linea gas token" },
  "81457": { name: "Blast", base: "https://api.blastplorer.info/", note: "ETH in the response means the Blast gas token" },
  "11155111": { name: "Ethereum Sepolia", base: "https://sepolia-api.ethplorer.io/" },
  "17000": { name: "Ethereum Holesky", base: "https://holesky-api.ethplorer.io/" },
  "560048": { name: "Ethereum Hoodi", base: "https://hoodi-api.ethplorer.io/" },
}

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

/**
 * Compact USD. The implausible branch exists because a junk price feed multiplied
 * by a junk balance produces figures like 2.7e20, which is not a valuation
 * anyone should read as one. The threshold is a trillion dollars, well above
 * any real token, so ordinary large values are still shown normally.
 */
const compactUsd = (n: number): string => {
  if (!Number.isFinite(n)) return "?"
  const abs = Math.abs(n)
  if (abs >= 1e12) return `$${(n / 1e12).toExponential(1)}T+ implausible`
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export interface TopTokensByArgs {
  criteria?: string;
  limit?: number;
  compare?: boolean;
}

const CRITERIA: Record<string, { key: string; label: string; note: string }> = {
  trade: { key: "trade", label: "trade volume", note: "most traded" },
  cap: { key: "cap", label: "market capitalisation", note: "largest by cap" },
  count: { key: "count", label: "operation count", note: "most transactions" },
}

export interface NewTokensArgs {
  limit?: number;
  with_price_only?: boolean;
}

export interface ChainHoldingsArgs {
  address: string;
  chains?: string;
}

/**
 * The same address on every chain Ethplorer serves. A token address means
 * nothing across chains: the same symbol is a different, unrelated contract on
 * each, and asking about "USDT" without naming a chain is the single most common
 * way to read a balance wrong.
 */
export async function chainHoldings(args: ChainHoldingsArgs): Promise<string> {
  const address = String(args.address ?? "").trim()
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`"${address}" is not a 0x-prefixed 40-hex-character address.`)
  }
  const wanted = String(args.chains ?? "").trim()
  const keys = wanted
    ? wanted.split(/[,\s]+/).map((k) => k.trim()).filter(Boolean)
    : Object.keys(CHAINS)
  const unknown = keys.filter((k) => !CHAINS[k])
  if (unknown.length) {
    throw new Error(`Unknown chain id(s): ${unknown.join(", ")}. Ethplorer serves ${Object.entries(CHAINS).map(([id, c]) => `${id} (${c.name})`).join(", ")}.`)
  }

  type Row = {
    chain: string
    id: string
    eth: number
    rawEth: string
    usd: number
    tokens: Array<{ symbol: string; name: string; balance: number; usd: number; address: string }>
    isContract: boolean
    countTxs: number | null
    error: string
  }
  const rows: Row[] = []

  for (const id of keys) {
    const c = CHAINS[id]
    try {
      const d = await epGet<any>(c.base, `/getAddressInfo/${address}`)
      const tokens: any[] = Array.isArray(d?.tokens) ? d.tokens : []
      rows.push({
        chain: c.name,
        id,
        eth: num(d?.ETH?.balance),
        rawEth: String(d?.ETH?.rawBalance ?? ""),
        usd: num(d?.ETH?.price && d.ETH.price !== false ? d.ETH.price.rate : NaN),
        tokens: tokens.map((t) => {
          const p: any = t?.tokenInfo?.price
          const rate = p && p !== false ? num(p.rate) : NaN
          const bal = num(t?.balance)
          return {
            symbol: String(t?.tokenInfo?.symbol ?? "?"),
            name: String(t?.tokenInfo?.name ?? "?"),
            balance: bal,
            usd: Number.isFinite(rate) && Number.isFinite(bal) ? rate * bal : NaN,
            address: String(t?.tokenInfo?.address ?? ""),
          }
        }),
        isContract: Boolean(d?.contractInfo),
        countTxs: d?.countTxs === undefined ? null : num(d.countTxs),
        error: "",
      })
    } catch (e) {
      rows.push({ chain: c.name, id, eth: NaN, rawEth: "", usd: NaN, tokens: [], isContract: false, countTxs: null, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const ok = rows.filter((r) => !r.error)
  const failed = rows.filter((r) => r.error)
  const lines = [`Holdings of ${address} across ${ok.length} of ${rows.length} chain(s) Ethplorer serves`, ""]

  for (const r of rows) {
    if (r.error) {
      lines.push(`${r.chain.padEnd(18)} unavailable: ${r.error.slice(0, 90)}`)
      continue
    }
    const ethUsd = Number.isFinite(r.eth) && Number.isFinite(r.usd) ? r.eth * r.usd : NaN
    lines.push(
      `${r.chain.padEnd(18)} ${Number.isFinite(r.eth) ? r.eth.toFixed(6) : "?"} gas token${Number.isFinite(ethUsd) ? ` (${compactUsd(ethUsd)})` : ""} | ${r.tokens.length} token(s) | ${r.isContract ? "contract" : "EOA"}${r.countTxs !== null ? ` | ${r.countTxs} txs` : ""}`,
    )
    for (const t of r.tokens.slice(0, 5)) {
      lines.push(`  ${t.symbol.slice(0, 12).padEnd(12)} ${Number.isFinite(t.balance) ? t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "?"} ${Number.isFinite(t.usd) ? compactUsd(t.usd) : "no price"}`)
    }
    if (r.tokens.length > 5) lines.push(`  ...and ${r.tokens.length - 5} more`)
  }

  // The same symbol appearing on two chains with different contracts is the
  // single most useful thing this can surface, and it is invisible per-chain.
  const bySymbol = new Map<string, Array<{ chain: string; address: string; usd: number }>>()
  for (const r of ok) {
    for (const t of r.tokens) {
      const key = t.symbol.toLowerCase()
      if (!bySymbol.has(key)) bySymbol.set(key, [])
      bySymbol.get(key)!.push({ chain: r.chain, address: t.address, usd: t.usd })
    }
  }
  const shared = [...bySymbol.entries()].filter(([, v]) => v.length > 1)
  if (shared.length) {
    lines.push("", `${shared.length} symbol(s) appear on more than one chain:`)
    for (const [sym, entries] of shared.slice(0, 10)) {
      const distinct = new Set(entries.map((e) => e.address.toLowerCase())).size
      lines.push(
        `  ${sym}: ${entries.length} chain(s), ${distinct} distinct contract(s)${distinct > 1 ? " — these are unrelated tokens that share a ticker" : ""}`,
      )
      for (const e of entries) lines.push(`    ${e.chain.padEnd(18)} ${e.address.slice(0, 14)}…${Number.isFinite(e.usd) ? ` ${compactUsd(e.usd)}` : ""}`)
    }
  }

  const active = ok.filter((r) => r.tokens.length || Number.isFinite(r.eth) && r.eth > 0)
  lines.push(
    "",
    `This address holds something on ${active.length} of the ${ok.length} chain(s) that answered. A chain that reports nothing is not proof the address was never used there: Ethplorer indexes a subset of contracts per chain, and its testnet coverage is thinner than its mainnet coverage.`,
  )
  const absurd = ok.flatMap((r) => r.tokens).filter((t) => Number.isFinite(t.usd) && Math.abs(t.usd) > 1e12).length
  lines.push(
    "",
    "Gas token amounts are in each chain's own token, not ETH: the fields are named ETH across the API even on BNB, Linea and Blast, which is an easy and expensive thing to misread.",
  )
  if (absurd) {
    lines.push(
      `${absurd} holding(s) have a derived USD value above a trillion dollars, which is not a valuation: it is a stale or junk price multiplied by a balance. Those are marked implausible above and should be ignored. Ethplorer's price feed covers a fraction of the tokens it indexes, and a missing rate on a thinly traded token produces a number rather than an absence.`,
    )
  } else {
    lines.push("The USD figures are Ethplorer's price feed and are not available for every token, so a token with no price shows no figure rather than a zero.")
  }
  if (failed.length) lines.push(`${failed.length} chain(s) could not be queried: ${failed.map((f) => f.chain).join(", ")}.`)
  return lines.join("\n")
}
