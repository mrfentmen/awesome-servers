const BASE = 'https://blockchain.info';
const UA = 'mrfentmen-blockchain-info-mcp/1.0 (https://github.com/mrfentmen)';
export class BcError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new BcError(`blockchain.info returned ${res.status}`);
  return (await res.json()) as T;
}

export async function ticker(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Record<string, { last?: number; buy?: number; sell?: number; symbol?: string }>>(`${BASE}/ticker`);
  const keys = ['USD', 'EUR', 'GBP', 'JPY', 'BTC'];
  const rows = keys.filter((k) => d[k]).map((k) => {
    const v = d[k];
    return `${k}: last $${v?.last ?? '?'} (buy ${v?.buy ?? '?'} / sell ${v?.sell ?? '?'})`;
  });
  const all = Object.keys(d).map((k) => `${k}: ${d[k]?.last ?? '?'}`);
  return `Bitcoin price:\n${rows.join('\n')}\n\nAll ${all.length} currencies: ${all.join(', ')}`;
}

export async function latestBlock(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ hash?: string; height?: number; time?: number; block_index?: number }>(`${BASE}/latestblock`);
  return [
    `Block height: ${d.height ?? '?'}`,
    `Hash: ${d.hash ?? '?'}`,
    `Time: ${d.time ? new Date(d.time * 1000).toISOString() : '?'}`,
  ].join('\n');
}

export async function address(args: { address?: string }): Promise<string> {
  const addr = (args.address ?? '').trim();
  if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) throw new BcError('Provide a valid Bitcoin address');
  const d = await get<{ address?: string; n_tx?: number; total_received?: number; total_sent?: number; final_balance?: number; txs?: Array<{ hash?: string }> }>(`${BASE}/rawaddr/${encodeURIComponent(addr)}?limit=3`);
  const txs = d.txs ?? [];
  return [
    `Address: ${d.address ?? addr}`,
    `Transactions: ${d.n_tx ?? '?'}`,
    `Received: ${((d.total_received ?? 0) / 1e8).toFixed(8)} BTC`,
    `Sent: ${((d.total_sent ?? 0) / 1e8).toFixed(8)} BTC`,
    `Final balance: ${((d.final_balance ?? 0) / 1e8).toFixed(8)} BTC`,
    txs.length ? `Recent txs:\n${txs.slice(0, 3).map((t) => `  ${t.hash}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}
