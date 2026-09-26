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

export interface CompaniesArgs {
  count?: number;
  geo?: string;
  industry?: string;
  tag?: string;
}

export async function companies(args: CompaniesArgs): Promise<string> {
  const limit = clamp(args?.count, 10);
  const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
  if (!list.length) return 'No Jobicy jobs matched those filters.';
  const groups = new Map<string, { jobs: number; latest: string; pays: number; top?: number }>();
  for (const job of list) {
    const name = String(job.companyName ?? '').trim();
    if (!name) continue;
    const group = groups.get(name) ?? { jobs: 0, latest: '', pays: 0 };
    group.jobs += 1;
    const posted = String(job.pubDate ?? '').slice(0, 10);
    if (posted > group.latest) group.latest = posted;
    const annual = annualMax(job);
    if (annual != null) {
      group.pays += 1;
      group.top = Math.max(group.top ?? 0, annual);
    }
    groups.set(name, group);
  }
  if (!groups.size) return 'No Jobicy postings in the most recent feed named a company.';
  const ranked = [...groups.entries()].sort((a, b) => b[1].jobs - a[1].jobs).slice(0, limit);
  const scope = [args?.geo, args?.industry, args?.tag].filter(Boolean).join(', ');
  return `Companies hiring most on Jobicy${scope ? ` (${scope})` : ''} — from the ${list.length} most recent postings, ${groups.size} companies:\n` +
    ranked
      .map(([name, group], i) => {
        const pay = group.top ? `, top published pay ${money(group.top)}/year` : '';
        const disclosed = group.pays ? `, ${group.pays} disclosed pay` : '';
        return `${i + 1}. ${name} - ${group.jobs} job(s)${disclosed}${pay}, newest ${group.latest || '?'}`;
      })
      .join('\n');
}

export interface LevelsArgs {
  geo?: string;
}

export async function jobLevels(args: LevelsArgs): Promise<string> {
  const list = await fetchJobs({ count: 50, geo: args?.geo });
  if (!list.length) return 'No Jobicy jobs matched those filters.';
  const tally = (pick: (job: RawJob) => string[]) => {
    const counts = new Map<string, number>();
    for (const job of list) {
      for (const value of pick(job)) {
        const typed = String(value ?? '').trim().toLowerCase();
        if (typed) counts.set(typed, (counts.get(typed) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };
  const levels = tally((job) => [String(job.jobLevel ?? '')]);
  const types = tally((job) => job.jobType ?? []);
  const block = (title: string, rows: Array<[string, number]>) =>
    rows.length ? `${title}:\n` + rows.map(([name, n], i) => `  ${i + 1}. ${name} - ${n} job(s)`).join('\n') : '';
  // Salary per level is only meaningful for the jobs that published one.
  const payByLevel = new Map<string, number[]>();
  for (const job of list) {
    const annual = annualMax(job);
    if (annual == null) continue;
    const level = String(job.jobLevel ?? 'unspecified').trim().toLowerCase();
    payByLevel.set(level, [...(payByLevel.get(level) ?? []), annual]);
  }
  const payLines = [...payByLevel.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([level, values]) => {
      const top = Math.max(...values);
      return `  ${level}: ${values.length} job(s) with pay, highest ${money(top)}/year`;
    });
  const scope = args?.geo ? ` for ${args.geo}` : '';
  const blocks = [
    block('Experience levels', levels),
    block('Employment types', types),
    payLines.length ? `Published pay by level:\n${payLines.join('\n')}` : '',
  ].filter(Boolean);
  return `Jobicy remote hiring breakdown${scope} (from the ${list.length} most recent postings):\n` + blocks.join('\n');
}

// ---- batch-2 tools: extra live-data tools (2026-09-26) ----
export interface GeographiesArgs {
  count?: number;
  industry?: string;
  tag?: string;
}

/** Live breakdown of where the open remote jobs are based (jobGeo). */
export async function geographies(args: GeographiesArgs): Promise<string> {
  const list = await fetchJobs({ count: 50, industry: args?.industry, tag: args?.tag });
  if (!list.length) return 'No Jobicy jobs matched those filters.';
  const counts = new Map<string, { jobs: number; top?: number }>();
  for (const job of list) {
    // Upstream geo strings sometimes carry double spaces between countries.
    const key = String(job.jobGeo ?? '').replace(/\s+/g, ' ').trim() || 'not stated';
    const group = counts.get(key) ?? { jobs: 0 };
    group.jobs += 1;
    const annual = annualMax(job);
    if (annual != null) group.top = Math.max(group.top ?? 0, annual);
    counts.set(key, group);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1].jobs - a[1].jobs);
  const scope = [args?.industry, args?.tag].filter(Boolean).join(', ');
  return `Where Jobicy remote jobs are based${scope ? ` (${scope})` : ''} — from the ${list.length} most recent postings, ${ranked.length} place(s):\n` +
    ranked.map(([place, group], i) =>
      `${i + 1}. ${place} - ${group.jobs} job(s)${group.top ? `, top published pay ${money(group.top)}/year` : ''}`
    ).join('\n');
}

export interface CompanyJobsArgs {
  company: string;
  count?: number;
  geo?: string;
  industry?: string;
  tag?: string;
}

/** Every open role from one company in the most recent Jobicy postings. */
export async function companyJobs(args: CompanyJobsArgs): Promise<string> {
  const needle = String(args?.company ?? '').trim().toLowerCase();
  if (!needle) throw new Error('company is required.');
  const limit = clamp(args?.count, 20);
  const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
  const hits = list
    .filter((job) => String(job.companyName ?? '').toLowerCase().includes(needle))
    .sort((a, b) => String(b.pubDate ?? '').localeCompare(String(a.pubDate ?? '')));
  if (!hits.length) {
    return `No Jobicy postings from a company matching "${args.company}" among the ${list.length} most recent jobs. Use the companies tool for exact names.`;
  }
  const names = [...new Set(hits.map((job) => String(job.companyName ?? '?')))];
  return `Jobicy jobs at ${names.join(', ')} (${hits.length} of ${list.length} most recent):\n\n` +
    hits.slice(0, limit).map((job, i) =>
      `${row(job, i)}\n   ---\n   ${String(job.jobExcerpt ?? job.jobDescription ?? 'no summary published').replace(/\s+/g, ' ').slice(0, 400)}`
    ).join('\n\n');
}

export interface SalaryBandsArgs {
  geo?: string;
  industry?: string;
  tag?: string;
}

const PAY_BANDS: Array<{ label: string; upTo: number }> = [
  { label: 'under $50k', upTo: 50000 },
  { label: '$50k-$80k', upTo: 80000 },
  { label: '$80k-$120k', upTo: 120000 },
  { label: '$120k-$200k', upTo: 200000 },
  { label: '$200k+', upTo: Number.POSITIVE_INFINITY },
];

/** Published-pay distribution across the most recent Jobicy postings. */
export async function salaryBands(args: SalaryBandsArgs): Promise<string> {
  const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
  const annual = list
    .map((job) => annualMax(job))
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);
  if (!annual.length) {
    return `None of the ${list.length} most recent Jobicy postings publish a salary range.`;
  }
  const middle = Math.floor(annual.length / 2);
  const median = annual.length % 2 ? annual[middle] : (annual[middle - 1] + annual[middle]) / 2;
  const disclosure = Math.round((annual.length / list.length) * 100);
  const bands = PAY_BANDS.map((band, index) => {
    const floor = index === 0 ? 0 : PAY_BANDS[index - 1].upTo;
    const members = annual.filter((value) => value >= floor && value < band.upTo);
    const share = Math.round((members.length / annual.length) * 100);
    return `${band.label}: ${members.length} job(s) (${share}%)`;
  });
  const scope = [args?.geo, args?.industry, args?.tag].filter(Boolean).join(', ');
  return `Published pay on Jobicy${scope ? ` (${scope})` : ''} — ${annual.length} of ${list.length} most recent postings disclose a salary (${disclosure}%):\n` +
    `Median ${money(median)}/year | lowest ${money(annual[0])} | highest ${money(annual[annual.length - 1])}\n` +
    `Bands (annualized):\n` +
    bands.map((line) => `  ${line}`).join('\n') +
    `\nOnly jobs that published a range are counted; the rest are silent about pay.`;
}
