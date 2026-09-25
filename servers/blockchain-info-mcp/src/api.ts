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
