const UA = 'mrfentmen-smartrecruiters-mcp/1.0';
const BASE = 'https://api.smartrecruiters.com/v1/companies';

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

async function fetchPostings(company: string, limit = 100): Promise<{ total: number; rows: Posting[] }> {
  const res = await fetch(`${BASE}/${companyId(company)}/postings?limit=${clamp(limit, 100, 100)}&offset=0`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SmartRecruiters returned ${res.status}`);
  const d = (await res.json()) as { totalFound?: number; content?: Posting[] };
  const rows = d.content ?? [];
  return { total: d.totalFound ?? rows.length, rows };
}

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
  const query = String(args?.query ?? '').trim().toLowerCase();
  if (!query) throw new Error('query is required.');
  const limit = clamp(args?.limit, 10, 50);
  const { total, rows } = await fetchPostings(args?.company, 100);
  const hits = rows.filter((entry) =>
    `${entry.name ?? ''} ${place(entry.location)} ${entry.department?.label ?? ''} ${entry.function?.label ?? ''} ${entry.industry?.label ?? ''}`
      .toLowerCase()
      .includes(query));
  if (!hits.length) return `No postings for "${args.company}" match "${args.query}" (scanned ${rows.length} of ${total}).`;
  return `SmartRecruiters postings at "${args.company}" matching "${args.query}" (${hits.length} of ${rows.length} scanned):\n` +
    hits.slice(0, limit).map(row).join('\n');
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
