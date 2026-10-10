/**
 * Dwarf Fortress wiki client (dwarffortresswiki.org). MediaWiki API,
 * keyless. Contains the lore, !!FUN!!, adamantine, and magma knowledge.
 */
const BASE = "https://dwarffortresswiki.org/api.php"

export class DfError extends Error {}

export interface WikiPage {
  pageid: number
  title: string
  snippet?: string
}

async function getJson<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ format: "json", ...params })
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: { "User-Agent": "dwarffortress-mcp/1.0 (research)" },
  })
  if (!res.ok) throw new DfError(`DF wiki error ${res.status}`)
  return (await res.json()) as T
}

export async function searchPages(query: string, limit = 8): Promise<WikiPage[]> {
  const d = await getJson<{ query?: { search?: any[] } }>({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
    srprop: "snippet",
  })
  return (d.query?.search ?? []).map((s) => ({
    pageid: s.pageid,
    title: s.title,
    snippet: (s.snippet ?? "").replace(/<[^>]+>/g, ""),
  }))
}

export async function getPage(title: string, maxChars = 15000): Promise<{
  title: string
  wikitext: string
  url: string
} | null> {
  const d = await getJson<{ parse?: { title?: string; wikitext?: any } }>({
    action: "parse",
    page: title,
    prop: "wikitext",
    formatversion: "2",
  })
  const p = d.parse
  if (!p) return null
  const wt = typeof p.wikitext === "string" ? p.wikitext : (p.wikitext?.["*"] ?? "")
  return {
    title: p.title ?? title,
    wikitext: wt.slice(0, maxChars),
    url: `https://dwarffortresswiki.org/index.php/${encodeURIComponent(p.title ?? title).replace(/%2F/g, "/")}`,
  }
}

export function wikiTextToPlain(wt: string, maxChars = 12000): string {
  return wt
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''/g, "")
    .replace(/''/g, "")
    .replace(/\{\|[\s\S]*?\|\}/g, "[table]")
    .replace(/={2,}([^=]+)={2,}/g, "\n$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxChars)
}

// ---- muxA tools:

const DF = "https://dwarffortresswiki.org/api.php";

function cap(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

const strip = (s: unknown): string => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function dfGet(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ format: "json", ...params });
  const res = await fetch(`${DF}?${qs.toString()}`, {
    headers: { "User-Agent": "dwarffortress-mcp/1.0 (research)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new DfError(`DF wiki error ${res.status}`);
  return (await res.json()) as any;
}

export interface DfDetailsArgs {
  title: string;
}

export interface DfCategoryArgs {
  category: string;
  limit?: number;
}

export interface DfLinksArgs {
  title: string;
  limit?: number;
  search?: string;
}

export async function pageLinks(args: DfLinksArgs): Promise<string> {
  const title = (args.title ?? "").trim();
  if (!title) throw new DfError("Provide a page title, e.g. Dwarf.");
  const limit = cap(args.limit, 40, 200);
  const d = await dfGet({ action: "query", prop: "links", titles: title, pllimit: String(limit) });
  const pages = (d?.query?.pages ?? {}) as Record<string, any>;
  const page = Object.values(pages)[0] as Record<string, any> | undefined;
  if (!page || page.missing !== undefined) return `The Dwarf Fortress wiki has no page titled "${title}".`;
  const links = (page.links ?? []) as Array<{ title?: string; ns?: number }>;
  if (!links.length) return `${String(page.title)} links to no other wiki pages.`;
  const q = (args.search ?? "").trim().toLowerCase();
  const rows = q ? links.filter((l) => String(l.title).toLowerCase().includes(q)) : links;
  return [
    `Pages linked from ${String(page.title ?? title)}: ${links.length}${d?.continue ? " returned, more pages exist" : ""}${q ? `, ${rows.length} match "${q}"` : ""}.`,
    ...rows.slice(0, limit).map((l, i) => `${i + 1}. ${String(l.title ?? "?").replace(/^Category:/, "Category:")} (namespace ${l.ns ?? "?"})`),
  ].join("\n");
}
