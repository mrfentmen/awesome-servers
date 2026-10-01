const BASE = 'https://api.core.ac.uk/v3/search/works';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const body = JSON.stringify({ q: query, limit });
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'User-Agent': 'mrfentmen-core-mcp/1.0', Accept: 'application/json', 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CORE returned ${res.status}`);
  const d = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const rows = d.results ?? [];
  if (!rows.length) return `No works found for "${query}".`;
  return `CORE works for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      const authors = (r.authors ?? []) as Array<Record<string, unknown>>;
      const auth = authors.slice(0, 2).map((a) => String(a.name ?? '')).join(', ');
      return `${i + 1}. ${s('title')}${auth ? ` | ${auth}` : ''} | ${s('yearPublished')}`;
    }).join('\n');
}

// ---- muxF tools:
const CORE_API = 'https://api.core.ac.uk/v3';

export interface IdArgs {
  id: number;
}

export interface SurveyArgs {
  query: string;
  limit?: number;
}

interface CoreWork {
  id?: number;
  title?: string | null;
  doi?: string | null;
  yearPublished?: number | null;
  citationCount?: number | null;
  publisher?: string | null;
  abstract?: string | null;
  authors?: Array<{ name?: string }> | null;
  documentType?: string | string[] | null;
  dataProviders?: Array<{ id?: number; name?: string }> | null;
  outputs?: string[] | null;
  downloadUrl?: string | null;
  publishedDate?: string | null;
  language?: string | null;
  identifiers?: Array<{ identifier?: string; type?: string }> | Record<string, string | null> | null;
  links?: Array<{ type?: string; url?: string }> | null;
  versions?: Array<{ version?: string | null; url?: string | null; doi?: string | null }> | null;
}

interface CoreProvider {
  id?: number;
  name?: string | null;
  institutionName?: string | null;
  homepageUrl?: string | null;
  software?: string | null;
  source?: string | null;
  type?: string | null;
  metadataFormat?: string | null;
  email?: string | null;
  oaiPmhUrl?: string | null;
  createdDate?: string | null;
  location?: { countryCode?: string | null; latitude?: number | null; longitude?: number | null } | null;
  stats?: Record<string, number> | null;
}

function coreGet<T>(path: string): Promise<T> {
  return fetch(`${CORE_API}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-core-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  }).then(async (res) => {
    if (res.status === 404) throw new Error(`CORE has no record at ${path}`);
    if (!res.ok) throw new Error(`CORE returned ${res.status}`);
    return (await res.json()) as T;
  });
}

function corePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return fetch(`${CORE_API}${path}`, {
    method: 'POST',
    headers: {
      'User-Agent': 'mrfentmen-core-mcp/1.0',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  }).then(async (res) => {
    if (!res.ok) throw new Error(`CORE returned ${res.status}`);
    return (await res.json()) as T;
  });
}

function or(value: unknown): string {
  const text = value == null ? '' : String(value).trim();
  return text || 'not reported';
}

function list(value: unknown, cap: number): string {
  return Array.isArray(value) ? value.slice(0, cap).join(', ') : 'not reported';
}

function abstractExcerpt(value: string | null | undefined, chars = 700): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!text) return 'not reported';
  return text.length > chars ? `${text.slice(0, chars)}...` : text;
}

/** Profile of the repository CORE harvested a work from. */
export async function repositoryDetails(args: IdArgs): Promise<string> {
  const id = Math.max(1, Math.floor(Number(args.id) || 0));
  if (!id) throw new Error('Give the CORE data provider id as a number.');
  const p = await coreGet<CoreProvider>(`/data-providers/${id}`);
  const place = p.location ?? {};
  const stats = p.stats && typeof p.stats === 'object' ? p.stats : null;
  const statLines = stats
    ? Object.entries(stats).slice(0, 5).map(([k, v]) => `${k}: ${typeof v === 'number' ? v : or(String(v))}`)
    : [];
  return [
    `CORE data provider ${or(p.id)}`,
    `Name: ${or(p.name)}`,
    `Institution: ${or(p.institutionName)}`,
    `Kind: ${or(p.type)}`,
    `Harvest source: ${or(p.source)} via ${or(p.metadataFormat)}`,
    `Repository software: ${or(p.software)}`,
    `Homepage: ${or(p.homepageUrl)}`,
    `OAI-PMH endpoint: ${or(p.oaiPmhUrl)}`,
    `Contact: ${or(p.email)}`,
    `Location: ${or(place.countryCode)} at ${place.latitude ?? 'not reported'}, ${place.longitude ?? 'not reported'}`,
    `Added to CORE: ${or(p.createdDate)}`,
    `Harvest statistics: ${statLines.length ? statLines.join('; ') : 'not reported'}`,
  ].join('\n');
}

