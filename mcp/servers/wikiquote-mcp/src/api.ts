const BASE = "https://en.wikiquote.org/w/api.php"
const UA = "mrfentmen-wikiquote-mcp/1.0 (https://github.com/mrfentmen)"
export class WikiquoteError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new WikiquoteError("Wikiquote rate limit hit, wait and retry")
  if (!res.ok) throw new WikiquoteError(`Wikiquote error ${res.status}`)
  return (await res.json()) as T
}

export async function searchQuotes(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new WikiquoteError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${limit}&format=json&origin=*`)
  const hits = d?.query?.search ?? []
  if (!hits.length) return "No pages found"
  return hits.map((h: any, i: number) => `${i + 1}. ${h.title}`).join("\n")
}

export async function pageQuotes(args: { page?: string; limit?: number }): Promise<string> {
  const page = (args.page ?? "").trim()
  if (!page) throw new WikiquoteError("Provide a page title")
  const limit = Math.min(args.limit ?? 8, 15)
  const d = await get<any>(`${BASE}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&origin=*`)
  const text = d?.parse?.wikitext?.["*"] ?? ""
  if (!text) return "Page not found"
  const lines = text.split("\n")
    .filter((l: string) => l.startsWith("*") || l.startsWith("#"))
    .map((l: string) => l.replace(/^[*#]+\s*/, "").replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/'''|''/g, "").trim())
    .filter((l: string) => l.length > 3 && !l.startsWith("="))
    .slice(0, limit)
  if (!lines.length) return "No quotes on this page"
  return `Quotes from ${page}:\n\n${lines.map((l: string, i: number) => `${i + 1}. ${l}`).join("\n\n")}`
}

// ---- muxB tools:

// ---- gap4a4 tools:

async function gapQuery(params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams({action: 'query', format: 'json', ...params});
  const res = await fetch(`https://en.wikiquote.org/w/api.php?${query}`, {
    headers: {'User-Agent': 'mrfentmen-wikiquote-mcp/1.0', Accept: 'application/json'},
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
