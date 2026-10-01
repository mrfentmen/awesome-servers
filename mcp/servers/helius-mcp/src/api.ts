export class HeliusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HeliusError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.HELIUS_API_KEY
  if (!k) throw new HeliusError("Set the HELIUS_API_KEY environment variable.")
  return k
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new HeliusError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getBalances(address: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(String(address))}/balances`;
  const qs = new URLSearchParams();
  qs.append("api-key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTransactions(address: string, limit?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(String(address))}/transactions`;
  const qs = new URLSearchParams();
  qs.append("api-key", key);
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getNfts(address: string, page?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(String(address))}/nfts`;
  const qs = new URLSearchParams();
  qs.append("api-key", key);
  if (page !== undefined) qs.append("page", String(page));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTokenMetadata(mints: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.helius.xyz/v0/token-metadata`;
  const qs = new URLSearchParams();
  qs.append("api-key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const mintAccounts = mints.split(",").map((m) => m.trim()).filter(Boolean);
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mintAccounts }) });
  return pretty(data);
}

export async function parseTransactions(transactions: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.helius.xyz/v0/transactions`;
  const qs = new URLSearchParams();
  qs.append("api-key", key);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const txs = transactions.split(",").map((m) => m.trim()).filter(Boolean);
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactions: txs }) });
  return pretty(data);
}

// ---- muxG tools:
const SOLANA_RPC = "https://api.mainnet-beta.solana.com"
const DEXSCREENER_SEARCH = "https://api.dexscreener.com/latest/dex/search"
const DEXSCREENER_TOKEN = "https://api.dexscreener.com/tokens/v1/solana"

const WSOL = "So11111111111111111111111111111111111111112"

type HeliusRow = Record<string, unknown>

interface RpcEnvelope<T> {
  jsonrpc?: string
  id?: number
  result?: T
  error?: { code?: number; message?: string }
}

async function rpc<T>(method: string, params: unknown[], attempt = 0): Promise<T> {
  let res: Response
  try {
    res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "User-Agent": "helius-mcp/1.0", Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)))
      return rpc<T>(method, params, attempt + 1)
    }
    throw new HeliusError(`Network error: ${(e as Error).message}`)
  }
  const text = await res.text()
  if (!res.ok) {
    if (res.status === 429 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
      return rpc<T>(method, params, attempt + 1)
    }
    throw new HeliusError(`Solana RPC returned ${res.status}: ${text.slice(0, 200)}`)
  }
  if (!text.trim()) throw new HeliusError("Solana RPC returned an empty body.")
  const body = JSON.parse(text) as RpcEnvelope<T>
  if (body.error) throw new HeliusError(`Solana RPC error ${body.error.code ?? "?"}: ${body.error.message ?? "no message"}`)
  if (body.result === undefined) throw new HeliusError(`Solana RPC returned no result for ${method}.`)
  return body.result
}

function solanaAddress(value: string): string {
  const address = String(value ?? "").trim()
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new HeliusError(`"${value}" is not a Solana address.`)
  }
  return address
}

interface ParsedTokenAmount {
  mint?: string
  owner?: string
  tokenAmount?: { amount?: string; decimals?: number; uiAmount?: number | null; uiAmountString?: string }
}

function uiAmount(entry: ParsedTokenAmount): number | null {
  if (typeof entry.tokenAmount?.uiAmount === "number") return entry.tokenAmount.uiAmount
  const raw = entry.tokenAmount?.uiAmountString
  const n = raw === undefined ? Number.NaN : Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * The native RPC view of a wallet: SOL balance, account owner, whether it is
 * executable, and the SPL tokens it holds. No Helius key needed.
 */
export async function walletHoldings(args: { address: string; limit?: number }): Promise<string> {
  const address = solanaAddress(args?.address)
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40)

  const [version, lamports, account, tokens] = await Promise.all([
    rpc<{ "solana-core"?: string; "feature-set"?: number }>("getVersion", []),
    rpc<{ value?: number }>("getBalance", [address]),
    rpc<HeliusRow>("getAccountInfo", [address, { encoding: "jsonParsed" }]),
    rpc<HeliusRow>("getTokenAccountsByOwner", [address, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }]),
  ])

  const sol = Number(lamports?.value ?? 0) / 1e9
  const info = ((account?.value ?? {}) as HeliusRow)
  const lines = [
    `Wallet ${address} on Solana mainnet (RPC ${version["solana-core"] ?? "version not reported"})`,
    `SOL balance: ${sol.toFixed(6)} SOL${Number.isInteger(sol) ? "" : ""}`,
  ]
  if (info && Object.keys(info).length) {
    const data = (info.data ?? {}) as HeliusRow
    const parsed = ((data.parsed ?? {}) as HeliusRow).info as HeliusRow | undefined
    lines.push(
      `Account: owner program ${String(parsed?.owner ?? data.program ?? "not reported")} · executable ${String(info.executable ?? "not reported")} · lamports ${Number(info.lamports ?? 0).toLocaleString()}`,
    )
    if (typeof data.space === "number") lines.push(`Data size: ${data.space} byte(s)`)
  } else {
    lines.push("Account: no data on chain at this address (a wallet with no SOL balance has no account record).")
  }

  const value = (tokens?.value ?? []) as Array<{ account?: HeliusRow }>
  const holdings = value
    .map((entry) => {
      const parsed = (((entry.account?.data ?? {}) as HeliusRow).parsed ?? {}) as HeliusRow
      const amount = (parsed.info ?? {}) as ParsedTokenAmount
      return { mint: amount.mint ?? "mint not reported", amount: uiAmount(amount) ?? 0 }
    })
    .filter((holding) => holding.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  lines.push("")
  lines.push(`SPL token accounts with a balance: ${holdings.length} (of ${value.length} account(s) held)`)
  for (const [i, holding] of holdings.slice(0, n).entries()) {
    lines.push(`  ${i + 1}. ${holding.mint} — ${holding.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}`)
  }
  if (holdings.length > n) lines.push(`  ...and ${holdings.length - n} more token(s).`)
  if (!holdings.length) lines.push("  No SPL token has a non-zero balance at this address.")
  if (holdings.some((h) => h.mint === WSOL)) lines.push(`  Note: ${WSOL} is wrapped SOL; the raw SOL balance is printed above.`)
  return lines.join("\n")
}

interface DexPair {
  chainId?: string
  dexId?: string
  pairAddress?: string
  priceUsd?: string
  priceNative?: string
  priceChange?: HeliusRow
  volume?: HeliusRow
  liquidity?: HeliusRow
  txns?: { h5?: HeliusRow; h24?: { buys?: number; sells?: number }; h6?: HeliusRow }
  baseToken?: { address?: string; symbol?: string; name?: string }
  quoteToken?: { address?: string; symbol?: string; name?: string }
  pairCreatedAt?: number
  url?: string
}

/** Where an SPL token actually trades: live price, liquidity and volume by pair. */
export async function tokenMarket(args: { token?: string; query?: string; limit?: number }): Promise<string> {
  const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20)
  const token = String(args?.token ?? "").trim()
  const query = String(args?.query ?? "").trim()
  let path: string
  let label: string
  if (token) {
    const address = solanaAddress(token)
    path = `${DEXSCREENER_TOKEN}/${encodeURIComponent(address)}`
    label = `token ${address}`
  } else if (query) {
    path = `${DEXSCREENER_SEARCH}?q=${encodeURIComponent(query)}`
    label = `search "${query}"`
  } else {
    throw new HeliusError("Provide a token mint address, or a query to search by symbol.")
  }

  const res = await fetch(path, { headers: { "User-Agent": "helius-mcp/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new HeliusError("DexScreener rate limit hit; wait and retry.")
  if (!res.ok) throw new HeliusError(`DexScreener returned ${res.status}`)
  const text = await res.text()
  if (!text.trim()) throw new HeliusError("DexScreener returned an empty body.")
  const parsed = JSON.parse(text) as { pairs?: DexPair[] | null; schemaVersion?: string } | DexPair[]

  const pairs: DexPair[] = Array.isArray(parsed) ? parsed : (parsed.pairs ?? [])
  const solanaPairs = pairs.filter((pair) => pair.chainId === "solana")
  const pool = solanaPairs.length ? solanaPairs : pairs
  if (!pool.length) throw new HeliusError(`DexScreener has no pair for ${label} on Solana.`)

  const best = pool.reduce((a, b) => (Number(b.liquidity?.usd ?? 0) > Number(a.liquidity?.usd ?? 0) ? b : a))
  const created = typeof best.pairCreatedAt === "number" && best.pairCreatedAt > 0 ? new Date(best.pairCreatedAt).toISOString().slice(0, 10) : null
  const totalLiquidity = pool.reduce((sum, pair) => sum + (Number(pair.liquidity?.usd) || 0), 0)
  const lines = [
    `DexScreener view of ${label}: ${pool.length} Solana pair(s)`,
    `Deepest pool: ${best.baseToken?.symbol ?? "?"}/${best.quoteToken?.symbol ?? "?"} on ${best.dexId ?? "dex not reported"} at ${best.priceUsd ? `$${Number(best.priceUsd).toPrecision(6)}` : "price not reported"} · liquidity $${Number(best.liquidity?.usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    `Liquidity across the listed pairs: $${totalLiquidity.toLocaleString("en-US", { maximumFractionDigits: 0 })}${created ? ` · deepest pool opened ${created}` : ""}`,
    "",
  ]
  for (const [i, pair] of pool.slice(0, n).entries()) {
    const change = pair.priceChange?.h24
    lines.push(`  ${i + 1}. ${pair.baseToken?.symbol ?? "?"} on ${pair.dexId ?? "?"} — $${Number(pair.priceUsd ?? 0).toPrecision(6)}${change ? ` (24h ${Number(change) >= 0 ? "+" : ""}${Number(change).toFixed(1)}%)` : ""}`)
    lines.push(`     liquidity $${Number(pair.liquidity?.usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} · volume 24h $${Number(pair.volume?.h24 ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} · txns 24h ${pair.txns?.h24?.buys ?? "?"} buys / ${pair.txns?.h24?.sells ?? "?"} sells`)
    if (pair.pairAddress) lines.push(`     pair ${pair.pairAddress}`)
  }
  if (pool.length > n) lines.push(`  ...and ${pool.length - n} more pair(s) not shown.`)
  return lines.join("\n")
}
