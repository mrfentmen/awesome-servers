const BLOCKSTREAM = "https://blockstream.info/api"
const MEMPOOL = "https://mempool.space/api"
const UA = "mrfentmen-blockchain-mcp/1.0 (https://github.com/mrfentmen)"
export class BlockchainError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new BlockchainError("Blockchain API rate limit hit, wait and retry")
  if (!res.ok) throw new BlockchainError(`Blockchain API error ${res.status}`)
  const text = (await res.text()).trim()
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export async function latestHeight(args: Record<string, never>): Promise<string> {
  const raw = await get<number | string>(`${BLOCKSTREAM}/blocks/tip/height`)
  const h = Number(raw)
  if (!Number.isFinite(h)) throw new BlockchainError("Blockstream returned an unexpected height value")
  const hash = await get<string>(`${BLOCKSTREAM}/blocks/tip/hash`)
  return `Latest block height: ${h}\nBlock hash: ${hash}`
}

export async function blockInfo(args: { height?: number }): Promise<string> {
  const height = args.height
  if (height === undefined || height <= 0) throw new BlockchainError("Provide a positive block height")
  const hash = await get<string>(`${BLOCKSTREAM}/block-height/${height}`)
  const b = await get<any>(`${BLOCKSTREAM}/block/${hash}`)
  const fee = (b?.fee ?? 0) / 1e8
  const size = (b?.size ?? 0) / 1024
  return `Block ${height} (${hash.slice(0, 16)}...)\nTime: ${new Date((b?.timestamp ?? 0) * 1000).toISOString()}\nTransactions: ${b?.tx_count ?? "n/a"}\nMining fee: ${fee.toFixed(8)} BTC\nSize: ${size.toFixed(1)} KB`
}

export async function feeEstimates(args: Record<string, never>): Promise<string> {
  const f = await get<any>(`${MEMPOOL}/v1/fees/recommended`)
  return `Fastest fee: ${f?.fastestFee ?? "n/a"} sat/vB\nHalf hour fee: ${f?.halfHourFee ?? "n/a"} sat/vB\nHour fee: ${f?.hourFee ?? "n/a"} sat/vB\nEconomy fee: ${f?.economyFee ?? "n/a"} sat/vB\nMinimum fee: ${f?.minimumFee ?? "n/a"} sat/vB`
}

export async function addressInfo(args: { address?: string }): Promise<string> {
  const addr = (args.address ?? "").trim()
  if (!addr) throw new BlockchainError("Provide a Bitcoin address")
  const d = await get<any>(`${BLOCKSTREAM}/address/${addr}`)
  const stats = d?.chain_stats ?? {}
  const funded = (stats?.funded_txo_sum ?? 0) / 1e8
  const spent = (stats?.spent_txo_sum ?? 0) / 1e8
  return `Address: ${addr}\nBalance: ${(funded - spent).toFixed(8)} BTC\nReceived: ${funded.toFixed(8)} BTC\nSent: ${spent.toFixed(8)} BTC\nTransactions: ${stats?.tx_count ?? "n/a"}`
}

// ---- muxA tools:
interface BtcVout {
  scriptpubkey_address?: string;
  value?: number;
}

interface BtcStatus {
  confirmed?: boolean;
  block_height?: number;
  block_time?: number;
}

interface BtcTx {
  txid?: string;
  fee?: number;
  vout?: BtcVout[];
  status?: BtcStatus;
}

interface MempoolStats {
  count?: number;
  vsize?: number;
  total_fee?: number;
  fee_histogram?: Array<[number, number]>;
}

interface MempoolBlock {
  id?: string;
  height?: number;
  timestamp?: number;
  tx_count?: number;
  size?: number;
  weight?: number;
  difficulty?: number;
  extras?: { reward?: number };
}

const SATS = 1e8;

function btc(amount: number): string {
  return `${(amount / SATS).toFixed(8)} BTC`;
}

export interface AddressTxsArgs {
  address?: string;
  limit?: number;
}

export interface MempoolArgs {
  bands?: number;
}

export interface RecentBlocksArgs {
  limit?: number;
}

export async function recentBlocks(args: RecentBlocksArgs): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 5) || 5, 15));
  const blocks = await get<MempoolBlock[]>(`${MEMPOOL}/v1/blocks`);
  if (!Array.isArray(blocks) || !blocks.length) return 'mempool.space returned no recent blocks.';
  const rows = blocks.slice(0, limit).map((b) => {
    const when = b.timestamp
      ? new Date(b.timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19)
      : 'not reported';
    const reward = typeof b.extras?.reward === 'number' ? btc(b.extras.reward) : 'not reported';
    const difficulty =
      typeof b.difficulty === 'number' ? b.difficulty.toExponential(6) : 'not reported';
    return (
      `      height ${b.height ?? '?'} | ${when}Z | ${b.tx_count ?? '?'} txs | ` +
      `${((b.size ?? 0) / 1024).toFixed(1)} KB | reward ${reward} | difficulty ${difficulty}`
    );
  });
  return [
    `Latest ${rows.length} Bitcoin blocks (mempool.space):`,
    rows.join('\n'),
  ].join('\n');
}
