const BASE = 'https://data.gov.uk/api/3/action/package_search';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({ q, rows: String(limit) });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-data-gov-uk-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`data.gov.uk returned ${res.status}`);
  const d = (await res.json()) as { result?: { count?: number; results?: Array<Record<string, unknown>> } };
  const rows = d.result?.results ?? [];
  if (!rows.length) return `No data.gov.uk packages found for "${q}".`;
  return `data.gov.uk packages for "${q}" (${d.result?.count ?? rows.length} total, ${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('title')}${s('notes') ? ` | ${s('notes').slice(0, 90)}` : ''}${s('metadata_modified') ? ` | ${String(s('metadata_modified')).slice(0, 10)}` : ''}`;
      })
      .join('\n');
}

// ---- muxE tools:
// The one existing tool does free text package_search and prints three fields.
// The new ones ask data.gov.uk two other questions: everything about one named
// dataset, and everything one publisher has published. data.gov.uk now 301s every
// api/3/action call to ckan.publishing.service.gov.uk, verified live, so the
// canonical host is used directly rather than paying for the redirect each time.
const CANON = 'https://ckan.publishing.service.gov.uk/api/3/action';
const DG_UA = 'mrfentmen-data-gov-uk-mcp/1.0';

interface DgResource {
  id?: string;
  name?: string;
  description?: string;
  format?: string;
  url?: string;
  last_modified?: string | null;
  size?: number | null;
  hash?: string;
  datastore_active?: boolean;
  mimetype?: string | null;
  mimetype_inner?: string | null;
}

interface DgTag {
  name?: string;
  vocabulary_id?: string | null;
}

interface DgPackage {
  id?: string;
  name?: string;
  title?: string;
  notes?: string;
  license_title?: string | null;
  license_url?: string | null;
  license_id?: string | null;
  metadata_created?: string;
  metadata_modified?: string;
  version?: string | null;
  state?: string;
  isopen?: boolean;
  num_resources?: number;
  num_tags?: number;
  type?: string;
  url?: string;
  organization?: { name?: string; title?: string; description?: string; state?: string };
  owner_org?: string;
  groups?: Array<{ name?: string; title?: string }>;
  tags?: DgTag[];
  resources?: DgResource[];
  extras?: Array<{ key?: string; value?: string }>;
}

interface DgEnvelope {
  success?: boolean;
  error?: { message?: string } | string;
  result?: DgPackage & { count?: number; results?: DgPackage[] };
}

async function dgGet(path: string, params: Record<string, string>): Promise<DgEnvelope> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${CANON}/${path}?${qs}`, {
    headers: { 'User-Agent': DG_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 404) throw new Error('data.gov.uk has no record for that.');
  if (res.status === 403) throw new Error(`data.gov.uk refused that request with HTTP 403; its nginx only allows package_search, package_show and package_list.`);
  if (!res.ok) throw new Error(`data.gov.uk returned ${res.status}`);
  const body = (await res.json()) as DgEnvelope;
  if (body?.success === false) {
    const why = typeof body.error === 'string' ? body.error : body.error?.message;
    throw new Error(`data.gov.uk said: ${why ?? 'the request was rejected'}`);
  }
  return body;
}

const dayOf = (value?: string | null): string => (value ? String(value).slice(0, 10) : 'not reported');

export interface DatasetDetailArgs {
  name: string;
}

export interface PublisherDatasetsArgs {
  organization: string;
  limit?: number;
}

export async function publisherDatasets(args: PublisherDatasetsArgs): Promise<string> {
  const org = (args?.organization ?? '').trim();
  if (!org) throw new Error('Provide the publisher slug, the name field of data.gov.uk/organisation/<slug>, not the display title.');
  if (!/^[\w.-]{1,120}$/.test(org)) {
    throw new Error('A publisher slug may only hold letters, digits, dots, dashes and underscores.');
  }
  const limit = Math.max(1, Math.min(Number(args?.limit ?? 10) || 10, 25));
  const d = await dgGet('package_search', { fq: `organization:${org}`, rows: String(limit) });
  const rows = Array.isArray(d.result?.results) ? (d.result?.results as DgPackage[]) : [];
  const count = typeof d.result?.count === 'number' ? d.result.count : null;
  if (!rows.length) {
    if (count === 0) return `data.gov.uk lists no dataset for the publisher "${org}".`;
    return `data.gov.uk reports ${count} dataset(s) for "${org}" but returned none.`;
  }
  const publisher = rows[0].organization?.title ?? org;
  const lines = [
    `Datasets published by ${publisher} (${org}) on data.gov.uk:`,
    `  datasets the catalogue reports: ${count !== null ? count.toLocaleString('en-US') : 'not reported'}`,
    `  shown here: ${rows.length}`,
  ];
  rows.forEach((p, i) => {
    const resources = Array.isArray(p.resources) ? p.resources : [];
    const formats = new Set(resources.map((r) => r.format).filter(Boolean).map(String));
    lines.push(`${i + 1}. ${p.title || p.name || 'title not reported'}`);
    lines.push(`   name ${p.name ?? 'not reported'}, licence ${p.license_title ?? 'not reported'}, last changed ${dayOf(p.metadata_modified)}`);
    lines.push(`   resources ${typeof p.num_resources === 'number' ? p.num_resources : 'not reported'}${formats.size ? ` (${[...formats].slice(0, 6).join(', ')})` : ''}, tags ${typeof p.num_tags === 'number' ? p.num_tags : 'not reported'}`);
  });
  if (count !== null && count > rows.length) {
    lines.push(`  ${(count - rows.length).toLocaleString('en-US')} further dataset(s) exist for this publisher; ask for a higher limit to page further in.`);
  }
  return lines.join('\n');
}
