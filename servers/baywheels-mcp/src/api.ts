const BASE = 'https://gbfs.baywheels.com/gbfs/en/station_information.json';

export interface StationsArgs {
  limit?: number;
}

export async function stations(args: StationsArgs = {}): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-baywheels-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Bay Wheels returned ${res.status}`);
  const data = (await res.json()) as {
    data?: { stations?: Array<Record<string, unknown>> };
  };
  const all = data.data?.stations ?? [];
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const shown = all.slice(0, limit);
  if (!shown.length) return 'No Bay Wheels stations available.';
  return `Bay Wheels stations (${all.length} total, ${shown.length} shown):\n` +
    shown
      .map((s, i) => `${i + 1}. ${s.name ?? 'unnamed'} | ${s.capacity ?? ''} docks | ${s.lat ?? ''}, ${s.lon ?? ''}`)
      .join('\n');
}

// ---- muxA tools:
// The existing tool lists stations from the static information feed. These add
// the live status feed joined to station detail, an availability rollup for the
// whole system or one region, and the system metadata (operator, regions, pricing).
const GBFS_ROOT = 'https://gbfs.lyft.com/gbfs/1.1/bay/en';

/** A station is treated as stale once its report is older than this. */
const STALE_SECONDS = 3600;
/** Dead stations carry last_reported 86400, the day after the epoch. */
const DEAD_SENTINEL = 86400;

interface GbfsEnvelope<T> {
  data?: T;
  last_updated?: number;
  ttl?: number;
  version?: string;
}

interface StationInfo {
  station_id?: string;
  name?: string;
  short_name?: string;
  lat?: number;
  lon?: number;
  region_id?: string;
  capacity?: number;
  station_type?: string;
}

interface StationState {
  station_id?: string;
  num_bikes_available?: number;
  num_bikes_disabled?: number;
  num_docks_available?: number;
  num_docks_disabled?: number;
  is_installed?: number;
  is_renting?: number;
  is_returning?: number;
  last_reported?: number;
  num_ebikes_available?: number;
  num_scooters_available?: number;
}

interface Region {
  region_id?: string;
  name?: string;
}

interface PricingPlan {
  plan_id?: string;
  name?: string;
  currency?: string;
  price?: number | string;
  description?: string;
}

interface SystemInformation {
  system_id?: string;
  name?: string;
  operator?: string;
  url?: string;
  purchase_url?: string;
  start_date?: string;
  timezone?: string;
}

async function feed<T>(name: string): Promise<GbfsEnvelope<T>> {
  const res = await fetch(`${GBFS_ROOT}/${name}.json`, {
    headers: { 'User-Agent': 'mrfentmen-baywheels-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Bay Wheels ${name} returned ${res.status}`);
  return (await res.json()) as GbfsEnvelope<T>;
}

function reportAge(epoch: number | undefined): number | null {
  if (!epoch || epoch === DEAD_SENTINEL) return null;
  return Math.floor(Date.now() / 1000) - epoch;
}

function ageText(epoch: number | undefined): string {
  const age = reportAge(epoch);
  if (age === null) return 'no live report';
  if (age < 0) return 'just now';
  if (age < 60) return `${age}s ago`;
  if (age < 3600) return `${Math.floor(age / 60)}m ago`;
  if (age < 86400) return `${Math.floor(age / 3600)}h ago`;
  return `${Math.floor(age / 86400)}d ago`;
}

function isLive(state: StationState, maxAge: number): boolean {
  const age = reportAge(state.last_reported);
  return age !== null && age <= maxAge;
}

function regionLabel(regions: Map<string, string>, id: string | undefined): string {
  if (!id) return 'unassigned';
  const name = regions.get(id);
  return name ? `${name} (${id})` : `region ${id}`;
}

async function regionNames(): Promise<Map<string, string>> {
  const feedData = await feed<{ regions?: Region[] }>('system_regions');
  const regions = new Map<string, string>();
  for (const r of feedData.data?.regions ?? []) {
    if (r.region_id) regions.set(r.region_id, r.name ?? `region ${r.region_id}`);
  }
  return regions;
}

export interface NetworkStatusArgs {
  region?: string;
  staleHours?: number;
}

export interface StationStatusArgs {
  station: string;
  limit?: number;
}

export interface SystemInfoArgs {
  plansLimit?: number;
}

export async function systemInfo(args: SystemInfoArgs = {}): Promise<string> {
  const [info, regions, planFeed] = await Promise.all([
    feed<SystemInformation>('system_information'),
    regionNames(),
    feed<{ plans?: PricingPlan[] }>('system_pricing_plans'),
  ]);
  const sys = info.data;
  if (!sys) return 'Bay Wheels system information is unavailable right now.';
  const plans = planFeed.data?.plans ?? [];
  const planLimit = Math.max(1, Math.min(args.plansLimit ?? 10, 50));

  const lines = [
    `${sys.name ?? 'Bay Wheels'} — system id ${sys.system_id ?? '?'}`,
    `Operator: ${sys.operator ?? '?'} | Timezone: ${sys.timezone ?? '?'} | Live since: ${sys.start_date ?? 'not reported'}`,
    `Site: ${sys.url ?? '?'} | Passes: ${sys.purchase_url ?? '?'}`,
    `Regions: ${regions.size}`,
  ];
  for (const name of regions.values()) lines.push(`  ${name}`);
  lines.push(`Pricing plans: ${plans.length}`);
  for (const p of plans.slice(0, planLimit)) {
    const price = p.currency ? `${p.price ?? '?'} ${p.currency}` : `${p.price ?? '?'}`;
    lines.push(`  ${p.name ?? p.plan_id ?? 'unnamed'} — ${price}${p.description ? ` | ${p.description}` : ''}`);
  }
  return lines.join('\n');
}
