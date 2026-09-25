const UA = 'mrfentmen-jobicy-mcp/1.0';
const BASE = 'https://jobicy.com/api/v2/remote-jobs';

export interface RawJob {
  id?: number;
  jobTitle?: string;
  companyName?: string;
  jobGeo?: string;
  jobLevel?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  url?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
}

export interface JobsArgs {
  count?: number;
  geo?: string;
  industry?: string;
  tag?: string;
}

export interface JobDetailsArgs {
  query: string;
  geo?: string;
}

export interface IndustriesArgs {
  geo?: string;
}

export interface TopSalariesArgs {
  count?: number;
  geo?: string;
  industry?: string;
  tag?: string;
}

const clamp = (value: number | undefined, fallback: number) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), 50);

async function fetchJobs(args: JobsArgs): Promise<RawJob[]> {
  const params = new URLSearchParams({ count: String(clamp(args?.count, 5)) });
  for (const key of ['geo', 'industry', 'tag'] as const) {
    const value = args?.[key];
    if (value && String(value).trim()) params.set(key, String(value).trim());
  }
  const res = await fetch(`${BASE}?${params}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Jobicy returned ${res.status}`);
  const d = (await res.json()) as { jobs?: RawJob[]; success?: boolean; error?: string };
  if (d.error) throw new Error(`Jobicy: ${d.error}`);
  return d.jobs ?? [];
}

const money = (value?: number) => (value == null ? '?' : `$${Math.round(value).toLocaleString('en-US')}`);

const salary = (job: RawJob): string => {
  if (job.salaryMin == null && job.salaryMax == null) return 'salary not published';
  return `${money(job.salaryMin)}-${money(job.salaryMax)} ${job.salaryCurrency ?? 'USD'} ${job.salaryPeriod ?? ''}`.trim();
};

const ANNUAL_FACTOR: Record<string, number> = {
  yearly: 1, annually: 1, year: 1, monthly: 12, month: 12, weekly: 52, week: 52,
  biweekly: 26, daily: 260, day: 260, hourly: 2080, hour: 2080,
};

const annualMax = (job: RawJob): number | null => {
  const factor = ANNUAL_FACTOR[String(job.salaryPeriod ?? '').toLowerCase()];
  const top = job.salaryMax ?? job.salaryMin;
  if (!factor || top == null) return null;
  return top * factor;
};

const row = (job: RawJob, index: number) =>
  `${index + 1}. ${job.jobTitle ?? '?'} at ${job.companyName ?? '?'}\n` +
  `   ${job.jobGeo ?? 'remote'} | ${job.jobLevel ?? 'any level'} | ` +
  `${(job.jobIndustry ?? []).join(', ') || 'industry n/a'} | ${(job.jobType ?? []).join(', ') || 'type n/a'}\n` +
  `   ${salary(job)} | posted ${String(job.pubDate ?? '?').slice(0, 10)}\n` +
  `   ${job.url ?? ''}`;

export async function jobs(args: JobsArgs): Promise<string> {
  const list = await fetchJobs(args ?? {});
  if (!list.length) return 'No Jobicy jobs matched those filters.';
  return `Jobicy remote jobs (${list.length}):\n` + list.map(row).join('\n\n');
}

export async function jobDetails(args: JobDetailsArgs): Promise<string> {
  const query = String(args?.query ?? '').trim().toLowerCase();
  if (!query) throw new Error('query is required');
  const list = await fetchJobs({ count: 50, geo: args?.geo });
  const hits = list.filter((job) =>
    `${job.jobTitle ?? ''} ${job.companyName ?? ''} ${(job.jobIndustry ?? []).join(' ')} ${job.jobExcerpt ?? ''}`
      .toLowerCase()
      .includes(query));
  if (!hits.length) {
    return `None of the ${list.length} most recent Jobicy jobs match "${args.query}". Try the jobs tool with a tag or industry filter.`;
  }
  return `Jobicy jobs matching "${args.query}" (${hits.length} of the ${list.length} most recent):\n\n` +
    hits.map((job, i) =>
      `${row(job, i)}\n   ---\n   ${String(job.jobDescription ?? job.jobExcerpt ?? 'no description').replace(/\s+/g, ' ').slice(0, 1200)}`
    ).join('\n\n');
}

export async function industries(args: IndustriesArgs): Promise<string> {
  const list = await fetchJobs({ count: 50, geo: args?.geo });
  const counts = new Map<string, number>();
  for (const job of list) {
    for (const industry of job.jobIndustry ?? []) {
      counts.set(industry, (counts.get(industry) ?? 0) + 1);
    }
  }
  if (!counts.size) return 'No Jobicy industries returned.';
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const scope = args?.geo ? ` for ${args.geo}` : '';
  return `Jobicy industries by open remote jobs${scope} (from the ${list.length} most recent postings):\n` +
    ranked.map(([industry, count], i) => `${i + 1}. ${industry} - ${count} job(s)`).join('\n');
}

export async function topSalaries(args: TopSalariesArgs): Promise<string> {
  const limit = clamp(args?.count, 10);
  const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
  const ranked = list
    .map((job) => ({ job, annual: annualMax(job) }))
    .filter((entry): entry is { job: RawJob; annual: number } => entry.annual != null)
    .sort((a, b) => b.annual - a.annual)
    .slice(0, limit);
  if (!ranked.length) return 'No Jobicy jobs in the most recent 50 publish a salary.';
  return `Highest-paying Jobicy remote jobs (annualized, from the ${list.length} most recent postings):\n\n` +
    ranked.map((entry, i) =>
      `${i + 1}. ${entry.job.jobTitle ?? '?'} at ${entry.job.companyName ?? '?'} - ${money(entry.annual)}/year\n` +
      `   published as ${salary(entry.job)} | ${entry.job.jobGeo ?? 'remote'} | posted ${String(entry.job.pubDate ?? '?').slice(0, 10)}\n` +
      `   ${entry.job.url ?? ''}`
    ).join('\n\n');
}
