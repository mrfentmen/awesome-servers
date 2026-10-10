const UA = 'mrfentmen-data-gouv-mcp/1.0';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
  const url = `https://www.data.gouv.fr/api/1/datasets/?q=${encodeURIComponent(query)}&page_size=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`data.gouv.fr returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ title?: string; slug?: string; organization?: { name?: string } | null; nb_views?: number; created_at?: string }> };
  const data = d.data ?? [];
  if (!data.length) return `No datasets for "${query}".`;
  return `data.gouv.fr datasets for "${query}" (${data.length}):\n` +
    data.slice(0, limit).map((x, i) => `${i + 1}. ${x.title ?? '?'} | org: ${x.organization?.name ?? '?'} | views: ${x.nb_views ?? 0} | created: ${String(x.created_at ?? '?').slice(0, 10)}`).join('\n');
}

// ---- muxA tools:
interface DgResource {
  title?: string;
  format?: string;
  filesize?: number | null;
  url?: string;
}

interface DgDataset {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  license?: string;
  frequency?: string;
  last_update?: string;
  created_at?: string;
  tags?: string[];
  nb_views?: number;
  organization?: { name?: string } | string | null;
  resources?: DgResource[];
}

interface DgOrgMetrics {
  datasets?: number;
  views?: number;
  followers?: number;
  members?: number;
  reuses?: number;
}

interface DgOrg {
  id?: string;
  name?: string;
  description?: string;
  metrics?: DgOrgMetrics;
}

async function dgGet<T>(version: 1 | 2, path: string): Promise<T> {
  const res = await fetch(`https://www.data.gouv.fr/api/${version}/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`data.gouv.fr returned ${res.status}`);
  return (await res.json()) as T;
}

function dgPublisher(org: DgDataset['organization']): string {
  if (!org) return 'not reported';
  if (typeof org === 'string') return org;
  return org.name ?? 'not reported';
}

export interface DatasetDetailArgs {
  id?: string;
  query?: string;
}

export interface OrganizationArgs {
  id?: string;
  query?: string;
}

export interface RecentDatasetsArgs {
  limit?: number;
}

export async function recentDatasets(args: RecentDatasetsArgs): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 5) || 5, 20));
  const d = await dgGet<{ total?: number; data?: DgDataset[] }>(
    2,
    `datasets/search/?page_size=${limit}&sort=-created`,
  );
  const rows = (d.data ?? []).slice(0, limit);
  if (!rows.length) return 'data.gouv.fr returned no recent datasets.';
  const body = rows.map((x, i) => {
    const created = String(x.created_at ?? 'not reported').slice(0, 10);
    return (
      `      ${String(i + 1).padStart(2)}. ${x.title ?? 'untitled'}\n` +
      `          publisher: ${dgPublisher(x.organization)} | created: ${created} | id: ${x.id ?? 'not reported'}`
    );
  });
  return [
    `Newest data.gouv.fr datasets (showing ${rows.length} of ${d.total ?? rows.length}):`,
    body.join('\n'),
  ].join('\n');
}
