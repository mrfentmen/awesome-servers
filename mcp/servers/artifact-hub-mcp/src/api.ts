const BASE = 'https://artifacthub.io/api/v1/packages/search';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({ ts_query_web: q, limit: String(limit) });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-artifact-hub-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Artifact Hub returned ${res.status}`);
  const d = (await res.json()) as { packages?: Array<Record<string, unknown>> };
  const rows = d.packages ?? [];
  if (!rows.length) return `No Artifact Hub packages found for "${q}".`;
  return `Artifact Hub packages for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('name')}${s('version') ? ` ${s('version')}` : ''}${s('description') ? ` | ${s('description').slice(0, 90)}` : ''}${s('repository') ? ` | repo ${s('repository')}` : ''}`;
      })
      .join('\n');
}

// ---- muxA tools:
// The existing search tool only ever reads the search route, so the new ones
// read the two other routes the same API publishes: the detail of one package,
// and the site wide statistics.
const API = 'https://artifacthub.io/api/v1';

interface HubRepository {
  name?: string;
  display_name?: string;
  url?: string;
  verified_publisher?: boolean;
  organization_display_name?: string;
}

interface HubPackage {
  package_id?: string;
  name?: string;
  version?: string;
  app_version?: string;
  description?: string;
  license?: string;
  official?: boolean;
  deprecated?: boolean;
  signed?: boolean;
  signatures?: string[];
  home_url?: string;
  content_url?: string;
  keywords?: string[];
  maintainers?: Array<{ name?: string }>;
  repository?: HubRepository;
  stats?: { subscriptions?: number; webhooks?: number };
  available_versions?: Array<{ version?: string; app_version?: string; prerelease?: boolean; ts?: number }>;
  ts?: number;
  prerelease?: boolean;
  has_values_schema?: boolean;
  contains_security_updates?: boolean;
}

async function getHub(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-artifact-hub-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new Error('Artifact Hub does not hold that package.');
  if (!res.ok) throw new Error(`Artifact Hub returned ${res.status}`);
  return res.json();
}

export interface PackageDetailArgs {
  kind: string;
  repository: string;
  name: string;
}

interface HubStats {
  generated_at?: number;
  packages?: HubTotals & { top_views_today?: Array<{ package?: { name?: string; version?: string }; views?: number }> };
  repositories?: HubTotals;
  organizations?: HubTotals;
  users?: HubTotals;
  snapshots?: HubTotals;
}

interface HubTotals {
  total?: number;
}

export async function hubStats(_args: Record<string, never> = {}): Promise<string> {
  const d = (await getHub(`${API}/stats`)) as HubStats;
  if (typeof d.packages?.total !== 'number') throw new Error('Artifact Hub returned no statistics.');
  const total = (row?: HubTotals) => (typeof row?.total === 'number' ? row.total : 'not reported');
  // generated_at is milliseconds, verified live, while every other timestamp
  // this API returns (ts, running_total keys) is in seconds
  const counted = typeof d.generated_at === 'number' ? new Date(d.generated_at).toISOString() : 'not reported';
  const lines = [
    `Artifact Hub, counted ${counted}:`,
    `  packages: ${total(d.packages)}`,
    `  repositories: ${total(d.repositories)}`,
    `  organizations: ${total(d.organizations)}`,
    `  users: ${total(d.users)}`,
    `  security report snapshots: ${total(d.snapshots)}`,
  ];
  const top = d.packages.top_views_today ?? [];
  if (top.length) {
    lines.push(`  the ${top.length} most viewed packages today:`);
    for (const row of top) lines.push(`    ${row.package?.name ?? '?'} ${row.package?.version ?? ''} - ${row.views ?? 0} views`);
  } else {
    lines.push('  no daily view ranking reported.');
  }
  return lines.join('\n');
}
