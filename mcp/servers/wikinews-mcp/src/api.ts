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

export async function article(args: ArticleArgs): Promise<string> {
  const title = (args.title ?? '').trim();
  if (!title) return 'Provide an exact Wikinews article title.';
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts',
    explaintext: '1',
    titles: title,
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikinews-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikinews returned ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: Record<string, { title?: string; extract?: string; missing?: unknown }> } };
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) return `No Wikinews article titled "${title}".`;
  const body = (page.extract ?? '').trim();
  if (!body) return `Wikinews has no plain text extract for "${title}".`;
  const cut = body.length > 1800 ? body.slice(0, 1800) + '...' : body;
  return `${page.title ?? title}\n\n${cut}`;
}

export interface BrowseCategoriesArgs {
  prefix?: string;
  limit?: number;
}

export async function browseCategories(args: BrowseCategoriesArgs): Promise<string> {
  const prefix = (args.prefix ?? '').trim();
  const limit = Math.max(1, Math.min(args.limit ?? 20, 50));
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'allcategories',
    acprefix: prefix,
    aclimit: String(limit),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikinews-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikinews returned ${res.status}`);
  const data = (await res.json()) as { query?: { allcategories?: Array<{ '*'?: string; subcats?: string }> } };
  const rows = data.query?.allcategories ?? [];
  if (!rows.length) return `No Wikinews categories start with "${prefix}".`;
  return `Wikinews categories starting with "${prefix}" (${rows.length} shown):\n` +
    rows.map((c, i) => `${i + 1}. ${c['*'] ?? '?'}${c.subcats ? '' : ' (no subcategories)'}`).join('\n');
}
