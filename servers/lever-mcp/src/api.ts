const BASE = 'https://api.lever.co/v0/postings';
const UA = 'mrfentmen-lever-mcp/1.0';

export interface PostingsArgs {
  company: string;
  limit?: number;
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

interface LeverPosting {
  id?: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  workplaceType?: string;
  descriptionPlain?: string;
  openingPlain?: string;
  additionalPlain?: string;
  categories?: { commitment?: string; location?: string; team?: string; department?: string; allLocations?: string[] };
}

export class LeverError extends Error {}

const clamp = (value: number | undefined, fallback: number, max: number) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

const companySlug = (company?: string) => {
  const value = String(company ?? '').trim();
  if (!value) throw new LeverError('Provide a company slug.');
  return encodeURIComponent(value);
};

async function fetchPostings(company: string): Promise<LeverPosting[]> {
  const slug = companySlug(company);
  const res = await fetch(`${BASE}/${slug}?mode=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  // Lever answers unknown boards with 404/"Document not found", which is a
  // wrong-slug problem, not a transient failure.
  if (res.status === 404) {
    throw new LeverError(`No Lever board named "${company}". Check the slug (Lever boards live at jobs.lever.co/<slug>).`);
  }
  if (!res.ok) throw new LeverError(`Lever returned ${res.status} for board "${company}".`);
  const d = (await res.json()) as LeverPosting[];
  return Array.isArray(d) ? d : [];
}

const posted = (epoch?: number) => {
  if (!epoch) return '?';
  const date = new Date(epoch);
  return Number.isNaN(date.getTime()) ? '?' : date.toISOString().slice(0, 10);
};

const brief = (posting: LeverPosting, index: number) => {
  const cat = posting.categories ?? {};
  return `${index + 1}. ${posting.text ?? '?'} [${cat.commitment ?? '?'}] ${cat.location ?? '?'}` +
    `${cat.team ? ` | team ${cat.team}` : ''}${posting.workplaceType ? ` | ${posting.workplaceType}` : ''}` +
    `${posting.hostedUrl ? `\n   ${posting.hostedUrl}` : ''}`;
};

export async function postings(args: PostingsArgs): Promise<string> {
  const limit = clamp(args?.limit, 15, 30);
  const d = await fetchPostings(args.company);
  if (!d.length) return `No postings for "${args.company}".`;
  return `Lever postings for "${args.company}" (${d.length}):\n` + d.slice(0, limit).map(brief).join('\n');
}

export async function posting(args: PostingArgs): Promise<string> {
  const id = String(args?.posting_id ?? '').trim();
  if (!id) throw new Error('posting_id is required.');
  const res = await fetch(`${BASE}/${companySlug(args.company)}/${encodeURIComponent(id)}?mode=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Lever returned ${res.status}`);
  const found = (await res.json()) as LeverPosting;
  const cat = found.categories ?? {};
  return `${found.text ?? '?'} at ${args.company}\n` +
    `Commitment: ${cat.commitment ?? '?'} | Location: ${cat.location ?? '?'} | Team: ${cat.team ?? '?'}\n` +
    `Workplace: ${found.workplaceType ?? '?'} | Posted: ${posted(found.createdAt)}\n` +
    `Apply: ${found.applyUrl ?? found.hostedUrl ?? '?'}\n\n` +
    String(found.descriptionPlain ?? '').replace(/\s+/g, ' ').trim().slice(0, 4000);
}

export async function searchPostings(args: SearchPostingsArgs): Promise<string> {
  const query = String(args?.query ?? '').trim().toLowerCase();
  if (!query) throw new Error('query is required.');
  const limit = clamp(args?.limit, 15, 30);
  const list = await fetchPostings(args.company);
  const hits = list.filter((entry) => {
    const cat = entry.categories ?? {};
    return `${entry.text ?? ''} ${cat.team ?? ''} ${cat.department ?? ''} ${cat.location ?? ''} ${cat.commitment ?? ''}`
      .toLowerCase()
      .includes(query);
  });
  if (!hits.length) return `No postings for "${args.company}" match "${args.query}" (searched ${list.length}).`;
  return `Lever postings at "${args.company}" matching "${args.query}" (${hits.length} of ${list.length}):\n` +
    hits.slice(0, limit).map(brief).join('\n');
}

/** Newest postings first — Lever returns boards in an arbitrary order. */
export async function recentPostings(args: PostingsArgs): Promise<string> {
  const limit = clamp(args?.limit, 15, 30);
  const list = await fetchPostings(args.company);
  if (!list.length) return `No postings for "${args.company}".`;
  const sorted = [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return (
    `Newest Lever postings at "${args.company}" (${sorted.length} open, showing ${Math.min(limit, sorted.length)}):\n` +
    sorted.slice(0, limit).map((p, i) => `${brief(p, i)}\n   posted ${posted(p.createdAt)}`).join('\n')
  );
}

/** Postings grouped by department, the field separate from team. */
export async function departments(args: CompanyArgs): Promise<string> {
  const list = await fetchPostings(args.company);
  if (!list.length) return `No postings for "${args.company}".`;
  const counts = new Map<string, number>();
  for (const entry of list) {
    const key = entry.categories?.department ?? 'unassigned';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return (
    `Lever departments at "${args.company}" (${ranked.length} hiring, ${list.length} postings):\n` +
    ranked.map(([dept, count], i) => `${i + 1}. ${dept} - ${count} posting(s)`).join('\n')
  );
}

export async function teams(args: CompanyArgs): Promise<string> {
  const list = await fetchPostings(args.company);
  if (!list.length) return `No postings for "${args.company}".`;
  const counts = new Map<string, number>();
  for (const entry of list) {
    const team = entry.categories?.team ?? entry.categories?.department ?? 'unassigned';
    counts.set(team, (counts.get(team) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return `Lever teams at "${args.company}" (${ranked.length} hiring, ${list.length} postings):\n` +
    ranked.map(([team, count], i) => `${i + 1}. ${team} - ${count} posting(s)`).join('\n');
}

export async function locations(args: CompanyArgs): Promise<string> {
  const list = await fetchPostings(args.company);
  if (!list.length) return `No postings for "${args.company}".`;
  const counts = new Map<string, number>();
  for (const entry of list) {
    const place = entry.categories?.location ?? 'unlisted';
    counts.set(place, (counts.get(place) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return `Lever locations at "${args.company}" (${ranked.length} places, ${list.length} postings):\n` +
    ranked.map(([place, count], i) => `${i + 1}. ${place} - ${count} posting(s)`).join('\n');
}
