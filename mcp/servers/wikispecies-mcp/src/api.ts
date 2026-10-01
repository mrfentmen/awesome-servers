const BASE = 'https://species.wikimedia.org/w/api.php';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a species name.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: q,
    srlimit: String(limit),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikispecies-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikispecies returned ${res.status}`);
  const data = (await res.json()) as { query?: { search?: Array<{ title?: string; snippet?: string }> } };
  const rows = data.query?.search ?? [];
  if (!rows.length) return `No species found for "${q}".`;
  return `Wikispecies matches for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${r.title ?? ''}\n   ${(r.snippet ?? '').replace(/<[^>]*>/g, '')}`)
      .join('\n');
}

// ---- muxB tools:
const UA = 'mrfentmen-wikispecies-mcp/1.0';

async function wiki(params: URLSearchParams): Promise<string> {
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikispecies returned ${res.status}`);
  return res.text();
}

export interface PageArgs {
  title: string;
  chars?: number;
}

export interface CategoriesArgs {
  title: string;
  limit?: number;
}

export async function pageCategories(args: CategoriesArgs): Promise<string> {
  const title = (args.title ?? '').trim();
  if (!title) return 'Provide a species page title, e.g. Vulpes vulpes.';
  const limit = Math.max(1, Math.min(Number(args.limit ?? 20) || 20, 50));
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'categories',
    redirects: '1',
    cllimit: String(limit),
    titles: title,
  });
  const data = JSON.parse(await wiki(params)) as {
    query?: { pages?: Record<string, { title?: string; missing?: string; categories?: Array<{ title?: string }> }> };
  };
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page) return `Wikispecies has no page for "${title}".`;
  if (page.missing !== undefined) return `Wikispecies has no page for "${title}".`;
  const rows = page.categories ?? [];
  if (!rows.length) return `Wikispecies page "${page.title ?? title}" is in no categories.`;
  return `Wikispecies categories for "${page.title ?? title}" (${rows.length} shown):\n` +
    rows.slice(0, limit).map((c, i) => `${i + 1}. ${(c.title ?? '').replace(/^Category:/, '')}`).join('\n');
}

// ---- gap4a4 tools:

async function gapQuery(params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams({action: 'query', format: 'json', ...params});
  const res = await fetch(`https://species.wikimedia.org/w/api.php?${query}`, {
    headers: {'User-Agent': 'mrfentmen-wikispecies-mcp/1.0', Accept: 'application/json'},
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

