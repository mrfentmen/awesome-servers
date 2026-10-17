const BASE = 'https://mainnet-api.algonode.cloud/v2/status';

export interface StatusArgs {
  // No arguments needed.
}

export async function status(_args: StatusArgs): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-algorand-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Algorand returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  return [
    `Round: ${s('last-round')}`,
    `Synced: ${s('catchup-time') === '0' ? 'yes' : s('catchup-time')}`,
    `Version: ${s('version')}`,
  ].filter((l) => !l.endsWith(': ')).join('\n') || 'No status data returned.';
}

// ---- muxA tools:

const NODE = 'https://mainnet-api.algonode.cloud/v2'
const UA_HEADERS = {
  'User-Agent': 'mrfentmen-algorand-mcp/1.0',
  Accept: 'application/json',
}

const MICRO_ALGOS = 1e6

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${NODE}${path}`, {
    headers: UA_HEADERS,
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new Error(`Algorand node has nothing at ${path}`);
  if (!res.ok) throw new Error(`Algorand node returned ${res.status} for ${path}`);
  return (await res.json()) as T;
}

function fmt(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export interface BlockArgs {
  round?: number;
}

export interface SupplyArgs {
  // No arguments needed.
}

export async function circulatingSupply(_args: SupplyArgs): Promise<string> {
  const d = await getJson<Record<string, number>>('/ledger/supply')
  const num = (key: string) => (typeof d[key] === 'number' ? d[key] : undefined)
  const total = num('total-money')
  const online = num('online-money')
  const stake = num('online-stake')
  if (total == null) throw new Error('Algorand node reported no total-money value')
  return [
    `Algorand supply at round ${num('current_round') ?? 'not reported'}`,
    `Total money in circulation: ${fmt(total / MICRO_ALGOS)} Algos (${fmt(total)} microAlgos)`,
    `Online money: ${online != null ? `${fmt(online / MICRO_ALGOS)} Algos` : 'not reported'}`,
    `Online stake: ${stake != null ? `${fmt(stake / MICRO_ALGOS)} Algos` : 'not reported'}`,
    'Algos are quoted from the node\'s microAlgos, 1 Algo = 1000000 microAlgos.',
  ].join('\n')
}

export interface AssetArgs {
  assetId?: number;
}



export async function blockDetail(args: { round: number }): Promise<string> {
  const round = Number(args.round);
  if (!Number.isFinite(round) || round < 0) return 'Provide a valid block round number.';
  const res = await fetch('https://mainnet-api.algonode.cloud/v2/blocks/' + round, {
    headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('Algorand API returned ' + res.status);
  const data = (await res.json()) as Record<string, unknown>;
  const block = (data.block ?? data) as Record<string, unknown>;
  const lines = ['Algorand block #' + round + ':'];
  lines.push('  Timestamp: ' + (block.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : 'n/a'));
  lines.push('  Transactions: ' + (((block.txns as any[])?.length ?? block.num_txns ?? 'n/a')));
  lines.push('  Previous block: ' + (block.previousBlockHash ?? block.prev ?? 'n/a'));
  lines.push('  Seed: ' + (block.seed ?? 'n/a'));
  lines.push('  Reward: ' + (block.reward ?? 'n/a'));
  if (block.txns && Array.isArray(block.txns) && block.txns.length > 0) {
    lines.push('  First few txns: ' + block.txns.slice(0, 5).map((t: any) => t.id ?? t.txid ?? '?').join(', '));
  }
  return lines.join('\n');
}

export async function assetDetail(args: { assetId: number }): Promise<string> {
  const id = Number(args.assetId);
  if (!Number.isFinite(id) || id < 0) return 'Provide a valid asset ID.';
  const res = await fetch('https://mainnet-api.algonode.cloud/v2/assets/' + id, {
    headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('Algorand API returned ' + res.status);
  const data = (await res.json()) as Record<string, unknown>;
  const asset = (data.asset ?? data) as Record<string, unknown>;
  const params = (asset.params ?? asset) as Record<string, unknown>;
  const lines = ['Algorand asset #' + id + ':'];
  lines.push('  Name: ' + (params.name ?? 'n/a'));
  lines.push('  Unit: ' + (params['unit-name'] ?? params.unitName ?? 'n/a'));
  lines.push('  Decimals: ' + (params.decimals ?? 'n/a'));
  lines.push('  Total supply: ' + (params.total ?? 'n/a'));
  lines.push('  Manager: ' + (params.manager ?? 'n/a'));
  lines.push('  Reserve: ' + (params.reserve ?? 'n/a'));
  lines.push('  Freeze: ' + (params.freeze ?? 'n/a'));
  lines.push('  Clawback: ' + (params.clawback ?? 'n/a'));
  return lines.join('\n');
}
