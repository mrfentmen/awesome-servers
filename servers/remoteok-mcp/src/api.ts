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
// ---- batch-5 tools: freshness window, tag intersections, one company's board (2026-09-27) ----

// The feed dates every job, but the Job type the earlier tools read omits the
// epoch, so it is declared here (declarations merge).
interface Job {
  epoch?: number
}

const hoursOld = (job: Job): number => {
  if (typeof job.epoch === "number" && job.epoch > 0) return (Date.now() / 1000 - job.epoch) / 3600
  const parsed = Date.parse(job.date ?? "")
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : (Date.now() - parsed) / 3600000
}

const tally = (values: string[]): [string, number][] => {
  const counts = new Map<string, number>()
  for (const value of values) {
    const key = value.trim().toLowerCase()
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

const ageLabel = (hours: number) => (hours < 1 ? `${Math.round(hours * 60)} min ago` : hours < 24 ? `${Math.floor(hours)}h ago` : `${Math.floor(hours / 24)}d ago`)

/**
 * Jobs posted inside a time window. The public feed is a rolling list, so
 * "newest" is a filter the feed itself does not offer.
 */
export async function newestJobs(args: { hours?: number; limit?: number }): Promise<string> {
  const hours = Math.min(Math.max(Math.trunc(args.hours ?? 24), 1), 720)
  const limit = clamp(args.limit, 10, 50)
  const all = await fetchJobs()
  const fresh = all.filter((job) => hoursOld(job) <= hours).sort((a, b) => hoursOld(a) - hoursOld(b))
  if (!fresh.length) return `Nothing in the RemoteOK feed was posted in the last ${hours} hour(s). The feed holds ${all.length} job(s) in total.`
  const tags = tally(fresh.flatMap((job) => job.tags ?? [])).slice(0, 8)
  const companies = new Set(fresh.map((job) => (job.company ?? "").toLowerCase()).filter(Boolean))
  return [
    `Posted in the last ${hours} hour(s): ${fresh.length} of ${all.length} job(s) on the feed`,
    `  ${companies.size} compan${companies.size === 1 ? "y" : "ies"} hiring | tags in this window: ${tags.map(([tag, n]) => `${tag} (${n})`).join(", ") || "none"}`,
    "",
    ...fresh.slice(0, limit).map((job, i) => `${i + 1}. ${ageLabel(hoursOld(job))} — ${job.position ?? "?"} @ ${job.company ?? "?"} — ${pay(job)} | ${job.location || "remote"}`),
    fresh.length > limit ? `\nShowing ${limit} of ${fresh.length}.` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * Jobs that carry every tag given, which is how a skills intersection is
 * searched: "react" plus "senior" finds roles the feed's single-tag filter
 * cannot express.
 */
export async function tagCombinations(args: { tags: string[]; limit?: number }): Promise<string> {
  const wanted = (args.tags ?? []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
  if (wanted.length < 2) throw new Error("Give at least two tags, e.g. ['react', 'senior'].")
  const limit = clamp(args.limit, 10, 40)
  const all = await fetchJobs()
  const hits = all.filter((job) => {
    const jobTags = (job.tags ?? []).map((tag) => tag.toLowerCase())
    return wanted.every((want) => jobTags.some((tag) => tag === want || tag.includes(want)))
  })
  if (!hits.length) return `No job on the current feed carries all of: ${wanted.join(" + ")}. The feed returns a rolling sample, so a narrower combination can come back empty.`
  const withPay = hits.filter((job) => (job.salary_max ?? 0) > 0)
  return [
    `Jobs tagged ${wanted.join(" + ")}: ${hits.length} of ${all.length} on the feed`,
    withPay.length ? `  ${withPay.length} publish a salary, top ${Math.max(...withPay.map((job) => job.salary_max ?? 0)).toLocaleString()} USD` : "  none of them publishes a salary",
    "",
    ...hits.slice(0, limit).map((job, i) => `${i + 1}. ${job.position ?? "?"} @ ${job.company ?? "?"} — ${pay(job)} | ${(job.tags ?? []).slice(0, 5).join(", ")}`),
    hits.length > limit ? `\nShowing ${limit} of ${hits.length}.` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * Everything one company has open right now, plus the tag mix and pay range of
 * its roles — the question a candidate asks before applying anywhere.
 */
export async function companyJobs(args: { company: string; limit?: number }): Promise<string> {
  const wanted = (args.company ?? "").trim().toLowerCase()
  if (wanted.length < 2) throw new Error("Give a company name, e.g. 'stripe'.")
  const limit = clamp(args.limit, 15, 40)
  const all = await fetchJobs()
  const hits = all.filter((job) => (job.company ?? "").toLowerCase().includes(wanted))
  if (!hits.length) return `No company on the current feed matches "${args.company}". The feed holds ${all.length} job(s) at a time.`
  const exact = hits.filter((job) => (job.company ?? "").toLowerCase() === wanted)
  const chosen = exact.length ? exact : hits
  const name = chosen[0].company ?? args.company
  const tags = tally(chosen.flatMap((job) => job.tags ?? [])).slice(0, 10)
  const pays = chosen.map((job) => job.salary_max ?? 0).filter((n) => n > 0)
  return [
    `${name}: ${chosen.length} open role(s) on the feed`,
    pays.length ? `  published pay range: ${Math.min(...chosen.map((job) => job.salary_min ?? 0).filter((n) => n > 0)).toLocaleString()} to ${Math.max(...pays).toLocaleString()} USD` : "  no salary published",
    `  tags across its roles: ${tags.map(([tag, n]) => `${tag} (${n})`).join(", ") || "none"}`,
    "",
    ...chosen.slice(0, limit).map((job, i) => `${i + 1}. ${job.position ?? "?"} — ${pay(job)} | ${job.location || "remote"} | ${(job.tags ?? []).slice(0, 4).join(", ")}\n   ${job.url ?? job.apply_url ?? ""}`),
    chosen.length > limit ? `\nShowing ${limit} of ${chosen.length}.` : "",
  ].filter((line) => line !== "").join("\n")
}

// ---- muxH tools:
// The tools above list what is in the feed. These two measure it: how much of
// the feed is actually usable, and what a tag is worth once the postings that
// disclose a salary are separated from the ones that do not.

// The feed carries a verification flag and a logo that the interface above does
// not declare; interfaces merge, so the fields become readable here.
interface Job {
  verified?: boolean;
  company_logo?: string;
  epoch?: number;
  original?: string;
}

