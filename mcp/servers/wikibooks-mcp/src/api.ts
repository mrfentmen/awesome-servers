const BASE = 'https://en.wikibooks.org/w/api.php';

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
    headers: { 'User-Agent': 'mrfentmen-wikibooks-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikibooks returned ${res.status}`);
  const data = (await res.json()) as { query?: { search?: Array<{ title?: string; snippet?: string }> } };
  const rows = data.query?.search ?? [];
  if (!rows.length) return `No Wikibooks titles found for "${q}".`;
  return `Wikibooks titles for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${r.title ?? ''}\n   ${(r.snippet ?? '').replace(/<[^>]*>/g, '')}`)
      .join('\n');
}

// ---- muxB tools:

export interface BookArgs {
  title: string;
}

export interface BrowseCategoriesArgs {
  prefix?: string;
  limit?: number;
}

// ---- gap4d3 tools:

async function wikibooksQuery<T>(params: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE}?${new URLSearchParams({ format: 'json', ...params })}`, {
    headers: { 'User-Agent': 'mrfentmen-wikibooks-mcp/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Wikibooks returned ${res.status}`)
  const data = await res.json() as T & { error?: { info?: string } }
  if (data.error) throw new Error(data.error.info ?? 'Wikibooks API error')
  return data
}

export async function pageSections(args: { title: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 20), 50))
  const title = args.title.trim()
  if (!title) throw new Error('Provide a page title.')
  const d = await wikibooksQuery<{ parse?: { tocdata?: { sections?: Array<{ number?: string; line?: string; anchor?: string }> } } }>({ action: 'parse', page: title, prop: 'tocdata' })
  const rows = (d.parse?.tocdata?.sections ?? []).slice(0, limit)
  return `Sections: ${title.slice(0, 160)}\n` + (rows.map(r => `${r.number ?? 'not reported'}. ${(r.line ?? 'not reported').replace(/<[^>]*>/g, '').slice(0, 160)} | #${(r.anchor ?? 'not reported').slice(0, 180)}`).join('\n') || 'No sections reported.')
}

