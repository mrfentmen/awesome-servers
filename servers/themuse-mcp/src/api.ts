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

// ---- muxG tools:
const TM_BASE = "https://www.themuse.com/api/public"
const TM_LIST_CAP = 12

interface TmJob {
  id?: number
  name?: string
  short_name?: string
  publication_date?: string
  company?: { id?: number; name?: string; short_name?: string }
  categories?: { name?: string; short_name?: string }[]
  levels?: { name?: string; short_name?: string }[]
  locations?: { name?: string }[]
  contents?: string
  refs?: { landing_page?: string }
}

interface TmPage {
  page?: number
  page_count?: number
  items_per_page?: number
  total?: number
  results?: TmJob[]
}

function tmBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function tmText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

async function tmPages(pages: number): Promise<{ jobs: TmJob[]; meta: TmPage }> {
  const out: TmJob[] = []
  let meta: TmPage = {}
  for (let p = 1; p <= pages; p += 1) {
    const res = await fetch(`${TM_BASE}/jobs?page=${p}`, {
      headers: { "User-Agent": "mrfentmen-themuse-mcp/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new MuseError(`The Muse public API returned ${res.status} for page ${p}.`)
    const d = (await res.json()) as TmPage
    if (p === 1) meta = d
    const rows = d.results ?? []
    if (!rows.length) break
    out.push(...rows)
  }
  if (!out.length) throw new MuseError("The Muse public API returned no postings.")
  return { jobs: out, meta }
}

function tmDays(iso: string | undefined, now: number): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : Math.round((now - t) / 86400000)
}

function tmRank<K>(m: Map<K, number>, n: number): [K, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}

/** How fresh the listings are, which a job board never tells you as a number. */
export async function postingAgeCensus(args: { pages?: number }): Promise<string> {
  const pages = tmBound(args?.pages, 1, 5, 2)
  const { jobs, meta } = await tmPages(pages)
  const now = Date.now()

  const buckets: [string, (d: number) => boolean][] = [
    ["under 7 days", (d) => d < 7],
    ["7 to 30 days", (d) => d >= 7 && d < 30],
    ["1 to 3 months", (d) => d >= 30 && d < 90],
    ["3 to 6 months", (d) => d >= 90 && d < 180],
    ["6 to 12 months", (d) => d >= 180 && d < 365],
    ["over a year", (d) => d >= 365],
  ]
  const counts = new Map<string, number>()
  const ages: number[] = []
  const undated = jobs.filter((j) => !j.publication_date).length
  const byCompany = new Map<string, number[]>()
  for (const j of jobs) {
    const d = tmDays(j.publication_date, now)
    if (d === null) continue
    ages.push(d)
    for (const [label, test] of buckets) if (test(d)) counts.set(label, (counts.get(label) ?? 0) + 1)
    const c = j.company?.name ?? "not reported"
    if (!byCompany.has(c)) byCompany.set(c, [])
    byCompany.get(c)!.push(d)
  }
  ages.sort((a, b) => a - b)
  const median = ages.length ? ages[Math.floor(ages.length / 2)] : 0
  const over30 = ages.filter((d) => d >= 30).length
  const over90 = ages.filter((d) => d >= 90).length

  const stales = [...byCompany.entries()]
    .filter(([, ds]) => ds.length >= 2)
    .map(([c, ds]) => ({ company: c, n: ds.length, median: ds.slice().sort((a, b) => a - b)[Math.floor(ds.length / 2)] }))
    .sort((a, b) => b.median - a.median)

  return [
    `Posting age census over ${jobs.length} live listing(s) from ${pages} page(s) of the Muse public API`,
    `The API reports ${(meta.total ?? 0).toLocaleString("en-US")} total postings across ${(meta.page_count ?? 0).toLocaleString("en-US")} pages, so this is a small, recent slice of the index.`,
    "",
    `Median age of a live listing: ${median} day(s)`,
    `Newest: ${ages.length ? Math.min(...ages) : "?"} day(s) | oldest: ${ages.length ? Math.max(...ages) : "?"} day(s)`,
    `${undated ? `${undated} listing(s) carry no publication_date and are excluded from the ages. ` : ""}${over30} (${ages.length ? ((over30 / ages.length) * 100).toFixed(0) : 0}%) are more than a month old and ${over90} are more than three months old.`,
    "",
    "Age distribution:",
    ...buckets.map(([label]) => {
      const n = counts.get(label) ?? 0
      return `  ${String(n).padStart(4)}  ${label.padEnd(14)} ${"#".repeat(Math.min(50, Math.round((n / Math.max(1, ages.length)) * 50)))}`
    }),
    "",
    "Companies whose listings look stalest:",
    ...(stales.length
      ? stales.slice(0, TM_LIST_CAP).map((s) => `  ${String(s.median).padStart(5)} day(s) median over ${s.n} listing(s)  ${s.company}`)
      : ["  not enough listings per company in this sample to say"]),
    "",
    "A listing on a job board is not a job opening. A long tail of postings months old usually means the employer left the advert up after the role was filled or put on hold, so a median age far above 30 days should make you discount the volume on the site.",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Who is actually hiring in a slice, and how concentrated the market is. */
export async function marketConcentration(args: { pages?: number }): Promise<string> {
  const pages = tmBound(args?.pages, 1, 5, 2)
  const { jobs, meta } = await tmPages(pages)
  const companies = new Map<string, number>()
  const levels = new Map<string, number>()
  const locations = new Map<string, number>()
  const categories = new Map<string, number>()
  const withLevel = new Set<string>()

  for (const j of jobs) {
    const c = j.company?.name ?? "not reported"
    companies.set(c, (companies.get(c) ?? 0) + 1)
    for (const l of j.levels ?? []) levels.set(l.name ?? "?", (levels.get(l.name ?? "?") ?? 0) + 1)
    for (const l of j.locations ?? []) locations.set(l.name ?? "?", (locations.get(l.name ?? "?") ?? 0) + 1)
    for (const cat of j.categories ?? []) categories.set(cat.name ?? "?", (categories.get(cat.name ?? "?") ?? 0) + 1)
    if ((j.levels ?? []).length) withLevel.add(j.company?.name ?? "?")
  }

  const ranked = [...companies.entries()].sort((a, b) => b[1] - a[1])
  const top10 = ranked.slice(0, 10).reduce((s, [, n]) => s + n, 0)
  const topShare = jobs.length ? top10 / jobs.length : 0
  const hhi = ranked.reduce((s, [, n]) => s + (n / jobs.length) ** 2, 0)
  const single = ranked[0]
  const multi = ranked.filter(([, n]) => n === 1).length
  const remote = [...locations.keys()].filter((l) => /remote/i.test(l)).reduce((s, l) => s + (locations.get(l) ?? 0), 0)

  return [
    `Hiring concentration across ${jobs.length} listing(s) from ${pages} page(s) of the Muse public API`,
    `Distinct employers: ${companies.size} | distinct seniorities: ${levels.size} | distinct locations: ${locations.size} | distinct categories: ${categories.size}`,
    "",
    `Top 10 employers hold ${(topShare * 100).toFixed(0)}% of the listings`,
    `Herfindahl index over employers: ${hhi.toFixed(3)} (below 0.15 is unconcentrated, above 0.25 is dominated by a few)`,
    single ? `Largest single employer: ${single[0]} with ${single[1]} listing(s), ${((single[1] / jobs.length) * 100).toFixed(1)}% of the sample` : "",
    `${multi} employer(s) appear exactly once, which is most of them at this sample size`,
    remote ? `Listings at a location literally named "remote": ${remote} (${((remote / jobs.length) * 100).toFixed(0)}%)` : "",
    `${withLevel.size} of ${companies.size} employer(s) tag their listings with a seniority level`,
    "",
    "Top employers:",
    ...ranked.slice(0, TM_LIST_CAP).map(([c, n]) => `  ${String(n).padStart(4)}  ${c.slice(0, 60)}`),
    "",
    "Seniority levels present:",
    ...tmRank(levels, 8).map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`),
    "",
    "Locations present:",
    ...tmRank(locations, 8).map(([k, n]) => `  ${String(n).padStart(4)}  ${k.slice(0, 50)}`),
    categories.size
      ? `Categories present: ${tmRank(categories, 6).map(([k, n]) => `${k} (${n})`).join(", ")}`
      : "Categories: this slice returned none, which usually means the field is only populated on some listings rather than that the roles are uncategorised.",
    "",
    `The API paginates through ${(meta.page_count ?? 0).toLocaleString("en-US")} pages in a fixed order, so the first pages are a biased sample of whatever the index orders first, not a random draw. Read these shares as the shape of that slice, not of the whole market.`,
  ]
    .filter(Boolean)
    .join("\n")
}

const TM_STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "you", "your", "our", "are", "will", "have", "has", "not",
  "all", "can", "who", "job", "role", "team", "work", "working", "about", "their", "they", "them", "his", "her",
  "but", "was", "were", "been", "being", "would", "should", "could", "may", "more", "than", "into", "over", "such",
  "we", "us", "at", "in", "on", "of", "to", "is", "it", "as", "an", "or", "be", "by", "we're", "us.", "a", "if",
])

/** What the postings on a slice of the board actually ask for, read out of the description text. */
export async function requirementsScan(args: { pages?: number; location?: string }): Promise<string> {
  const pages = tmBound(args?.pages, 1, 4, 1)
  const location = String(args?.location ?? "").trim()
  const { jobs } = await tmPages(pages)
  const sample = location
    ? jobs.filter((j) => (j.locations ?? []).some((l) => new RegExp(location, "i").test(l.name ?? "")))
    : jobs
  if (!sample.length) throw new MuseError(`No listing in this sample matches the location "${location}".`)

  const salaryTiers = new Map<string, number>()
  const withSalary: string[] = []
  const withoutSalary: string[] = []
  const terms = new Map<string, number>()
  const withLevel = new Map<string, number>()

  for (const j of sample) {
    const text = tmText(j.contents ?? "")
    const found = new Set<string>()
    for (const m of text.matchAll(/\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d{2,6}(?:\.\d{2})?)/g)) {
      const raw = m[0].replace(/\s/g, "")
      const n = Number(raw.replace(/[$,]/g, ""))
      if (n >= 20000 && n <= 2000000) {
        const bucket = `$${Math.round(n / 5000) * 5000}`
        salaryTiers.set(bucket, (salaryTiers.get(bucket) ?? 0) + 1)
        found.add(bucket)
      }
    }
    if (found.size) withSalary.push(j.name ?? "(unnamed)")
    else withoutSalary.push(j.name ?? "(unnamed)")

    const words = text.toLowerCase().match(/[a-z][a-z'+#.-]{2,}/g) ?? []
    for (const w of words) {
      const clean = w.replace(/[.'-]+$/g, "")
      if (clean.length < 4 || TM_STOP.has(clean) || /^\d/.test(clean)) continue
      terms.set(clean, (terms.get(clean) ?? 0) + 1)
    }
    for (const l of j.levels ?? []) withLevel.set(l.name ?? "?", (withLevel.get(l.name ?? "?") ?? 0) + 1)
  }

  const descriptions = sample.map((j) => tmText(j.contents ?? "").length)
  const withDesc = descriptions.filter((n) => n > 200).length
  const topTerms = [...terms.entries()].sort((a, b) => b[1] - a[1]).slice(0, TM_LIST_CAP * 2)

  return [
    `Requirements scan over ${sample.length} listing(s)${location ? ` matching "${location}"` : ""} from ${pages} page(s) of the Muse public API`,
    "",
    `Compensation stated: ${withSalary.length} of ${sample.length} (${((withSalary.length / sample.length) * 100).toFixed(0)}%)`,
    withoutSalary.length ? `  no figure in the text for: ${withoutSalary.slice(0, 5).join("; ")}${withoutSalary.length > 5 ? `, and ${withoutSalary.length - 5} more` : ""}` : "",
    withSalary.length ? `  with a figure, e.g. ${withSalary.slice(0, 5).join("; ")}` : "",
    salaryTiers.size
      ? `Figures seen, bucketed to the nearest $5,000: ${[...salaryTiers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => `${k} x${n}`).join(", ")}`
      : "  no salary figure in the range $20,000 to $2,000,000 was found in this sample",
    "",
    `Descriptions over 200 characters of actual text: ${withDesc} of ${sample.length}`,
    withLevel.size ? `Seniority tags: ${[...withLevel.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} (${n})`).join(", ")}` : "No seniority tags in this sample.",
    "",
    "Most frequent significant words across the description text:",
    ...topTerms.map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`),
    "",
    "A salary figure here is whatever number appears in the text, so an equity range, a bonus target and a base salary are all counted the same, and a figure for a different role at the same employer is indistinguishable. Read it as 'a number was published', not as 'this is the pay'.",
    "The word list is frequency over stripped HTML, so it picks up boilerplate from the employer's own template as readily as the requirements, which is why the same handful of phrases dominates a real scan.",
  ]
    .filter(Boolean)
    .join("\n")
}
