/**
 * Tetris wiki client (tetris.wiki). MediaWiki API, keyless.
 * Covers every Tetris game, the tetrominoes, and techniques like T-spins,
 * SRS, and hard drop.
 */
const BASE = "https://tetris.wiki/api.php"

export class TetrisError extends Error {}

export interface WikiPage {
  pageid: number
  title: string
  snippet?: string
}

async function getJson<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ format: "json", ...params })
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: { "User-Agent": "tetriswiki-mcp/1.0 (research)" },
  })
  if (!res.ok) throw new TetrisError(`Tetris wiki error ${res.status}`)
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
    url: `https://tetris.wiki/${encodeURIComponent(p.title ?? title).replace(/%2F/g, "/")}`,
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

// ---- muxB tools:

interface TwQueryPage {
  pageid?: number
  title?: string
  revisions?: Array<{ revid?: number; timestamp?: string; user?: string; comment?: string; size?: number; minor?: string }>
  categories?: Array<{ title?: string }>
  links?: Array<{ title?: string }>
  missing?: string
}

interface TwQuery {
  query?: {
    pages?: Record<string, TwQueryPage>
    categorymembers?: Array<{ pageid?: number; title?: string; ns?: number }>
    allpages?: Array<{ pageid?: number; title?: string }>
  }
  categorymembers?: Array<{ pageid?: number; title?: string; ns?: number }>
  allpages?: Array<{ pageid?: number; title?: string }>
  searchinfo?: { totalhits?: number }
  error?: { info?: string; code?: string }
}

interface TwApi {
  pages: Record<string, TwQueryPage>
  categorymembers: Array<{ pageid?: number; title?: string; ns?: number }>
}

export interface PageHistoryArgs {
  title: string;
  limit?: number;
}

export interface BrowseCategoryArgs {
  category: string;
  limit?: number;
}

// ---- gap3a tools:

export interface RecentChangesArgs {
  limit?: number;
}

export interface OutlinksArgs {
  title: string;
  limit?: number;
}

interface RecentChange {
  type?: string;
  ns?: number;
  title?: string;
  pageid?: number;
  revid?: number;
  user?: string;
  timestamp?: string;
  comment?: string;
}

// twQuery keeps pages and category members, so the templates a page uses are
// read through a wider view of the same row rather than by changing the shape
// the other tools already read.
type LinkedPage = TwQueryPage & { templates?: Array<{ title?: string }> };

