const UA = 'mrfentmen-arbeitnow-mcp/1.0';
const BASE = 'https://www.arbeitnow.com/api/job-board-api';

export interface JobsArgs {
  limit?: number;
  page?: number;
}

export interface SearchJobsArgs {
  query: string;
  limit?: number;
}

export interface RemoteJobsArgs {
  limit?: number;
}

export interface JobArgs {
  slug: string;
}

export interface TagsArgs {
  limit?: number;
}

interface RawJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  location?: string;
  remote?: boolean;
  tags?: string[];
  job_types?: string[];
  created_at?: string | number;
  url?: string;
}

const clamp = (value: number | undefined, fallback: number, max: number) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

async function fetchPage(page: number): Promise<RawJob[]> {
  const res = await fetch(`${BASE}?page=${clamp(page, 1, 20)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Arbeitnow returned ${res.status}`);
  const d = (await res.json()) as { data?: RawJob[] };
  return d.data ?? [];
}

async function fetchRecent(pages = 2): Promise<RawJob[]> {
  const lists = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1)));
  return lists.flat();
}

const plain = (html?: string) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

// Arbeitnow reports created_at as a unix timestamp in seconds.
const postedOn = (value?: string | number): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '?';
  const epoch = Number(raw);
  const date = Number.isFinite(epoch) && raw.length >= 9 ? new Date(epoch * 1000) : new Date(raw);
  return Number.isNaN(date.getTime()) ? raw.slice(0, 10) : date.toISOString().slice(0, 10);
};

const row = (job: RawJob, index: number) =>
  `${index + 1}. ${job.title ?? '?'} at ${job.company_name ?? '?'} | ${job.location ?? '?'}${job.remote ? ' (remote)' : ''}` +
  ` | ${(job.tags ?? []).slice(0, 3).join(', ') || '?'} | posted ${postedOn(job.created_at)}\n   slug: ${job.slug ?? '?'}`;

export async function jobs(args: JobsArgs): Promise<string> {
  const limit = clamp(args?.limit, 5, 50);
  const page = clamp(args?.page, 1, 20);
  const list = await fetchPage(page);
  if (!list.length) return `No Arbeitnow jobs returned for page ${page}.`;
  return `Arbeitnow jobs (page ${page}, ${list.length} on this page, showing ${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map(row).join('\n');
}

export async function searchJobs(args: SearchJobsArgs): Promise<string> {
  const query = String(args?.query ?? '').trim().toLowerCase();
  if (!query) throw new Error('query is required.');
  const limit = clamp(args?.limit, 10, 50);
  const list = await fetchRecent(2);
  const hits = list.filter((job) =>
    `${job.title ?? ''} ${job.company_name ?? ''} ${job.location ?? ''} ${(job.tags ?? []).join(' ')} ${(job.job_types ?? []).join(' ')}`
      .toLowerCase()
      .includes(query));
  if (!hits.length) return `No Arbeitnow jobs match "${args.query}" in the ${list.length} most recent postings.`;
  return `Arbeitnow jobs matching "${args.query}" (${hits.length} of ${list.length} most recent):\n` +
    hits.slice(0, limit).map(row).join('\n');
}

export async function remoteJobs(args: RemoteJobsArgs): Promise<string> {
  const limit = clamp(args?.limit, 10, 50);
  const list = await fetchRecent(2);
  const hits = list.filter((job) => job.remote === true);
  if (!hits.length) return `No remote Arbeitnow jobs in the ${list.length} most recent postings.`;
  return `Remote Arbeitnow jobs (${hits.length} of ${list.length} most recent):\n` +
    hits.slice(0, limit).map(row).join('\n');
}

export async function job(args: JobArgs): Promise<string> {
  const slug = String(args?.slug ?? '').trim();
  if (!slug) throw new Error('slug is required.');
  const list = await fetchRecent(3);
  const found = list.find((entry) => entry.slug === slug);
  if (!found) {
    return `No job with slug "${slug}" in the ${list.length} most recent Arbeitnow postings. Use search_jobs to find the slug first.`;
  }
  return `${found.title ?? '?'} at ${found.company_name ?? '?'}\n` +
    `Location: ${found.location ?? '?'}${found.remote ? ' (remote)' : ''}\n` +
    `Job types: ${(found.job_types ?? []).join(', ') || '?'}\n` +
    `Tags: ${(found.tags ?? []).join(', ') || '?'}\n` +
    `Posted: ${postedOn(found.created_at)}\n` +
    `Apply: ${found.url ?? '?'}\n\n` +
    plain(found.description).slice(0, 4000);
}

export async function tags(args: TagsArgs): Promise<string> {
  const limit = clamp(args?.limit, 20, 50);
  const list = await fetchRecent(2);
  const counts = new Map<string, number>();
  for (const entry of list) {
    for (const tag of entry.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  if (!counts.size) return 'No Arbeitnow tags returned.';
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  return `Top Arbeitnow job tags (from ${list.length} most recent postings):\n` +
    ranked.map(([tag, count], i) => `${i + 1}. ${tag} - ${count} job(s)`).join('\n');
}

export interface CompaniesArgs {
  limit?: number;
}

/** Rank the employers with the most open postings in the newest feed pages. */
export async function companies(args: CompaniesArgs): Promise<string> {
  const limit = clamp(args?.limit, 15, 50);
  const list = await fetchRecent(3);
  if (!list.length) return 'No Arbeitnow jobs returned.';
  const counts = new Map<string, { jobs: number; remote: number; latest: string; titles: Set<string> }>();
  for (const entry of list) {
    const name = (entry.company_name ?? '').trim();
    if (!name) continue;
    const group = counts.get(name) ?? { jobs: 0, remote: 0, latest: '', titles: new Set<string>() };
    group.jobs += 1;
    if (entry.remote) group.remote += 1;
    const posted = postedOn(entry.created_at);
    if (posted !== '?' && posted > group.latest) group.latest = posted;
    if (entry.title) group.titles.add(entry.title);
    counts.set(name, group);
  }
  if (!counts.size) return `No Arbeitnow postings in the ${list.length} newest jobs named a company.`;
  const ranked = [...counts.entries()].sort((a, b) => b[1].jobs - a[1].jobs).slice(0, limit);
  const lines = ranked.map(([name, group]) => {
    const remote = group.remote ? `, ${group.remote} remote` : '';
    return `${name} - ${group.jobs} job(s)${remote}, newest ${group.latest || '?'}`;
  });
  return `Companies hiring most on Arbeitnow (from ${list.length} newest postings, ${counts.size} companies):\n` +
    lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
}

export interface LocationsArgs {
  limit?: number;
}

/** Where the newest Arbeitnow jobs are, split by city and by job type. */
export async function locations(args: LocationsArgs): Promise<string> {
  const limit = clamp(args?.limit, 15, 50);
  const list = await fetchRecent(2);
  if (!list.length) return 'No Arbeitnow jobs returned.';
  // Values differ only by casing upstream ("Full Time" vs "Full time"), so count
  // them together and keep the first spelling seen for display.
  const tally = (pick: (job: RawJob) => string[]) => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const entry of list) {
      for (const value of pick(entry)) {
        const label = value.trim();
        if (!label) continue;
        const key = label.toLowerCase();
        const row = counts.get(key) ?? { label, count: 0 };
        row.count += 1;
        counts.set(key, row);
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((row) => [row.label, row.count] as [string, number]);
  };
  const cities = tally((entry) => [entry.location ?? '']);
  const types = tally((entry) => entry.job_types ?? []);
  const remote = list.filter((entry) => entry.remote).length;
  const block = (title: string, rows: Array<[string, number]>) =>
    rows.length ? `${title}:\n` + rows.map(([name, n], i) => `  ${i + 1}. ${name} - ${n}`).join('\n') : '';
  const blocks = [
    block('Top locations', cities),
    block('Job types', types),
  ].filter(Boolean);
  return `Arbeitnow spread across ${list.length} newest postings ` +
    `(${remote} remote, ${list.length - remote} on-site):\n` + blocks.join('\n');
}

// ---- batch-2 tools: extra live-data tools (2026-09-26) ----
export interface CompanyJobsArgs {
  company: string;
  limit?: number;
}

/** Every open posting from one employer across the newest Arbeitnow feed pages. */
export async function companyJobs(args: CompanyJobsArgs): Promise<string> {
  const needle = String(args?.company ?? '').trim().toLowerCase();
  if (!needle) throw new Error('company is required.');
  const limit = clamp(args?.limit, 20, 50);
  const list = await fetchRecent(3);
  const hits = list
    .filter((entry) => String(entry.company_name ?? '').toLowerCase().includes(needle))
    .sort((a, b) => postedOn(b.created_at).localeCompare(postedOn(a.created_at)));
  if (!hits.length) {
    return `No Arbeitnow postings from a company matching "${args.company}" in the ${list.length} newest jobs. Try the companies tool for exact names.`;
  }
  const remote = hits.filter((entry) => entry.remote === true).length;
  return `Arbeitnow jobs at companies matching "${args.company}" (${hits.length} of ${list.length} newest postings, ${remote} remote):\n` +
    hits.slice(0, limit).map(row).join('\n');
}

export interface SimilarJobsArgs {
  slug: string;
  limit?: number;
}

/** Other postings that share tags with a job, or come from the same employer. */
export async function similarJobs(args: SimilarJobsArgs): Promise<string> {
  const slug = String(args?.slug ?? '').trim();
  if (!slug) throw new Error('slug is required.');
  const limit = clamp(args?.limit, 10, 30);
  const list = await fetchRecent(3);
  const source = list.find((entry) => entry.slug === slug);
  if (!source) {
    return `No job with slug "${slug}" in the ${list.length} newest Arbeitnow postings. Use search_jobs to find the slug first.`;
  }
  const sourceTags = new Set((source.tags ?? []).map((tag) => tag.toLowerCase()));
  const sourceCompany = String(source.company_name ?? '').toLowerCase();
  const scored = list
    .filter((entry) => entry.slug && entry.slug !== slug)
    .map((entry) => {
      const shared = (entry.tags ?? []).filter((tag) => sourceTags.has(tag.toLowerCase()));
      const sameEmployer = sourceCompany !== '' && String(entry.company_name ?? '').toLowerCase() === sourceCompany;
      return { entry, shared, sameEmployer, score: shared.length + (sameEmployer ? 3 : 0) };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || postedOn(b.entry.created_at).localeCompare(postedOn(a.entry.created_at)));
  if (!scored.length) {
    return `No similar Arbeitnow jobs for "${source.title ?? slug}" in the ${list.length} newest postings (no shared tags or employer).`;
  }
  const lines = scored.slice(0, limit).map(({ entry, shared, sameEmployer, score }, i) => {
    const why = [sameEmployer ? 'same company' : '', shared.length ? `shares ${shared.slice(0, 3).join(', ')}` : '']
      .filter(Boolean)
      .join(', ');
    return `${i + 1}. ${entry.title ?? '?'} at ${entry.company_name ?? '?'} | ${entry.location ?? '?'}${entry.remote ? ' (remote)' : ''} | score ${score} (${why})\n` +
      `   slug: ${entry.slug ?? '?'}`;
  });
  return `Jobs similar to "${source.title ?? slug}" at ${source.company_name ?? '?'} (${scored.length} of ${list.length} newest postings):\n` +
    lines.join('\n');
}

export interface HiringTrendsArgs {
  pages?: number;
  days?: number;
}

/** Posting volume per day over the newest feed pages, plus the remote share. */
export async function hiringTrends(args: HiringTrendsArgs): Promise<string> {
  const pages = clamp(args?.pages, 3, 6);
  const days = clamp(args?.days, 7, 21);
  const list = await fetchRecent(pages);
  if (!list.length) return 'No Arbeitnow jobs returned.';
  const perDay = new Map<string, number>();
  const types = new Map<string, number>();
  let remote = 0;
  for (const entry of list) {
    if (entry.remote) remote += 1;
    const day = postedOn(entry.created_at);
    if (day !== '?') perDay.set(day, (perDay.get(day) ?? 0) + 1);
    for (const type of entry.job_types ?? []) {
      const label = String(type).trim();
      if (label) types.set(label, (types.get(label) ?? 0) + 1);
    }
  }
  const ranked = [...perDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, days);
  if (!ranked.length) return `Arbeitnow did not date any of the ${list.length} newest postings.`;
  const busiest = [...ranked].sort((a, b) => b[1] - a[1])[0];
  const typeLines = [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  return `Arbeitnow hiring trend over ${list.length} postings (${pages} newest feed pages, ${days} days shown):\n` +
    `Remote: ${remote} of ${list.length} (${Math.round((remote / list.length) * 100)}%)\n` +
    `Postings per day (newest first, busiest ${busiest[0]} with ${busiest[1]}):\n` +
    ranked.map(([day, count]) => `  ${day}: ${count}`).join('\n') +
    (typeLines.length
      ? `\nJob types:\n` + typeLines.map(([type, count], i) => `  ${i + 1}. ${type} - ${count}`).join('\n')
      : '');
}
