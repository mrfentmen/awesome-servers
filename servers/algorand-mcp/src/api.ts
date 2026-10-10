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

