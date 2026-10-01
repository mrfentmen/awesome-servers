const BASE = 'https://dblp.org/search/publ/api';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface AuthorArgs {
  name: string;
  limit?: number;
}

interface DblpHit {
  info?: {
    title?: string;
    authors?: { author?: Array<{ text?: string } | string> };
    venue?: string;
    year?: string | number;
    doi?: string;
    url?: string;
  };
}

function authorText(a: Array<{ text?: string } | string> | undefined): string {
  if (!Array.isArray(a)) return '';
  return a
    .map((x) => (typeof x === 'string' ? x : x.text ?? ''))
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
}

function formatHits(hits: DblpHit[]): string {
  if (!hits.length) return '';
  return hits
    .map((h, i) => {
      const info = h.info ?? {};
      return `${i + 1}. ${info.title ?? 'untitled'}\n   ${authorText(info.authors?.author)} | ${info.venue ?? ''} (${info.year ?? ''})${info.doi ? ` | doi:${info.doi}` : ''}`;
    })
    .join('\n');
}

async function queryDblp(params: string): Promise<DblpHit[]> {
  const res = await fetch(`${BASE}?format=json&h=30&${params}`, {
    headers: { 'User-Agent': 'mrfentmen-dblp-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DBLP returned ${res.status}`);
  const data = (await res.json()) as {
    result?: { hits?: { hit?: DblpHit[] } };
  };
  return data.result?.hits?.hit ?? [];
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const hits = (await queryDblp(`q=${encodeURIComponent(q)}`)).slice(0, limit);
  if (!hits.length) return `No DBLP publications found for "${q}".`;
  return `DBLP results for "${q}" (${hits.length} shown):\n` + formatHits(hits);
}

export async function author(args: AuthorArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide an author name.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const hits = (await queryDblp(`q=author:${encodeURIComponent(name)}`)).slice(0, limit);
  if (!hits.length) return `No DBLP publications found for author "${name}".`;
  return `DBLP publications by ${name} (${hits.length} shown):\n` + formatHits(hits);
}
