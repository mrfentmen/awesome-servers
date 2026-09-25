const BASE = 'https://remoteok.com/api';
const UA = 'mrfentmen-remoteok-mcp/1.0';

export interface JobsArgs {
  limit?: number;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface JobArgs {
  job_id: string;
}

export interface RankedArgs {
  limit?: number;
}

interface Job {
  id?: string | number;
  slug?: string;
  company?: string;
  position?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  tags?: string[];
  date?: string;
  url?: string;
  apply_url?: string;
  description?: string;
}

const clamp = (value: number | undefined, fallback: number, max: number) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

const plain = (html?: string) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const pay = (job: Job) =>
  job.salary_max ? `$${job.salary_min ?? '?'}-$${job.salary_max}` : 'salary n/a';

const row = (job: Job, index: number) =>
  `${index + 1}. ${job.position ?? '?'} @ ${job.company ?? '?'} - ${pay(job)} | ${(job.tags ?? []).slice(0, 4).join(', ')}` +
  ` | ${job.location || 'remote'}`;

async function fetchJobs(query?: string): Promise<Job[]> {
  const suffix = query ? `?tags=${encodeURIComponent(query)}` : '?tags=';
  const res = await fetch(`${BASE}${suffix}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`RemoteOK returned ${res.status}`);
  const d = (await res.json()) as Job[];
  if (!Array.isArray(d)) return [];
  // The first element of the RemoteOK feed is a legal notice, not a job.
  return d.filter((entry) => entry && (entry.position || entry.company));
}

export async function jobs(args: JobsArgs): Promise<string> {
  const limit = clamp(args?.limit, 10, 25);
  const list = await fetchJobs();
  if (!list.length) return 'No jobs returned.';
  return `RemoteOK jobs (latest ${Math.min(limit, list.length)}):\n` + list.slice(0, limit).map(row).join('\n');
}

export async function search(args: SearchArgs): Promise<string> {
  const query = String(args?.query ?? '').trim();
  if (!query) throw new Error('Provide search terms.');
  const limit = clamp(args?.limit, 10, 25);
  const list = await fetchJobs(query);
  if (!list.length) return `No jobs for "${query}".`;
  return `RemoteOK jobs tagged "${query}" (${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map(row).join('\n');
}

export async function job(args: JobArgs): Promise<string> {
  const id = String(args?.job_id ?? '').trim();
  if (!id) throw new Error('job_id is required.');
  const list = await fetchJobs();
  const found = list.find((entry) => String(entry.id) === id || entry.slug === id);
  if (!found) return `No RemoteOK job with id ${id} in the current feed. Use the jobs tool to list ids.`;
  return `${found.position ?? '?'} at ${found.company ?? '?'}\n` +
    `Location: ${found.location || 'remote'} | Pay: ${pay(found)}\n` +
    `Tags: ${(found.tags ?? []).join(', ') || 'none'} | Posted: ${String(found.date ?? '?').slice(0, 10)}\n` +
    `Apply: ${found.apply_url ?? found.url ?? '?'}\n\n` +
    plain(found.description).slice(0, 4000);
}

export async function topSalaries(args: RankedArgs): Promise<string> {
  const limit = clamp(args?.limit, 10, 25);
  const list = await fetchJobs();
  const paid = list
    .filter((entry) => Number(entry.salary_max ?? 0) > 0)
    .sort((a, b) => Number(b.salary_max ?? 0) - Number(a.salary_max ?? 0))
    .slice(0, limit);
  if (!paid.length) return 'No RemoteOK jobs in the current feed publish a salary.';
  return `Highest-paying RemoteOK jobs (from ${list.length} live postings):\n` +
    paid.map((entry, i) => `${i + 1}. ${entry.position ?? '?'} @ ${entry.company ?? '?'} - ${pay(entry)} (${entry.location || 'remote'})`).join('\n');
}

export async function companies(args: RankedArgs): Promise<string> {
  const limit = clamp(args?.limit, 20, 50);
  const list = await fetchJobs();
  const counts = new Map<string, number>();
  for (const entry of list) {
    const name = entry.company?.trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  if (!counts.size) return 'No RemoteOK companies in the current feed.';
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  return `Companies hiring on RemoteOK (from ${list.length} live postings):\n` +
    ranked.map(([name, count], i) => `${i + 1}. ${name} - ${count} opening(s)`).join('\n');
}

export async function tags(args: RankedArgs): Promise<string> {
  const limit = clamp(args?.limit, 20, 50);
  const list = await fetchJobs();
  const counts = new Map<string, number>();
  for (const entry of list) {
    for (const tag of entry.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  if (!counts.size) return 'No RemoteOK tags in the current feed.';
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  return `Top RemoteOK tags (from ${list.length} live postings):\n` +
    ranked.map(([tag, count], i) => `${i + 1}. ${tag} - ${count} job(s)`).join('\n');
}
