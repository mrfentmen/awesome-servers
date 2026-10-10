const BASE = 'https://blockchain.info';
const UA = 'mrfentmen-blockchain-info-mcp/1.0 (https://github.com/mrfentmen)';
export class BcError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (res.status === 404) throw new BcError(`Not found (404): ${url}`);
  if (!res.ok) throw new BcError(`blockchain.info returned ${res.status}`);
  return (await res.json()) as T;
}

const btc = (sats: unknown): string => {
  const n = Number(sats);
  return Number.isFinite(n) ? `${(n / 1e8).toFixed(8)} BTC` : '?';
};

const usd = (n: unknown): string => {
  const v = Number(n);
  return Number.isFinite(v) ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '?';
};

/** The ticker returns a bare number per currency; label it with the code rather than a $ sign. */
const amount = (code: string, n: unknown): string => {
  const v = Number(n);
  return Number.isFinite(v) ? `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}` : '?';
};

export async function ticker(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Record<string, { last?: number; buy?: number; sell?: number; symbol?: string }>>(`${BASE}/ticker`);
  const keys = ['USD', 'EUR', 'GBP', 'JPY', 'BTC'];
  const rows = keys.filter((k) => d[k]).map((k) => {
    const v = d[k];
    return `${k}: ${amount(k, v?.last)} (buy ${amount(k, v?.buy)} / sell ${amount(k, v?.sell)})`;
  });
  const all = Object.keys(d).map((k) => `${k}: ${amount(k, d[k]?.last)}`);
  return `Bitcoin price:\n${rows.join('\n')}\n\nAll ${all.length} currencies: ${all.join(', ')}`;
}

export async function latestBlock(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ hash?: string; height?: number; time?: number; block_index?: number; txIndexes?: number[] }>(`${BASE}/latestblock`);
  const when = d.time ? new Date(d.time * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '?';
  return [
    `Block height: ${d.height ?? '?'}`,
    `Hash: ${d.hash ?? '?'}`,
    `Mined: ${when}`,
    `Transactions in block: ${d.txIndexes?.length ?? '?'}`,
  ].join('\n');
}

/**
 * Network-wide Bitcoin statistics: market price, hash rate, block pace,
 * miner revenue and total coins mined.
 */
export async function networkStats(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<any>(`${BASE}/stats?format=json`);
  // blockchain.info reports hash_rate in GH/s; 1 EH/s = 1e9 GH/s.
  const hashrate = Number(d?.hash_rate);
  const eh = Number.isFinite(hashrate) ? `${(hashrate / 1e9).toLocaleString(undefined, { maximumFractionDigits: 1 })} EH/s` : '?';
  const coinstotal = Number(d?.totalbc);
  return [
    `Market price: ${usd(d?.market_price_usd)}`,
    `Network hash rate: ${eh}`,
    `Difficulty: ${Number(d?.difficulty).toLocaleString() ?? '?'}`,
    `Block height: ${d?.n_blocks_total ?? '?'}`,
    `Blocks mined in last 24h: ${d?.n_blocks_mined ?? '?'}`,
    `Minutes between blocks: ${Number(d?.minutes_between_blocks).toFixed(2) ?? '?'}`,
    `Transactions in last 24h: ${Number(d?.n_tx).toLocaleString() ?? '?'}`,
    `Estimated transaction volume (24h): ${usd(d?.estimated_transaction_volume_usd)}`,
    `Miners revenue (24h): ${usd(d?.miners_revenue_usd)}`,
    `Total BTC mined: ${Number.isFinite(coinstotal) ? (coinstotal / 1e8).toLocaleString() : '?'}`,
    `Next difficulty retarget block: ${d?.nextretarget ?? '?'}`,
    d?.timestamp ? `As of ${new Date(Number(d.timestamp)).toISOString().replace('T', ' ').slice(0, 19)} UTC` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function address(args: { address?: string }): Promise<string> {
  const addr = (args.address ?? '').trim();
  if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{11,71}$/.test(addr)) {
    throw new BcError('Provide a valid Bitcoin address');
  }
  const d = await get<{ address?: string; n_tx?: number; total_received?: number; total_sent?: number; final_balance?: number; txs?: Array<{ hash?: string; time?: number }> }>(
    `${BASE}/rawaddr/${encodeURIComponent(addr)}?limit=3`
  );
  const txs = d.txs ?? [];
  return [
    `Address: ${d.address ?? addr}`,
    `Transactions: ${d.n_tx ?? '?'}`,
    `Received: ${btc(d.total_received)}`,
    `Sent: ${btc(d.total_sent)}`,
    `Final balance: ${btc(d.final_balance)}`,
    txs.length
      ? `Recent transactions:\n${txs
          .slice(0, 3)
          .map((t) => `  ${t.hash}${t.time ? ` (${new Date(t.time * 1000).toISOString().slice(0, 10)})` : ''}`)
          .join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Lightweight balance check for up to 20 addresses at once. */
export async function addressBalance(args: { addresses: string }): Promise<string> {
  const list = (args.addresses ?? '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (!list.length) throw new BcError('Provide one or more Bitcoin addresses');
  const d = await get<Record<string, { final_balance?: number; n_tx?: number; total_received?: number }>>(
    `${BASE}/balance?active=${list.map(encodeURIComponent).join('|')}`
  );
  const rows = Object.entries(d);
  if (!rows.length) return 'No balance data returned.';
  const total = rows.reduce((s, [, v]) => s + (Number(v.final_balance) || 0), 0);
  return (
    `Balances (${rows.length} address(es), total ${btc(total)}):\n` +
    rows
      .map(([addr, v]) => `${addr}\n  balance ${btc(v.final_balance)} | received ${btc(v.total_received)} | ${v.n_tx ?? '?'} tx`)
      .join('\n')
  );
}

export async function transaction(args: { tx_hash?: string }): Promise<string> {
  const hash = (args.tx_hash ?? '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) throw new BcError('Provide a 64-character transaction hash');
  const d = await get<any>(`${BASE}/rawtx/${hash}`);
  const vin: any[] = Array.isArray(d?.inputs) ? d.inputs : [];
  const vout: any[] = Array.isArray(d?.out) ? d.out : [];
  const totalOut = vout.reduce((s, o) => s + (Number(o?.value) || 0), 0);
  const lines = [
    `Transaction ${d?.hash ?? hash}`,
    `Size ${d?.size ?? '?'} bytes | weight ${d?.weight ?? '?'} | fee ${btc(d?.fee)}`,
    `Inputs: ${d?.vin_sz ?? vin.length} | Outputs: ${d?.vout_sz ?? vout.length}`,
    `Total output: ${btc(totalOut)}`,
  ];
  if (d?.time) lines.push(`Seen: ${new Date(d.time * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  if (d?.block_height) lines.push(`Block: ${d.block_height}`);
  if (vout.length) {
    lines.push('', 'Largest outputs:');
    for (const o of [...vout].sort((a, b) => (Number(b?.value) || 0) - (Number(a?.value) || 0)).slice(0, 5)) {
      const to = o?.addr ?? o?.script ?? 'unknown';
      lines.push(`  ${btc(o?.value)} -> ${to}`);
    }
  }
  return lines.join('\n');
}
// ---- batch-3 tools: extra live market data (2026-09-27) ----
async function plainNumber(path: string): Promise<number> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'text/plain' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new BcError(`blockchain.info returned ${res.status}`);
  return Number((await res.text()).trim());
}

type RawBlock = {
  hash?: string; height?: number; block_index?: number; time?: number; n_tx?: number; size?: number; weight?: number;
  fee?: number; prev_block?: string; next_block?: string[]; mrkl_root?: string; bits?: number; nonce?: number; main_chain?: boolean;
};

function blockSummary(block: RawBlock, label: string): string {
  const when = block.time ? `${new Date(block.time * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC` : '?';
  const lines = [
    label,
    `Height: ${block.height ?? '?'} | hash ${block.hash ?? '?'}`,
    `Mined: ${when} | transactions ${block.n_tx ?? '?'} | size ${Number(block.size ?? 0).toLocaleString()} bytes | weight ${Number(block.weight ?? 0).toLocaleString()}`,
    `Total fees: ${btc(block.fee)} | merkle root ${block.mrkl_root ?? '?'}`,
    `Previous block: ${block.prev_block ?? '?'}`,
  ];
  if (block.next_block?.length) lines.push(`Next block(s): ${block.next_block.join(', ')}`);
  lines.push(`Main chain: ${block.main_chain === undefined ? '?' : block.main_chain ? 'yes' : 'no'} | bits ${block.bits ?? '?'} | nonce ${block.nonce ?? '?'}`);
  return lines.join('\n');
}

export async function blockByHeight(args: { height?: number }): Promise<string> {
  const height = Math.floor(Number(args.height));
  if (!Number.isFinite(height) || height <= 0 || height > 10_000_000) throw new BcError('Provide a block height, e.g. 900000');
  const d = await get<{ blocks?: RawBlock[] }>(`${BASE}/block-height/${height}?format=json`);
  const block = (d.blocks ?? [])[0];
  if (!block) throw new BcError(`No block at height ${height}`);
  return blockSummary(block, `Bitcoin block at height ${height}:`);
}

export async function blockByHash(args: { hash?: string }): Promise<string> {
  const hash = (args.hash ?? '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) throw new BcError('Provide a 64-character block hash');
  const block = await get<RawBlock>(`${BASE}/rawblock/${hash}`);
  if (!block?.hash) throw new BcError(`No block with hash ${hash}`);
  return blockSummary(block, `Bitcoin block ${hash.slice(0, 20)}... at height ${block.height ?? '?'}:`);
}

export async function mempool(_args: Record<string, never> = {}): Promise<string> {
  const pending = await plainNumber('/q/unconfirmedcount');
  const d = await get<{ txs?: { hash?: string; fee?: number; size?: number; vin_sz?: number; vout_sz?: number }[] }>(
    `${BASE}/unconfirmed-transactions?format=json`);
  const rows = d.txs ?? [];
  const count = Number.isFinite(pending) ? pending.toLocaleString() : '?';
  if (!rows.length) return `Bitcoin mempool: ${count} unconfirmed transactions, but no sample was returned.`;
  const fees = rows.map((t) => Number(t.fee ?? 0)).filter((n) => Number.isFinite(n));
  const sizes = rows.map((t) => Number(t.size ?? 0)).filter((n) => Number.isFinite(n));
  const totalFee = fees.reduce((s, n) => s + n, 0);
  const totalSize = sizes.reduce((s, n) => s + n, 0);
  const perByte = (t: { fee?: number; size?: number }) => Number(t.fee ?? 0) / Math.max(Number(t.size ?? 1), 1);
  const fastest = [...rows].sort((a, b) => perByte(b) - perByte(a))[0];
  return [
    `Bitcoin mempool: ${count} unconfirmed transactions right now.`,
    `Newest ${rows.length} waiting: total fees ${btc(totalFee)} over ${totalSize.toLocaleString()} bytes (average ${btc(totalFee / rows.length)} per transaction, ${Math.round(totalSize / rows.length)} bytes).`,
    `Fee range in the sample: ${btc(Math.min(...fees))} to ${btc(Math.max(...fees))}.`,
    `Best fee rate in the sample: ${perByte(fastest).toFixed(1)} sat/byte for ${fastest.hash ?? '?'} (${fastest.vin_sz ?? '?'} inputs, ${fastest.vout_sz ?? '?'} outputs).`,
  ].join('\n');
}

// ---- muxD tools:

export interface TimelineArgs {
  address?: string;
  sample?: number;
}

export interface FeeArgs {
  buckets?: number;
}

/** GET /unconfirmed-transactions?format=json - a sat/byte histogram of the waiting sample. */
export async function feePressure(args: FeeArgs = {}): Promise<string> {
  const bucketCount = Math.min(Math.max(Math.floor(Number(args.buckets ?? 8) || 8), 4), 20);
  const pending = await plainNumber('/q/unconfirmedcount');
  const d = await get<{ txs?: Array<{ hash?: string; fee?: number; size?: number; vin_sz?: number; vout_sz?: number }> }>(
    `${BASE}/unconfirmed-transactions?format=json`
  );
  const rows = Array.isArray(d.txs) ? d.txs : [];
  if (!rows.length) throw new BcError('blockchain.info returned no unconfirmed transactions to analyse.');
  const rates = rows
    .map((t) => ({ r: Number(t.fee ?? 0) / Math.max(Number(t.size ?? 1), 1), t }))
    .filter((x) => Number.isFinite(x.r) && x.r >= 0);
  if (!rates.length) throw new BcError('No transaction in the sample reported a usable fee and size.');
  const sorted = [...rates].sort((a, b) => a.r - b.r);
  const max = sorted[sorted.length - 1].r;
  const edge = Math.max(max, 1);
  const width = edge / bucketCount;
  const buckets = new Array<number>(bucketCount).fill(0);
  for (const x of sorted) buckets[Math.min(bucketCount - 1, Math.floor(x.r / width))] += 1;
  const countAt = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))].r;
  const sat = (n: number) => n.toFixed(1);
  const bar = (n: number) => '#'.repeat(Math.max(1, Math.round((n / Math.max(...buckets)) * 40)));

  return [
    `Fee pressure: ${Number.isFinite(pending) ? pending.toLocaleString() : '?'} transactions waiting, ${rows.length} sampled by blockchain.info`,
    `Fee rate range in the sample: ${sat(sorted[0].r)} to ${sat(max)} sat/byte`,
    `Median ${sat(countAt(0.5))} sat/byte | 25th percentile ${sat(countAt(0.25))} | 75th percentile ${sat(countAt(0.75))} | 90th percentile ${sat(countAt(0.9))}`,
    '',
    'Distribution of the sample:',
    ...buckets.map((n, i) => `  ${sat(i * width).padStart(6)} - ${sat((i + 1) * width).padStart(6)} sat/byte | ${String(n).padStart(4)} | ${bar(n)}`),
    '',
    `Transactions under 10 sat/byte: ${sorted.filter((x) => x.r < 10).length} of ${sorted.length}`,
    `Transactions 10-50 sat/byte: ${sorted.filter((x) => x.r >= 10 && x.r < 50).length}`,
    `Transactions over 50 sat/byte: ${sorted.filter((x) => x.r >= 50).length}`,
  ].join('\n');
}
