const UA = 'mrfentmen-themuse-mcp/1.0 (https://github.com/mrfentmen)';
const BASE = 'https://www.themuse.com/api/public';

export class MuseError extends Error {}

export interface JobArgs {
  job_id: number;
}

interface MuseJob {
  id?: number;
  name?: string;
  type?: string;
  publication_date?: string;
  contents?: string;
  company?: { name?: string };
  locations?: Array<{ name?: string }>;
  levels?: Array<{ name?: string }>;
  categories?: Array<{ name?: string }>;
  tags?: Array<{ name?: string }>;
  refs?: { landing_page?: string };
}

const clamp = (value: number | undefined, fallback: number, max: number) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

const plain = (html?: string) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const names = (list?: Array<{ name?: string }>) =>
  (list ?? []).map((entry) => entry.name).filter(Boolean).join(', ') || 'n/a';

const posted = (value?: string) => String(value ?? '?').slice(0, 10);

/** Levels the Muse API accepts for the `level` filter. */
export const MUSE_LEVELS = [
  'Internship',
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Management',
  'Executive',
] as const;

interface Filters {
  level?: string;
  location?: string;
}

function buildQuery(page: number, filters: Filters = {}): string {
  const params = new URLSearchParams({ page: String(clamp(page, 1, 20000)) });
  const level = (filters.level ?? '').trim();
  const location = (filters.location ?? '').trim();
  if (level) params.set('level', level);
  if (location) params.set('location', location);
  return params.toString();
}

async function fetchPage(
  page: number,
  filters: Filters = {}
): Promise<{ pageCount: number; total: number; results: MuseJob[] }> {
  const url = `${BASE}/jobs?${buildQuery(page, filters)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new MuseError(`The Muse returned ${res.status} for ${url}`);
  const d = (await res.json()) as { page_count?: number; total?: number; results?: MuseJob[] };
  return { pageCount: d.page_count ?? 0, total: d.total ?? 0, results: d.results ?? [] };
}

const row = (job: MuseJob, index: number) =>
  `${index + 1}. ${job.name ?? '?'} at ${job.company?.name ?? '?'} | ${names(job.locations)}` +
  ` | ${names(job.levels)} | ${names(job.categories)} | posted ${posted(job.publication_date)}` +
  (job.id ? `\n   id ${job.id}` : '');

export async function jobs(args: { page?: number; limit?: number; level?: string; location?: string }): Promise<string> {
  const limit = clamp(args?.limit, 5, 40);
  const { pageCount, total, results } = await fetchPage(args?.page ?? 1, args);
  const page = clamp(args?.page, 1, 20000);
  if (!results.length) return `No Muse jobs on page ${page}.`;
  return (
    `The Muse jobs (page ${page} of ${pageCount.toLocaleString()}, ${total.toLocaleString()} total, showing ${Math.min(limit, results.length)}):\n` +
    results.slice(0, limit).map(row).join('\n')
  );
}

export async function job(args: JobArgs): Promise<string> {
  const id = Number(args?.job_id);
  if (!Number.isFinite(id) || id <= 0) throw new MuseError('job_id must be a numeric Muse job id.');
  const res = await fetch(`${BASE}/jobs/${id}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 404) throw new MuseError(`No Muse job with id ${id}.`);
  if (!res.ok) throw new MuseError(`The Muse returned ${res.status}`);
  const found = (await res.json()) as MuseJob;
  return `${found.name ?? '?'} at ${found.company?.name ?? '?'}\n` +
    `Location: ${names(found.locations)}\n` +
    `Level: ${names(found.levels)} | Type: ${found.type ?? '?'} | Category: ${names(found.categories)}\n` +
    `Tags: ${names(found.tags)}\n` +
    `Published: ${posted(found.publication_date)}\n` +
    `${found.refs?.landing_page ?? ''}\n\n` +
    plain(found.contents).slice(0, 4000);
}

/**
 * Browse with the Muse server-side filters instead of scanning the feed:
 * level alone narrows 400k roles to roughly 150k, and level+location cuts it
 * far further, so an agent asking for "senior jobs in Berlin" gets real hits.
 */
export async function findJobs(args: {
  level?: string;
  location?: string;
  page?: number;
  limit?: number;
}): Promise<string> {
  const level = (args.level ?? '').trim();
  const location = (args.location ?? '').trim();
  if (!level && !location) {
    return `Give a level, a location, or both. Levels: ${MUSE_LEVELS.join(', ')}. Example location: 'Remote', 'New York, NY', 'London, UK'.`;
  }
  const limit = clamp(args.limit, 5, 40);
  const { pageCount, total, results } = await fetchPage(args.page ?? 1, { level, location });
  if (!results.length) {
    return `No Muse jobs for level "${level || 'any'}" in "${location || 'anywhere'}".`;
  }
  return (
    `Muse jobs${level ? ` at level ${level}` : ''}${location ? ` in ${location}` : ''} — ` +
    `${total.toLocaleString()} total (page ${args.page ?? 1} of ${pageCount.toLocaleString()}):\n` +
    results.slice(0, limit).map(row).join('\n')
  );
}

/** All open roles at one company, found by scanning recent postings. */
export async function companyJobs(args: { company: string; pages?: number; limit?: number }): Promise<string> {
  const company = (args.company ?? '').trim();
  if (!company) return 'Provide a company name, e.g. "Uber" or "Genius AI".';
  const pages = clamp(args.pages, 5, 10);
  const limit = clamp(args.limit, 20, 40);
  const want = company.toLowerCase();
  const fetched = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1)));
  const list = fetched.flatMap((page) => page.results);
  const hits = list.filter((entry) => (entry.company?.name ?? '').toLowerCase().includes(want));
  if (!hits.length) {
    return `No postings from a company matching "${company}" in the newest ${list.length} Muse jobs. Try company_insights or a different name.`;
  }
  return (
    `Muse jobs at companies matching "${company}" (${hits.length} of the newest ${list.length}):\n` +
    hits.slice(0, limit).map(row).join('\n')
  );
}

/**
 * Keyword search over the newest postings. The Muse API has no free-text
 * search parameter, so this samples recent pages and matches client-side.
 * Combine with a level/location to narrow what gets sampled.
 */
export async function searchJobs(args: {
  query: string;
  level?: string;
  location?: string;
  pages?: number;
  limit?: number;
}): Promise<string> {
  const query = String(args?.query ?? '').trim().toLowerCase();
  if (!query) return 'Provide words to match, e.g. "data analyst" or "remote".';
  const pages = clamp(args.pages, 3, 10);
  const limit = clamp(args.limit, 10, 40);
  const filters = { level: (args.level ?? '').trim(), location: (args.location ?? '').trim() };
  const fetched = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1, filters)));
  const list = fetched.flatMap((page) => page.results);
  const hits = list.filter((entry) =>
    `${entry.name ?? ''} ${entry.company?.name ?? ''} ${names(entry.locations)} ${names(entry.categories)} ${names(entry.levels)} ${names(entry.tags)}`
      .toLowerCase()
      .includes(query)
  );
  if (!hits.length) return `No Muse jobs match "${args.query}" in the newest ${list.length} postings.`;
  return (
    `Muse jobs matching "${args.query}" (${hits.length} of the newest ${list.length}):\n` +
    hits.slice(0, limit).map(row).join('\n')
  );
}

/** Aggregate view of who is hiring, where and at what level, for a filter. */
export async function jobInsights(args: { level?: string; location?: string; pages?: number }): Promise<string> {
  const pages = clamp(args.pages, 5, 10);
  const filters = { level: (args.level ?? '').trim(), location: (args.location ?? '').trim() };
  const fetched = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1, filters)));
  const list = fetched.flatMap((page) => page.results);
  if (!list.length) return 'No Muse jobs matched that filter.';
  const total = fetched[0]?.total ?? list.length;

  const tally = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) if (v && v !== 'n/a') m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  };
  const block = (label: string, rows: [string, number][]) =>
    rows.length ? `${label}:\n${rows.map(([k, v]) => `  ${k} — ${v}`).join('\n')}` : '';

  const companies = tally(list.map((j) => j.company?.name ?? ''));
  const places = tally(list.flatMap((j) => (j.locations ?? []).map((l) => l.name ?? '')));
  const levels = tally(list.flatMap((j) => (j.levels ?? []).map((l) => l.name ?? '')));
  const cats = tally(list.flatMap((j) => (j.categories ?? []).map((c) => c.name ?? '')));

  return [
    `Muse job market${filters.level ? ` at ${filters.level}` : ''}${filters.location ? ` in ${filters.location}` : ''}: ${total.toLocaleString()} open roles (sampled ${list.length}).`,
    '',
    block('Top employers', companies),
    block('Top locations', places),
    block('Levels', levels),
    block('Categories', cats),
  ]
    .filter(Boolean)
    .join('\n');
}
