const BASE = 'https://en.wikinews.org/w/api.php';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: q,
    srlimit: String(limit),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikinews-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikinews returned ${res.status}`);
  const data = (await res.json()) as { query?: { search?: Array<{ title?: string; snippet?: string; timestamp?: string }> } };
  const rows = data.query?.search ?? [];
  if (!rows.length) return `No Wikinews articles found for "${q}".`;
  return `Wikinews articles for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${r.title ?? ''}${r.timestamp ? ` | ${String(r.timestamp).slice(0, 10)}` : ''}\n   ${(r.snippet ?? '').replace(/<[^>]*>/g, '')}`)
      .join('\n');
}

// ---- muxB tools:

export interface ArticleArgs {
  title: string;
}

export interface BrowseCategoriesArgs {
  prefix?: string;
  limit?: number;
}

// ---- gap4a4 tools:

async function gapQuery(params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams({action: 'query', format: 'json', ...params});
  const res = await fetch(`https://en.wikinews.org/w/api.php?${query}`, {
    headers: {'User-Agent': 'mrfentmen-wikinews-mcp/1.0', Accept: 'application/json'},
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wiki API returned ${res.status}`);
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error.info ?? 'Wiki API error');
  return data;
}

export async function pageHistory(args: { title: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 30));
  const title = args.title.trim();
  if (!title) throw new Error('Provide a page title.');
  const data = await gapQuery({prop: 'revisions', titles: title, rvprop: 'ids|timestamp|user|comment', rvlimit: String(limit)});
  const page: any = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) return 'Page not found.';
  const rows = page.revisions ?? [];
  return rows.length ? `${page.title}\n` + rows.slice(0, limit).map((r: any) => `${r.revid ?? 'not reported'} | ${r.timestamp ?? 'not reported'} | ${r.user ?? 'not reported'} | ${String(r.comment ?? 'not reported').slice(0, 300)}`).join('\n') : 'No revisions returned.';
}

export async function pageBacklinks(args: { title: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 30));
  const title = args.title.trim();
  if (!title) throw new Error('Provide a page title.');
  const data = await gapQuery({list: 'backlinks', bltitle: title, bllimit: String(limit)});
  const rows = data.query?.backlinks ?? [];
  return rows.length ? rows.slice(0, limit).map((r: any, i: number) => `${i + 1}. ${String(r.title ?? 'not reported').slice(0, 250)} | page ${r.pageid ?? 'not reported'} | namespace ${r.ns ?? 'not reported'}`).join('\n') : 'No backlinks returned.';
}
