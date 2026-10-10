const BASE = 'https://api.digitalnz.org/v3/records.json';
const UA = 'mrfentmen-digitalnz-mcp/1.0';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface RecordArgs {
  id: string;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25);
  const url = `${BASE}?text=${encodeURIComponent(query)}&per_page=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`DigitalNZ returned ${res.status}`);
  const d = (await res.json()) as { search?: { result_count?: number; results?: Array<{ id?: string; title?: string; display_content_partner?: string; category?: string[] }> } };
  const results = d.search?.results ?? [];
  if (!results.length) return `No DigitalNZ results for "${query}".`;
  return `DigitalNZ results for "${query}" (total ${d.search?.result_count ?? results.length}):\n` +
    results.slice(0, limit).map((r, i) => `${i + 1}. ${r.title ?? '?'} [${r.display_content_partner ?? '?'}] id=${r.id ?? '?'}`).join('\n');
}

export async function record(args: RecordArgs): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) return 'Provide a record id.';
  const url = `${BASE}?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`DigitalNZ returned ${res.status}`);
  const d = (await res.json()) as { record?: { title?: string; description?: string; display_content_partner?: string; category?: string[]; date?: string[]; thumbnail_url?: string; landing_url?: string } };
  const r = d.record ?? {};
  return [
    `DigitalNZ record ${id}`,
    `Title: ${r.title ?? '?'}`,
    r.description ? `Description: ${r.description.slice(0, 400)}` : null,
    `Partner: ${r.display_content_partner ?? '?'}`,
    r.category?.length ? `Categories: ${r.category.join(', ')}` : null,
    r.date?.length ? `Dates: ${r.date.join(', ')}` : null,
    r.thumbnail_url ? `Thumbnail: ${r.thumbnail_url}` : null,
    r.landing_url ? `Link: ${r.landing_url}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:
// The two existing tools only pass text and per_page. These add the and[]
// filters the anonymous endpoint does accept, the per record more_like_this
// route, and the rights fields a record carries.
const DNZ_API = BASE.slice(0, BASE.lastIndexOf('/'));

const DNZ_FIELDS = 'id,title,category,content_partner,display_date,landing_url,usage';

const DNZ_SORTS = ['date', 'syndication_date'];

// The anonymous endpoint answers facets as an empty object, so the usable
// filter names were probed one by one: category, decade, year, language,
// content_partner and usage answer real counts, while dc_type and
// display_collection answer zero for every value tried.
const DNZ_USAGE = ['Share', 'Modify', 'Use commercially'];

interface DnzResult {
  id?: number;
  title?: string;
  category?: string[];
  content_partner?: string[];
  display_date?: string;
  landing_url?: string;
  usage?: string[];
}

interface DnzSearch {
  page?: number;
  per_page?: number;
  result_count?: number;
  results?: DnzResult[];
}

interface DnzEnvelope {
  search?: DnzSearch;
  more_like_this?: DnzSearch;
  record?: Record<string, unknown>;
  error?: string;
  status?: number;
}

async function dnzGet(url: string, missing: string): Promise<DnzEnvelope> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 404) throw new Error(missing);
  if (!res.ok) throw new Error(`DigitalNZ returned ${res.status}`);
  return (await res.json()) as DnzEnvelope;
}

function dnzFilter(name: string, value: string): string {
  return `${encodeURIComponent(`and[${name}][]`)}=${encodeURIComponent(value)}`;
}

function dnzRows(result: DnzResult, index: number): string {
  const partner = result.content_partner?.[0] ?? 'unknown partner';
  const categories = result.category?.length ? result.category.join(', ') : 'uncategorised';
  return [
    `    ${String(index).padStart(2)}. ${result.title ?? 'untitled'} (id ${result.id ?? '?'})`,
    `        ${categories} | ${partner}${result.display_date ? ` | ${result.display_date}` : ''}`,
  ].join('\n');
}

function dnzPageNote(search: DnzSearch, limit: number): string {
  const page = search.page ?? 1;
  const perPage = search.per_page ?? limit;
  const total = search.result_count ?? 0;
  const pages = perPage > 0 ? Math.ceil(total / perPage) : 1;
  return `  Page ${page} of ${pages}, ${total} records matched by this request.`;
}

async function dnzObserved(query: string): Promise<string[]> {
  const url = `${BASE}?text=${encodeURIComponent(query)}&per_page=25&fields=category,content_partner,usage`;
  const payload = await dnzGet(url, 'DigitalNZ had nothing to read');
  const seen = { category: new Set<string>(), partner: new Set<string>(), usage: new Set<string>() };
  for (const row of payload.search?.results ?? []) {
    for (const value of row.category ?? []) seen.category.add(value);
    for (const value of row.content_partner ?? []) seen.partner.add(value);
    for (const value of row.usage ?? []) seen.usage.add(value);
  }
  const lines: string[] = [];
  if (seen.category.size) lines.push(`  Categories on those records: ${[...seen.category].join(', ')}`);
  if (seen.usage.size) lines.push(`  Usage values on those records: ${[...seen.usage].join(', ')}`);
  if (seen.partner.size) lines.push(`  Content partners on those records: ${[...seen.partner].join(' | ')}`);
  return lines;
}

export async function usageRights(args: { id?: string }): Promise<string> {
  const id = String(args.id ?? '').trim();
  if (!id) throw new Error('Provide a record id');
  const payload = await dnzGet(
    `${DNZ_API}/records/${encodeURIComponent(id)}.json`,
    `DigitalNZ has no record with id ${id}`,
  );
  const record = payload.record;
  if (!record) throw new Error(`DigitalNZ returned no record for ${id}`);
  const list = (value: unknown): string[] => (Array.isArray(value) ? value.map((entry) => String(entry)) : []);
  const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

  const rights = text(record.rights);
  const copyright = list(record.copyright);
  const usage = list(record.usage);
  const rightsUrl = list(record.rights_url);
  const commercial = record.is_commercial_use;

  const rows: Array<[string, string]> = [
    ['Title:', text(record.title) ?? `record ${id}`],
    ['Rights statement:', rights ?? 'the contributing partner published none'],
    ['Licence link:', rightsUrl.length ? rightsUrl.join(', ') : 'none published'],
    ['Usage allowed:', usage.length ? usage.join(', ') : 'not stated'],
    [
      'Commercial use:',
      commercial === true ? 'permitted' : commercial === false ? 'not permitted' : 'not stated',
    ],
    ['Copyright:', copyright.length ? copyright.join(', ') : 'not stated'],
  ];
  const landing = text(record.landing_url);
  const source = text(record.source_url);
  if (landing) rows.push(['Landing page:', landing]);
  if (source) rows.push(['Source data:', source]);

  const width = rows.reduce((max, [label]) => Math.max(max, label.length), 0) + 2;
  return [
    `Rights for DigitalNZ record ${id}`,
    ...rows.map(([label, value]) => `  ${label.padEnd(width)}${value}`),
    '',
    '  These fields come from the contributing partner and are reported exactly as DigitalNZ returns them; a missing',
    '  value means the partner supplied none, which is not the same as the material being unrestricted.',
  ].join('\n');
}
