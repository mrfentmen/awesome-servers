const BASE = 'https://en.wikivoyage.org/w/api.php';

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
    headers: { 'User-Agent': 'mrfentmen-wikivoyage-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikivoyage returned ${res.status}`);
  const data = (await res.json()) as { query?: { search?: Array<{ title?: string; snippet?: string }> } };
  const rows = data.query?.search ?? [];
  if (!rows.length) return `No Wikivoyage guides found for "${q}".`;
  return `Wikivoyage guides for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${r.title ?? ''}\n   ${(r.snippet ?? '').replace(/<[^>]*>/g, '')}`)
      .join('\n');
}

// ---- muxC tools:

const WIKI_UA = "mrfentmen-wikivoyage-mcp/1.0"

async function wikiGet<T>(params: Record<string, string>): Promise<T> {
  const search = new URLSearchParams({ format: "json", ...params })
  const res = await fetch(`${BASE}?${search.toString()}`, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Wikivoyage returned ${res.status}`)
  return (await res.json()) as T
}

/** The table of contents of a guide, with per-section line numbers. */
export async function guideSections(args: { title?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new Error("Provide a page title, e.g. Tokyo or Lisbon")
  const d = await wikiGet<{ parse?: { title?: string; sections?: Array<{ line?: string; anchor?: string; level?: string }> }; error?: { info?: string } }>(
    { action: "parse", page: title, prop: "sections", redirects: "1" },
  )
  if (d.error) return `Wikivoyage has no page titled "${title}" (${d.error.info ?? "not found"}).`
  const sections = d.parse?.sections ?? []
  if (!sections.length) return `"${d.parse?.title ?? title}" has no sections.`
  const body = sections.filter((s) => (s.level ?? "") !== "0")
  return `Sections of ${d.parse?.title ?? title} (${body.length}):\n` +
    body.map((s) => `  ${"  ".repeat(Math.max(0, Number(s.level ?? 1) - 1))}# ${(s.line ?? "").trim()}`).join("\n")
}

// ---- gap4a4 tools:

async function gapQuery(params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams({action: 'query', format: 'json', ...params});
  const res = await fetch(`https://en.wikivoyage.org/w/api.php?${query}`, {
    headers: {'User-Agent': 'mrfentmen-wikivoyage-mcp/1.0', Accept: 'application/json'},
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wiki API returned ${res.status}`);
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error.info ?? 'Wiki API error');
  return data;
}

export async function pageBacklinks(args: { title: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 30));
  const title = args.title.trim();
  if (!title) throw new Error('Provide a page title.');
  const data = await gapQuery({list: 'backlinks', bltitle: title, bllimit: String(limit)});
  const rows = data.query?.backlinks ?? [];
  return rows.length ? rows.slice(0, limit).map((r: any, i: number) => `${i + 1}. ${String(r.title ?? 'not reported').slice(0, 250)} | page ${r.pageid ?? 'not reported'} | namespace ${r.ns ?? 'not reported'}`).join('\n') : 'No backlinks returned.';
}
