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
