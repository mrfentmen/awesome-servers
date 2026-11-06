/**
 * Blockchair — blockchain statistics. Keyless (rate limited).
 *
 * Verified live: GET /{chain}/stats returns `{data:{...}, context:{...}}` with
 * blocks, transactions, mempool size, market price and cap, dominance and
 * hashrate.
 */
const API = "https://api.blockchair.com"

export class BlockchairError extends Error {}

interface Stats {
  blocks?: number
  transactions?: number
  mempool_transactions?: number
  mempool_size?: number
  circulation?: number
  market_price_usd?: number
  market_cap_usd?: number
  market_dominance_percentage?: number
  hashrate_24h?: string
  difficulty?: number
  blockchain_size?: number
  best_block_height?: number
  best_block_time?: string
  average_transaction_fee_usd_24h?: number
}

interface StatsBody {
  data?: Stats
  context?: { code?: number; error?: string }
}

const CHAIN = /^[a-z0-9][a-z0-9-]{1,39}$/

async function get(url: string, timeoutMs = 30000): Promise<StatsBody> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "blockchair-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new BlockchairError("Blockchair does not track that chain")
    if (res.status === 430) throw new BlockchairError("Blockchair rate limit reached, try again in a minute")
    if (!res.ok) throw new BlockchairError(`Blockchair responded ${res.status}`)
    return (await res.json()) as StatsBody
  } catch (e) {
    if (e instanceof BlockchairError) throw e
    if ((e as Error).name === "AbortError") throw new BlockchairError("Blockchair request timed out")
    throw new BlockchairError(`Blockchair request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const num = (v: number | undefined, suffix = ""): string =>
  typeof v === "number" && Number.isFinite(v) ? `${v.toLocaleString("en-US")}${suffix}` : "n/a"

const usd = (v: number | undefined): string => {
  if (typeof v !== "number" || !Number.isFinite(v)) return "n/a"
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}b`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}m`
  return `$${v.toFixed(2)}`
}

export async function stats(chain: string): Promise<string> {
  const c = chain.trim().toLowerCase()
  if (!CHAIN.test(c)) throw new BlockchairError(`"${chain}" is not a Blockchair chain name`)

  const body = await get(`${API}/${c}/stats`)
  const d = body.data
  if (!d) throw new BlockchairError(body.context?.error ?? `Blockchair returned no stats for ${c}`)

  return [
    `${c} — chain statistics`,
    "",
    `Blocks: ${num(d.blocks)}`,
    `Transactions: ${num(d.transactions)}`,
    `Mempool: ${num(d.mempool_transactions)} transactions`,
    d.blockchain_size !== undefined ? `Chain size: ${(d.blockchain_size / 1e9).toFixed(2)} GB` : "",
    `Price: ${usd(d.market_price_usd)}`,
    `Market cap: ${usd(d.market_cap_usd)}`,
    d.market_dominance_percentage !== undefined ? `Dominance: ${d.market_dominance_percentage.toFixed(2)}%` : "",
    d.hashrate_24h ? `Hashrate 24h: ${d.hashrate_24h}` : "",
    d.average_transaction_fee_usd_24h !== undefined ? `Average fee 24h: ${usd(d.average_transaction_fee_usd_24h)}` : "",
    d.best_block_time ? `Latest block: ${d.best_block_time}` : "",
    d.circulation !== undefined ? `Circulation (smallest unit): ${num(d.circulation)}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
