/**
 * hiddenpalace.org client — the Video Game History Foundation wiki of
 * unreleased prototypes, beta content, and cut levels.
 * It's a MediaWiki; we use action=query (search) + action=parse
 * (page wikitext) with the standard MediaWiki API.
 */
const BASE = "https://hiddenpalace.org/w/api.php"

export class WikiError extends Error {}

export interface WikiPage {
  pageid: number
  title: string
  snippet?: string
}

async function getJson<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ format: "json", ...params })
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: { "User-Agent": "hiddenpalace-mcp/1.0 (research)" },
  })
  if (!res.ok) throw new WikiError(`hiddenpalace wiki error ${res.status}`)
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
  // With formatversion=2, wikitext comes back as a plain string.
  const wt = typeof p.wikitext === "string" ? p.wikitext : (p.wikitext?.["*"] ?? "")
  return {
    title: p.title ?? title,
    wikitext: wt.slice(0, maxChars),
    url: `https://hiddenpalace.org/w/${encodeURIComponent(p.title ?? title).replace(/%2F/g, "/")}`,
  }
}

/** Crude wikitext → readable text (links, bold, tables, refs). */
export function wikiTextToPlain(wt: string, maxChars = 12000): string {
  return wt
    .replace(/\{\{[^}]*\}\}/g, "") // templates
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

export interface RecentChangesArgs {
  limit?: number;
}

export interface PageInfoArgs {
  title: string;
}

export interface ListCategoriesArgs {
  limit?: number;
}

export async function listCategories(args: ListCategoriesArgs): Promise<string> {
  const limit = Math.max(1, Math.min(Number(args?.limit ?? 40) || 40, 200))
  const d = await getJson<{ query?: { allcategories?: Array<{ "*": string }> } }>({
    action: "query",
    list: "allcategories",
    aclimit: String(limit),
  })
  const rows = (d.query?.allcategories ?? []).map((c) => String(c["*"] ?? "").trim()).filter(Boolean)
  if (!rows.length) return "hiddenpalace.org reported no categories."
  return `hiddenpalace.org categories (${rows.length} shown, alphabetical from the start of the list):\n` +
    rows.map((name, i) => `${i + 1}. ${name}`).join("\n")
}

// ---- gap4b1 tools:

