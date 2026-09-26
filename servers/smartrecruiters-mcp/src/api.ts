const UA = 'mrfentmen-smartrecruiters-mcp/1.0';
const BASE = 'https://api.smartrecruiters.com/v1/companies';
const SEARCH = 'https://jobs.smartrecruiters.com/sr-jobs/search';

export interface JobsArgs {
  company: string;
  limit?: number;
  offset?: number;
}

export interface PostingArgs {
  company: string;
  posting_id: string;
}

export interface SearchPostingsArgs {
  company: string;
  query: string;
  limit?: number;
}

export interface CompanyArgs {
  company: string;
}

export interface AllJobsArgs {
  keyword: string;
  country?: string;
  remote?: boolean;
  limit?: number;
}

export interface HiringCompaniesArgs {
  keyword: string;
  country?: string;
  limit?: number;
}

interface Posting {
  id?: string;
  name?: string;
  refNumber?: string;
  releasedDate?: string;
  employmentType?: string;
  experienceLevel?: { label?: string };
  department?: { label?: string };
  function?: { label?: string };
  industry?: { label?: string };
  typeOfEmployment?: { label?: string };
  location?: { city?: string; region?: string; country?: string; remote?: boolean; fullLocation?: string };
}

interface PostingDetail extends Posting {
  applyUrl?: string;
  jobAd?: { sections?: Record<string, { text?: string; title?: string }> };
}

interface SearchHit {
  id?: string;
  name?: string;
  releasedDate?: string;
  applyUrl?: string;
  shortLocation?: string;
  company?: { identifier?: string; name?: string };
  location?: { city?: string; region?: string; country?: string; remote?: boolean; hybrid?: boolean };
}

const clamp = (value: number | undefined, fallback: number, max: number) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 0), max);

const companyId = (company?: string) => {
  const value = String(company ?? '').trim();
  if (!value) throw new Error('Provide a company id, for example BoschGroup.');
  return encodeURIComponent(value);
};

const plain = (html?: string) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const place = (location?: Posting['location']) =>
  location?.fullLocation ?? [location?.city, location?.region, location?.country].filter(Boolean).join(', ') ?? '?';

const row = (posting: Posting, index: number) =>
  `${index + 1}. ${posting.name ?? '?'} | ${place(posting.location)}${posting.location?.remote ? ' (remote)' : ''}` +
  ` | ${posting.department?.label ?? '?'} | ${posting.employmentType ?? posting.typeOfEmployment?.label ?? '?'}` +
  ` | released ${String(posting.releasedDate ?? '?').slice(0, 10)}\n   id: ${posting.id ?? '?'}`;

const hitRow = (hit: SearchHit, index: number) =>
  `${index + 1}. ${hit.name ?? '?'} | ${hit.company?.name ?? '?'} | ${hit.shortLocation ?? place(hit.location)}` +
  `${hit.location?.remote ? ' (remote)' : ''} | released ${String(hit.releasedDate ?? '?').slice(0, 10)}` +
  `\n   apply: ${hit.applyUrl ?? '?'}`;

async function fetchPostings(company: string, limit = 100, query?: string): Promise<{ total: number; rows: Posting[] }> {
  const q = query ? `&q=${encodeURIComponent(query)}` : '';
  const res = await fetch(`${BASE}/${companyId(company)}/postings?limit=${clamp(limit, 100, 100)}&offset=0${q}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SmartRecruiters returned ${res.status}`);
  const d = (await res.json()) as { totalFound?: number; content?: Posting[] };
  const rows = d.content ?? [];
  return { total: d.totalFound ?? rows.length, rows };
}

/**
 * SmartRecruiters' public cross-company search returns one fixed page of its top
 * matches and ignores limit/offset/page, so paging is not possible here.
 */
async function fetchSearch(keyword: string): Promise<{ total: number; hits: SearchHit[] }> {
  const res = await fetch(`${SEARCH}?keyword=${encodeURIComponent(keyword)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SmartRecruiters search returned ${res.status}`);
  const d = (await res.json()) as { totalFound?: number; content?: SearchHit[] };
  const hits = d.content ?? [];
  return { total: d.totalFound ?? hits.length, hits };
}

const REGION_ALIASES: Record<string, string> = {
  uk: 'gb', 'great britain': 'gb', britain: 'gb', england: 'gb', scotland: 'gb', wales: 'gb',
  usa: 'us', 'united states of america': 'us', america: 'us',
  uae: 'ae', korea: 'kr', 'south korea': 'kr', 'north korea': 'kp', russia: 'ru',
  holland: 'nl', czechia: 'cz', 'czech republic': 'cz', turkey: 'tr', turkiye: 'tr', taiwan: 'tw',
};

const regionNames = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return undefined; }
})();

/** Turn a two letter country code into its English name, e.g. 'us' -> 'united states'. */
const regionName = (code?: string) => {
  const value = String(code ?? '').trim().toUpperCase();
  if (value.length !== 2) return '';
  try { return String(regionNames?.of(value) ?? '').toLowerCase(); } catch { return ''; }
};

const matchesCountry = (hit: SearchHit, input: string) => {
  const wanted = input.trim().toLowerCase();
  if (!wanted) return true;
  const code = REGION_ALIASES[wanted] ?? wanted;
  const rowCode = String(hit.location?.country ?? '').toLowerCase();
  if (rowCode && rowCode === code) return true;
  const name = regionName(rowCode);
  return !!name && (name === wanted || name.includes(wanted) || wanted.includes(name));
};

/**
 * The upstream search ranks by recency, not relevance, so jobs whose title really
 * matches the keywords are pushed to the top here.
 */
const rankHits = (hits: SearchHit[], keyword: string) => {
  const words = keyword.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 1);
  const score = (hit: SearchHit) => {
    const name = String(hit.name ?? '').toLowerCase();
    return words.reduce((total, word) => total + (name.includes(word) ? 1 : 0), 0);
  };
  return hits
    .map((hit, index) => ({ hit, index, score: score(hit) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.hit);
};

export async function jobs(args: JobsArgs): Promise<string> {
  const { total, rows } = await fetchPostings(args?.company, 100);
  if (!rows.length) return `No SmartRecruiters postings for "${args.company}".`;
  const offset = clamp(args?.offset, 0, rows.length);
  const limit = clamp(args?.limit, 10, 50);
  const slice = rows.slice(offset, offset + limit);
  return `SmartRecruiters postings for "${args.company}" (${total} total, showing ${slice.length} from offset ${offset}):\n` +
    slice.map(row).join('\n');
}

export async function posting(args: PostingArgs): Promise<string> {
  const id = String(args?.posting_id ?? '').trim();
  if (!id) throw new Error('posting_id is required.');
  const res = await fetch(`${BASE}/${companyId(args.company)}/postings/${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SmartRecruiters returned ${res.status}`);
  const found = (await res.json()) as PostingDetail;
  const sections = found.jobAd?.sections ?? {};
  const body = Object.values(sections)
    .map((section) => plain(section?.text))
    .filter(Boolean)
    .join('\n\n');
  return `${found.name ?? '?'}\n` +
    `Location: ${place(found.location)}${found.location?.remote ? ' (remote)' : ''}\n` +
    `Department: ${found.department?.label ?? '?'} | Function: ${found.function?.label ?? '?'}\n` +
    `Employment: ${found.typeOfEmployment?.label ?? found.employmentType ?? '?'} | Experience: ${found.experienceLevel?.label ?? '?'}\n` +
    `Released: ${String(found.releasedDate ?? '?').slice(0, 10)} | Ref: ${found.refNumber ?? '?'}\n` +
    `Apply: ${found.applyUrl ?? '?'}\n\n` +
    body.slice(0, 4000);
}

export async function searchPostings(args: SearchPostingsArgs): Promise<string> {
  const query = String(args?.query ?? '').trim();
  if (!query) throw new Error('query is required.');
  const limit = clamp(args?.limit, 10, 50);
  const { total, rows } = await fetchPostings(args?.company, 50, query);
  if (!rows.length) return `No postings for "${args.company}" match "${query}" (${total} postings on the board).`;
  return `SmartRecruiters postings at "${args.company}" matching "${query}" (${total} match on the board, showing ${Math.min(limit, rows.length)}):\n` +
    rows.slice(0, limit).map(row).join('\n');
}

export async function departments(args: CompanyArgs): Promise<string> {
  const { total, rows } = await fetchPostings(args?.company, 100);
  if (!rows.length) return `No SmartRecruiters postings for "${args.company}".`;
  const count = (pick: (posting: Posting) => string | undefined) => {
    const counts = new Map<string, number>();
    for (const entry of rows) {
      const key = pick(entry);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  };
  const block = (title: string, entries: Array<[string, number]>) =>
    entries.length
      ? `${title}:\n` + entries.map(([name, n], i) => `  ${i + 1}. ${name} - ${n} job(s)`).join('\n')
      : '';
  const blocks = [
    block('Departments', count((p) => p.department?.label)),
    block('Functions', count((p) => p.function?.label)),
    block('Industries', count((p) => p.industry?.label)),
    block('Experience levels', count((p) => p.experienceLevel?.label)),
  ].filter(Boolean);
  return `SmartRecruiters hiring breakdown for "${args.company}" (${rows.length} of ${total} postings scanned):\n` +
    blocks.join('\n');
}

export async function searchAllJobs(args: AllJobsArgs): Promise<string> {
  const keyword = String(args?.keyword ?? '').trim();
  if (!keyword) throw new Error('keyword is required, for example python developer.');
  const country = String(args?.country ?? '').trim();
  const limit = clamp(args?.limit, 10, 40);
  const { total, hits } = await fetchSearch(keyword);
  let matched = rankHits(hits, keyword);
  const notes: string[] = [];
  if (country) {
    matched = matched.filter((hit) => matchesCountry(hit, country));
    notes.push(`filtered to "${country}"`);
  }
  if (args?.remote === true) {
    matched = matched.filter((hit) => hit.location?.remote);
    notes.push('remote only');
  }
  const scope = notes.length ? ` (${notes.join(', ')})` : '';
  if (!matched.length) {
    const hint = country ? ` Check the country spelling (use a name like "Germany" or a code like "DE").` : '';
    return `No SmartRecruiters jobs for "${keyword}"${scope} among the ${hits.length} top matches (${total} jobs match upstream).${hint}`;
  }
  return `SmartRecruiters jobs for "${keyword}" across all companies${scope} - ` +
    `${matched.length} of the top ${hits.length} matches, ${total} jobs match upstream, best title matches first:\n` +
    matched.slice(0, limit).map(hitRow).join('\n') +
    `\nSmartRecruiters returns a single 99 job page and ignores paging, so older matches are not reachable.`;
}

export async function hiringCompanies(args: HiringCompaniesArgs): Promise<string> {
  const keyword = String(args?.keyword ?? '').trim();
  if (!keyword) throw new Error('keyword is required, for example data engineer.');
  const country = String(args?.country ?? '').trim();
  const limit = clamp(args?.limit, 5, 25);
  const { total, hits } = await fetchSearch(keyword);
  const scope = country ? ` in "${country}"` : '';
  const pool = rankHits(hits, keyword).filter((hit) => matchesCountry(hit, country));
  if (!pool.length) {
    const hint = country ? ` Check the country spelling (use a name like "Germany" or a code like "DE").` : '';
    return `No SmartRecruiters companies hiring for "${keyword}"${scope} among the ${hits.length} top matches (${total} jobs match upstream).${hint}`;
  }
  const groups = new Map<string, { name: string; jobs: SearchHit[] }>();
  for (const hit of pool) {
    const key = hit.company?.identifier ?? hit.company?.name ?? '?';
    const group = groups.get(key) ?? { name: hit.company?.name ?? key, jobs: [] };
    group.jobs.push(hit);
    groups.set(key, group);
  }
  const ranked = [...groups.values()].sort((a, b) => b.jobs.length - a.jobs.length).slice(0, limit);
  return `Companies hiring for "${keyword}"${scope} on SmartRecruiters ` +
    `(${groups.size} companies across the top ${pool.length} matches, ${total} jobs match upstream):\n` +
    ranked
      .map((group, i) => {
        const sample = group.jobs[0];
        return `  ${i + 1}. ${group.name} - ${group.jobs.length} job(s), e.g. ` +
          `${sample?.name ?? '?'} (${sample?.shortLocation ?? place(sample?.location)})`;
      })
      .join('\n');
}
