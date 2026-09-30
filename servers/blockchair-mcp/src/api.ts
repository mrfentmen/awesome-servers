const BASE = 'https://api.blockchair.com';
const UA = 'mrfentmen-blockchair-mcp/1.0';

export interface ChainArgs {
  chain?: string;
}

export async function stats(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/bitcoin/stats`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Blockchair returned ${res.status}`);
  const d = (await res.json()) as { data?: { blocks?: number; transactions?: number; outputs?: number; market_price_usd?: number; mempool_transactions?: number; average_transaction_fee_usd?: number; largest_transaction_24h?: number } };
  const s = d.data ?? {};
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '?');
  return [
    'Blockchair Bitcoin stats:',
    `Blocks: ${fmt(s.blocks)} | Transactions: ${fmt(s.transactions)}`,
    s.market_price_usd != null ? `Market price: $${s.market_price_usd}` : null,
    s.mempool_transactions != null ? `Mempool: ${fmt(s.mempool_transactions)} txs` : null,
    s.average_transaction_fee_usd != null ? `Avg tx fee: $${s.average_transaction_fee_usd}` : null,
  ].filter(Boolean).join('\n');
}

export async function chain(args: ChainArgs): Promise<string> {
  const chain = (args?.chain ?? 'bitcoin').trim().toLowerCase();
  const res = await fetch(`${BASE}/${encodeURIComponent(chain)}/stats`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Blockchair returned ${res.status}`);
  const d = (await res.json()) as { data?: { blocks?: number; transactions?: number; market_price_usd?: number } };
  const s = d.data ?? {};
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : '?');
  return [
    `Blockchair ${chain} stats:`,
    `Blocks: ${fmt(s.blocks)} | Transactions: ${fmt(s.transactions)}`,
    s.market_price_usd != null ? `Market price: $${s.market_price_usd}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxP tools:

const BCHAIR_CHAINS = [
  "bitcoin",
  "ethereum",
  "dogecoin",
  "litecoin",
  "bitcoin-cash",
  "zcash",
  "monero",
  "dash",
  "stellar",
  "ripple",
]

interface BchairStats {
  blocks?: number
  best_block_height?: number
  best_block_time?: string
  best_block_hash?: string
  transactions?: number
  transactions_24h?: number
  blocks_24h?: number
  outputs?: number
  average_transaction_fee_24h?: number
  average_transaction_fee_usd_24h?: number
  median_transaction_fee_24h?: number
  median_transaction_fee_usd_24h?: number
  largest_transaction_24h?: number
  suggested_transaction_fee_per_byte_sat?: number
  mempool_transactions?: number
  mempool_size?: number
  mempool_outputs?: number
  mempool_total_fee_usd?: number
  mempool_tps?: number
  hashrate_24h?: number
  difficulty?: number
  next_difficulty_estimate?: number
  next_retarget_time_estimate?: string
  market_price_usd?: number
  market_cap_usd?: number
  market_dominance_percentage?: number
  market_price_usd_change_24h_percentage?: number
  inflation_24h?: number
  inflation_usd_24h?: number
  blockchain_size?: number
  nodes?: number
  hodling_addresses?: number
  cdd_24h?: number
}

async function bchairFetch(chain: string): Promise<{ stats: BchairStats; height: number | null }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(chain)}/stats`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Blockchair returned HTTP ${res.status} for ${chain}.`)
  const body = await res.text()
  if (!body.trim()) throw new Error(`Blockchair returned an empty body for ${chain}.`)
  let d: { data?: BchairStats; context?: { code?: number } }
  try {
    d = JSON.parse(body) as { data?: BchairStats; context?: { code?: number } }
  } catch {
    throw new Error(`Blockchair returned something that is not JSON for ${chain}.`)
  }
  const stats = d.data ?? {}
  if (typeof stats.blocks !== "number" && typeof stats.best_block_height !== "number") {
    throw new Error(`Blockchair has no block statistics for ${chain}, so it may not be a chain it tracks.`)
  }
  return { stats, height: d.context?.code ?? null }
}

const bcNum = (value: number | undefined): string => (typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "not reported")

const bcUsd = (value: number | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "not reported"

export interface ChainComparisonArgs {
  chains?: string
}

export interface MempoolPressureArgs {
  chain?: string
  chains?: string
}

