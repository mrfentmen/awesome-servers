const UA = 'mrfentmen-blockcypher-mcp/1.0';

const COINS = new Set(['btc', 'eth', 'ltc', 'doge']);

export interface CoinAddressArgs {
  coin: string;
  address: string;
}
export interface CoinHeightArgs {
  coin: string;
  height: string;
}
export interface CoinTxArgs {
  coin: string;
  txid: string;
}

export async function addressBalance(args: CoinAddressArgs): Promise<string> {
  const coin = String(args.coin || 'btc').toLowerCase();
  if (!COINS.has(coin)) throw new Error(`Unsupported coin ${coin}. Use btc, eth, ltc, or doge.`);
  const res = await fetch(`https://api.blockcypher.com/v1/${coin}/main/addrs/${encodeURIComponent(args.address)}/balance`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BlockCypher returned ${res.status}`);
  const d = (await res.json()) as { address?: string; balance?: number; unconfirmed_balance?: number; final_balance?: number; total_received?: number };
  if (d.address == null) throw new Error('No address returned.');
  return `Address ${d.address}\nBalance: ${(d.balance ?? 0) / 1e8} ${coin.toUpperCase()}\nFinal balance: ${(d.final_balance ?? 0) / 1e8}\nUnconfirmed: ${(d.unconfirmed_balance ?? 0) / 1e8}\nTotal received: ${(d.total_received ?? 0) / 1e8}`;
}

export async function blockInfo(args: CoinHeightArgs): Promise<string> {
  const coin = String(args.coin || 'btc').toLowerCase();
  if (!COINS.has(coin)) throw new Error(`Unsupported coin ${coin}.`);
  const res = await fetch(`https://api.blockcypher.com/v1/${coin}/main/blocks/${encodeURIComponent(args.height)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BlockCypher returned ${res.status}`);
  const d = (await res.json()) as { height?: number; hash?: string; time?: string; n_tx?: number; total?: number; size?: number };
  if (d.hash == null) throw new Error('No block returned.');
  return `Block ${d.height}\nHash: ${d.hash}\nTime: ${d.time ?? '?'}\nTransactions: ${d.n_tx ?? 0}\nSize: ${d.size ?? 0} bytes\nTotal moved: ${(d.total ?? 0) / 1e8} ${coin.toUpperCase()}`;
}

export async function txInfo(args: CoinTxArgs): Promise<string> {
  const coin = String(args.coin || 'btc').toLowerCase();
  if (!COINS.has(coin)) throw new Error(`Unsupported coin ${coin}.`);
  const res = await fetch(`https://api.blockcypher.com/v1/${coin}/main/txs/${encodeURIComponent(args.txid)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BlockCypher returned ${res.status}`);
  const d = (await res.json()) as { hash?: string; block_height?: number; confirmations?: number; total?: number; fees?: number; size?: number; received?: string };
  if (d.hash == null) throw new Error('No transaction returned.');
  return `Transaction ${d.hash}\nBlock: ${d.block_height ?? 'unconfirmed'}\nConfirmations: ${d.confirmations ?? 0}\nTotal: ${(d.total ?? 0) / 1e8} ${coin.toUpperCase()}\nFees: ${(d.fees ?? 0) / 1e8}\nSize: ${d.size ?? 0} bytes\nReceived: ${d.received ?? '?'}`;
}

// ---- muxA tools:
// The three existing tools read one block, one transaction or one balance and
// divide every coin by 1e8. These add the chain document itself, the recent
// activity of an address, and the newest transactions on a chain, and they
// convert amounts with the right number of decimals per coin.
const BC_UNITS: Record<string, { divisor: number; label: string }> = {
  btc: { divisor: 1e8, label: 'BTC' },
  ltc: { divisor: 1e8, label: 'LTC' },
  doge: { divisor: 1e8, label: 'DOGE' },
  // Ether is reported in wei, so the atomic unit has eighteen decimals and
  // dividing it by 1e8 would be wrong by ten orders of magnitude.
  eth: { divisor: 1e18, label: 'ETH' },
};

interface BcChain {
  name?: string;
  height?: number;
  hash?: string;
  time?: string;
  previous_hash?: string;
  peer_count?: number;
  unconfirmed_count?: number;
  high_fee_per_kb?: number;
  medium_fee_per_kb?: number;
  low_fee_per_kb?: number;
  base_fee?: number;
  high_gas_price?: number;
  medium_gas_price?: number;
  low_gas_price?: number;
  high_priority_fee?: number;
  medium_priority_fee?: number;
  low_priority_fee?: number;
  last_fork_height?: number;
}

interface BcTx {
  hash?: string;
  block_height?: number;
  confirmations?: number;
  total?: number;
  fees?: number;
  size?: number;
  vsize?: number;
  received?: string;
  preference?: string;
  double_spend?: boolean;
  addresses?: string[];
  vin_sz?: number;
  vout_sz?: number;
}

interface BcAddressFull {
  address?: string;
  n_tx?: number;
  final_n_tx?: number;
  unconfirmed_n_tx?: number;
  total_received?: number;
  total_sent?: number;
  final_balance?: number;
  unconfirmed_balance?: number;
  hasMore?: boolean;
  txs?: BcTx[];
}

function bcCoin(raw: string | undefined): string {
  const coin = String(raw || 'btc').toLowerCase();
  if (!COINS.has(coin)) throw new Error(`Unsupported coin ${coin}. Use btc, eth, ltc, or doge.`);
  return coin;
}

// The public API allows only a few requests per second without a token and
// answers a bare 429 body, so the message says what to do about it.
async function bcGet<T>(path: string, missing: string): Promise<T> {
  const res = await fetch(`https://api.blockcypher.com/v1/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 429) {
    throw new Error(
      'BlockCypher rate limit reached. This server sends no API token, so the public limit of a few requests per second applies; wait a few seconds and retry.',
    );
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (res.status === 404 && body?.error) throw new Error(`BlockCypher: ${body.error}`);
    throw new Error(`BlockCypher answered ${res.status}${body?.error ? `: ${body.error}` : ''}`);
  }
  return (await res.json()) as T;
}

function bcAmount(coin: string, atomic: number | undefined): string {
  const unit = BC_UNITS[coin];
  if (typeof atomic !== 'number' || !Number.isFinite(atomic)) return 'not reported';
  const value = atomic / unit.divisor;
  const decimals = value !== 0 && Math.abs(value) < 0.0001 ? 10 : 8;
  return `${value.toLocaleString('en-US', { maximumFractionDigits: decimals })} ${unit.label}`;
}

// BlockCypher leaves the moved value at zero on Ether transactions, so a zero
// there is reported as not recorded rather than as a transaction that moved
// nothing, which is what it means on the account based chains.
function bcMoved(coin: string, tx: BcTx): string {
  if (coin === 'eth' && !tx.total) return 'value not recorded for ETH by BlockCypher';
  return bcAmount(coin, tx.total);
}

function bcTxRow(coin: string, tx: BcTx, index: number): string[] {
  const state =
    tx.block_height === undefined || tx.block_height < 0
      ? 'unconfirmed'
      : `block ${tx.block_height} with ${tx.confirmations ?? 0} confirmations`;
  return [
    `    ${String(index).padStart(2)}. ${tx.hash ?? 'hash not reported'}`,
    `        ${state} | moved ${bcMoved(coin, tx)} | fee ${bcAmount(coin, tx.fees)} | ${
      tx.vsize ?? tx.size ?? '?'
    } vbytes${tx.preference ? ` | fee preference ${tx.preference}` : ''}${
      tx.double_spend ? ' | flagged as a double spend' : ''
    }`,
  ];
}

export async function recentTransactions(args: { coin?: string; limit?: number }): Promise<string> {
  const coin = bcCoin(args.coin);
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10) || 10, 50));
  const rows = await bcGet<BcTx[]>(`${coin}/main/txs?limit=${limit}`, `BlockCypher had no transactions for ${coin}`);
  if (!Array.isArray(rows) || !rows.length) return `BlockCypher returned no recent transactions for ${coin}.`;

  // The limit parameter is advisory on this endpoint, so the list is cut here
  // to the count that was actually asked for.
  const shown = rows.slice(0, limit);
  const unconfirmed = shown.filter((tx) => (tx.block_height ?? -1) < 0).length;
  const moved = shown.reduce((sum, tx) => sum + (tx.total ?? 0), 0);
  const fees = shown.reduce((sum, tx) => sum + (tx.fees ?? 0), 0);

  return [
    `Newest ${coin.toUpperCase()} transactions as BlockCypher sees them, ${shown.length} of the ${
      rows.length
    } returned:`,
    `  ${unconfirmed} of them unconfirmed, ${shown.length - unconfirmed} already in a block.`,
    `  Moved ${bcAmount(coin, moved)} in total with ${bcAmount(coin, fees)} of fees.`,
    '',
    ...shown.flatMap((tx, index) => bcTxRow(coin, tx, index + 1)),
    '',
    '  A negative block height means the transaction is still in the mempool, so it can be replaced or dropped.',
    '  This endpoint reports what BlockCypher has relayed recently, which is a sample of the network rather than every transaction.',
  ].join('\n');
}
