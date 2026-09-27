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
// ---- batch-5 tools: company directory, name search, hiring comparison (2026-09-27) ----

interface MuseCompany {
  id?: number
  name?: string
  short_name?: string
  description?: string
  industries?: { name?: string }[]
  locations?: { name?: string }[]
  size?: { name?: string }
  refs?: { landing_page?: string }
}

interface CompanyPage {
  page_count?: number
  total?: number
  results?: MuseCompany[]
}

/** The company directory is a separate endpoint from the jobs feed. */
async function fetchCompanies(page: number): Promise<{ pageCount: number; total: number; results: MuseCompany[] }> {
  const url = `${BASE}/companies?page=${clamp(page, 1, 20000)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new MuseError(`The Muse returned ${res.status} for ${url}`)
  const d = (await res.json()) as CompanyPage
  return { pageCount: d.page_count ?? 0, total: d.total ?? 0, results: d.results ?? [] }
}

const companyLine = (company: MuseCompany, index: number) =>
  `${index + 1}. ${company.name ?? '?'} — ${names(company.industries)} | ${names(company.locations)} | ${company.size?.name ?? 'size n/a'}` +
  (company.refs?.landing_page ? `\n   ${company.refs.landing_page}` : '')

/**
 * The employer directory: every company The Muse profiles, with its industries,
 * locations and size, which no job tool exposes.
 */
export async function listCompanies(args: { page?: number; limit?: number }): Promise<string> {
  const page = Math.max(Math.trunc(args.page ?? 1), 1)
  const limit = clamp(args.limit, 10, 40)
  const { pageCount, total, results } = await fetchCompanies(page)
  if (!results.length) return `No companies on page ${page} of The Muse directory.`
  return [
    `The Muse companies — ${total.toLocaleString()} profiled (page ${page} of ${pageCount.toLocaleString()})`,
    '',
    ...results.slice(0, limit).map(companyLine),
    results.length > limit ? `\nShowing ${limit} of ${results.length} on this page.` : '',
  ].filter((line) => line !== '').join('\n')
}

/**
 * Find a company by name across the directory. The directory has no search
 * parameter, so several pages are scanned and the matches reported with the
 * page each was found on.
 */
export async function companySearch(args: { name: string; pages?: number }): Promise<string> {
  const wanted = (args.name ?? '').trim().toLowerCase()
  if (wanted.length < 2) throw new MuseError("Give at least two characters of a company name.")
  const pages = Math.min(Math.max(Math.trunc(args.pages ?? 5), 1), 20)
  const hits: { company: MuseCompany; page: number }[] = []
  let total = 0
  for (let page = 1; page <= pages; page += 1) {
    const { total: count, results } = await fetchCompanies(page)
    total = count
    if (!results.length) break
    for (const company of results) {
      if ((company.name ?? '').toLowerCase().includes(wanted) || (company.short_name ?? '').toLowerCase().includes(wanted)) {
        hits.push({ company, page })
      }
    }
  }
  if (!hits.length) return `No company in the first ${pages} page(s) of ${total.toLocaleString()} matches "${args.name}". Raise pages to scan further.`
  return [
    `Companies matching "${args.name}": ${hits.length} in ${pages} page(s) of the ${total.toLocaleString()} strong directory`,
    '',
    ...hits.slice(0, 20).map((hit) => `${companyLine(hit.company, 0)}   (page ${hit.page})`),
    hits.length > 20 ? `\nShowing 20 of ${hits.length}.` : '',
  ].filter((line) => line !== '').join('\n')
}

/** Open-role count for one company, straight from the jobs endpoint's total. */
async function rolesFor(company: string): Promise<number> {
  const params = new URLSearchParams({ page: '1', company })
  const res = await fetch(`${BASE}/jobs?${params.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new MuseError(`The Muse returned ${res.status} for company "${company}"`)
  const d = (await res.json()) as { total?: number; page_count?: number }
  return d.total ?? 0
}

/**
 * Open-role counts for several employers side by side, which is the question a
 * candidate asks when choosing between them.
 */
export async function compareCompanies(args: { companies: string[] }): Promise<string> {
  const wanted = (args.companies ?? []).map((name) => String(name).trim()).filter(Boolean)
  if (wanted.length < 2) throw new MuseError("Give at least two companies to compare.")
  if (wanted.length > 5) throw new MuseError("Compare at most five companies at a time.")
  const counts = await Promise.all(wanted.map(async (name) => ({ name, roles: await rolesFor(name) })))
  const ranked = [...counts].sort((a, b) => b.roles - a.roles)
  const leader = ranked[0]
  const empty = counts.filter((row) => row.roles === 0).map((row) => row.name)
  return [
    'Open roles on The Muse',
    '',
    ...ranked.map((row, i) => `  ${i + 1}. ${row.name} — ${row.roles.toLocaleString()} role(s)`),
    '',
    leader.roles > 0 ? `${leader.name} is hiring the most, with ${leader.roles.toLocaleString()} open role(s).` : 'None of these companies has open roles listed.',
    empty.length ? `No listings found for: ${empty.join(', ')}. The Muse matches the company name in its own records, so try the exact spelling it uses.` : '',
  ].filter((line) => line !== '').join('\n')
}
