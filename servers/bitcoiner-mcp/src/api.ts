const UA = 'mrfentmen-bitcoiner-mcp/1.0';

export async function fees(_args?: unknown): Promise<string> {
  const res = await fetch('https://bitcoiner.live/api/fees/estimates/latest', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`bitcoiner.live returned ${res.status}`);
  const d = (await res.json()) as { timestamp?: number; estimates?: Record<string, { sat_per_vbyte?: number; total?: { usd?: number } }> };
  const est = d.estimates ?? {};
  const rows = Object.entries(est).map(([k, v]) => `${k} blocks: ${v?.sat_per_vbyte ?? '?'} sat/vB (~$${v?.total?.usd ?? '?'})`);
  return `Bitcoin fee estimates (${d.timestamp ? new Date(d.timestamp * 1000).toISOString() : 'now'}):\n` + rows.join('\n');
}

// ---- muxA tools:

const MEMPOOL = 'https://mempool.space/api';

async function mpJson<T>(path: string): Promise<T> {
  const res = await fetch(`${MEMPOOL}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new Error(`mempool.space has nothing at ${path}`);
  if (!res.ok) throw new Error(`mempool.space returned ${res.status} for ${path}`);
  return (await res.json()) as T;
}

function iso(unix: unknown): string {
  const n = Number(unix);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : 'not reported';
}

export interface BlockArgs {
  height?: number;
}

export async function blockByHeight(args: BlockArgs): Promise<string> {
  const height = args.height;
  if (height != null && (!Number.isInteger(height) || height < 0)) {
    throw new Error('Provide the block height as a whole number of 0 or more.');
  }
  let target = height;
  if (target == null) {
    const tip = await mpJson<number>('/blocks/tip/height');
    target = tip;
  }
  const rows = await mpJson<Array<Record<string, unknown>>>(`/blocks/${target}`);
  const b = rows?.[0];
  if (!b) throw new Error(`mempool.space has no block at height ${target}`);
  return [
    `Bitcoin block ${String(b.height)}`,
    `Hash: ${String(b.id)}`,
    `Mined: ${iso(b.timestamp)} (median ${iso(b.mediantime)})`,
    `Transactions: ${b.tx_count ?? 'not reported'} | size ${b.size ?? '?'} bytes | weight ${b.weight ?? '?'}`,
    `Difficulty: ${typeof b.difficulty === 'number' ? b.difficulty.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'not reported'} | bits ${b.bits ?? 'not reported'}`,
    `Nonce: ${b.nonce ?? 'not reported'} | version ${b.version ?? 'not reported'}`,
    `Previous block: ${b.previousblockhash ?? 'not reported'}`,
    `Merkle root: ${b.merkle_root ?? 'not reported'}`,
    target === Number(b.height) && height == null ? 'No height given, so this is the chain tip.' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface PoolArgs {
  period?: string;
  limit?: number;
}

export interface DifficultyArgs {
  limit?: number;
}

