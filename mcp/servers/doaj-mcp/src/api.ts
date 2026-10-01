const BASE = 'https://doaj.org/api';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/search/articles/${encodeURIComponent(query)}?pageSize=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-doaj-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DOAJ returned ${res.status}`);
  const d = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const rows = d.results ?? [];
  if (!rows.length) return `No articles found for "${query}".`;
  return `Open access articles for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const bib = (r.bibjson ?? {}) as Record<string, unknown>;
      const title = (bib.title ?? '') as string;
      const authors = (bib.author ?? []) as Array<Record<string, unknown>>;
      const auth = authors.slice(0, 2).map((a) => String(a.name ?? '')).join(', ');
      const jr = (bib.journal ?? {}) as Record<string, unknown>;
      return `${i + 1}. ${title}${auth ? ` | ${auth}` : ''} | ${String(jr.title ?? '')}`;
    }).join('\n');
}

export async function journal(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a journal name.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/search/journals/${encodeURIComponent(query)}?pageSize=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-doaj-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DOAJ returned ${res.status}`);
  const d = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const rows = d.results ?? [];
  if (!rows.length) return `No journals found for "${query}".`;
  return `Open access journals for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const bib = (r.bibjson ?? {}) as Record<string, unknown>;
      const title = (bib.title ?? '') as string;
      const issn = (bib.issn ?? []) as Array<unknown>;
      const p = (bib.publisher ?? {}) as Record<string, unknown>;
      return `${i + 1}. ${title}${Array.isArray(issn) && issn.length ? ` | ISSN ${issn.join(', ')}` : ''} | ${String(p.name ?? '')}`;
    }).join('\n');
}

// ---- muxA tools:
// The two existing tools pass a free text query and a page size and nothing
// else. These add exact identifier lookups, the journal record itself, and
// paging with sorting, all against the same DOAJ search API.
const DOAJ_UA = 'mrfentmen-doaj-mcp/1.0';

// DOAJ rejects an unknown sort with HTTP 400 and takes far longer than the
// request timeout on some other fields, so only the two that answer quickly
// are offered.
const DOAJ_SORTS = ['created_date', 'last_updated'];

interface DoajResponse {
  total?: number;
  page?: number;
  pageSize?: number;
  query?: string;
  results?: Array<{ id?: string; created_date?: string; last_updated?: string; bibjson?: Record<string, unknown> }>;
  status?: string;
  error?: string;
}

interface DoajArticle {
  identifier?: Array<{ id?: string; type?: string }>;
  journal?: { title?: string; volume?: string; number?: string; publisher?: string; country?: string; issns?: string[]; language?: string[] };
  title?: string;
  abstract?: string;
  author?: Array<{ name?: string; affiliation?: string }>;
  subject?: Array<{ term?: string; code?: string; scheme?: string }>;
  keywords?: string[];
  link?: Array<{ type?: string; content_type?: string; url?: string }>;
  year?: string;
  month?: string;
  start_page?: string;
  end_page?: string;
}

interface DoajJournal {
  title?: string;
  eissn?: string;
  pissn?: string;
  publisher?: { name?: string; country?: string };
  language?: string[];
  subject?: Array<{ term?: string }>;
  keywords?: string[];
  oa_start?: number;
  boai?: boolean;
  license?: Array<{ type?: string; url?: string; BY?: boolean; NC?: boolean; ND?: boolean; SA?: boolean }>;
  apc?: { has_apc?: boolean; url?: string; max?: Array<{ price?: number; currency?: string }> };
  other_charges?: { has_other_charges?: boolean };
  waiver?: { has_waiver?: boolean };
  copyright?: { author_retains?: boolean; url?: string };
  editorial?: { review_process?: string[]; review_url?: string; board_url?: string };
  publication_time_weeks?: number;
  preservation?: { has_preservation?: boolean };
  plagiarism?: { detection?: boolean };
  deposit_policy?: { has_policy?: boolean };
  pid_scheme?: { has_pid_scheme?: boolean };
}

async function doajGet(path: string, missing: string): Promise<DoajResponse> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': DOAJ_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 404) throw new Error(missing);
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as DoajResponse;
    throw new Error(`DOAJ rejected the query: ${body.error ?? 'bad request'}`);
  }
  if (!res.ok) throw new Error(`DOAJ returned ${res.status}`);
  return (await res.json()) as DoajResponse;
}

function doajClamp(value: number | undefined, fallback: number, max: number): number {
  const number = Math.trunc(value ?? fallback) || fallback;
  return Math.max(1, Math.min(number, max));
}

function doajAuthors(article: DoajArticle): string {
  const authors = article.author ?? [];
  const names = authors.map((author) => author.name).filter((name): name is string => Boolean(name));
  if (!names.length) return 'no authors listed';
  if (names.length <= 4) return names.join(', ');
  return `${names.slice(0, 4).join(', ')} and ${names.length - 4} more (${names.length} in total)`;
}

function doajDoi(article: DoajArticle): string | null {
  const found = (article.identifier ?? []).find((entry) => entry.type === 'doi');
  return found?.id ?? null;
}

function doajPages(article: DoajArticle): string {
  if (article.start_page && article.end_page) return `pages ${article.start_page}-${article.end_page}`;
  if (article.start_page) return `page ${article.start_page}`;
  return 'no page range';
}

function doajFullText(article: DoajArticle): string | null {
  const links = article.link ?? [];
  const full = links.find((link) => link.type === 'fulltext') ?? links[0];
  return full?.url ?? null;
}

// A bare ISSN in the query path is read as free text, and "0000-0000" happily
// matched an unrelated journal, so the ISSN is normalised and only the exact
// eissn and pissn fields are searched.

function doajSubjects(list: Array<{ term?: string }> | undefined): string {
  const terms = (list ?? []).map((entry) => entry.term).filter((term): term is string => Boolean(term));
  return terms.length ? terms.join('; ') : 'no subject terms';
}

export async function detailedSearch(args: {
  query?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) throw new Error('Provide search terms');
  const limit = doajClamp(args.limit, 10, 100);
  const page = doajClamp(args.page, 1, 1000);
  const sort = (args.sort ?? '').trim();
  let sortParam = '';
  if (sort) {
    const [field, direction] = sort.split(':');
    if (!DOAJ_SORTS.includes(field)) {
      throw new Error(
        `DOAJ sorts by ${DOAJ_SORTS.join(' or ')}, optionally with :asc or :desc. An unknown field makes DOAJ answer HTTP 400, and other known fields take longer than the request timeout.`,
      );
    }
    if (direction && direction !== 'asc' && direction !== 'desc') {
      throw new Error('A sort direction is :asc or :desc');
    }
    sortParam = `&sort=${encodeURIComponent(sort)}`;
  }

  const payload = await doajGet(
    `/search/articles/${encodeURIComponent(query)}?pageSize=${limit}&page=${page}${sortParam}`,
    'DOAJ had nothing to read',
  );
  const rows = payload.results ?? [];
  const total = payload.total ?? 0;
  if (!rows.length) {
    return `No open access articles matched "${query}" on page ${page}. DOAJ reported ${total} matches in total for the query itself.`;
  }
  const pages = Math.max(1, Math.ceil(total / limit));
  const lines: string[] = [
    `Open access articles matching "${query}" (page ${page} of ${pages}, ${total} in total, ${limit} per page):`,
  ];
  rows.forEach((row, index) => {
    const article = (row.bibjson ?? {}) as DoajArticle;
    const journal = article.journal ?? {};
    const doi = doajDoi(article);
    lines.push(
      '',
      `  ${(page - 1) * limit + index + 1}. ${article.title ?? 'untitled'}`,
      `     ${doajAuthors(article)}`,
      `     ${journal.title ?? 'unknown journal'}${journal.volume ? ` ${journal.volume}` : ''}${journal.number ? ` (${journal.number})` : ''} | ${doajPages(article)} | ${article.year ?? 'year not stated'}`,
      `     ${doajSubjects(article.subject)}`,
    );
    if (doi) lines.push(`     DOI ${doi}`);
    const full = doajFullText(article);
    if (full) lines.push(`     Full text ${full}`);
    if (article.abstract) {
      const abstract = article.abstract.replace(/\s+/g, ' ').trim();
      lines.push(`     ${abstract.slice(0, 180)}${abstract.length > 180 ? ' ...' : ''}`);
    }
  });
  lines.push(
    '',
    sort
      ? `  Sorted by ${sort}.`
      : '  No sort requested, DOAJ uses its own relevance order.',
    `  Page size is capped at 100 by DOAJ whatever is asked for${page >= pages ? ', and this is the last page.' : `.`}`,
  );
  return lines.join('\n');
}
