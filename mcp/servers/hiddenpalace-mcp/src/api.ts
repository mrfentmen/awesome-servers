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

export async function recentChanges(args: RecentChangesArgs): Promise<string> {
  const limit = Math.max(1, Math.min(Number(args?.limit ?? 15) || 15, 50))
  const d = await getJson<{ query?: { recentchanges?: any[] } }>({
    action: "query",
    list: "recentchanges",
    rclimit: String(limit),
    rctype: "edit|new",
    rcprop: "user|title|timestamp|size|comment",
  })
  const rows = d.query?.recentchanges ?? []
  if (!rows.length) return "No recent changes on hiddenpalace.org."
  return `Recent changes on hiddenpalace.org (${rows.length} shown):\n` +
    rows.map((c: any, i: number) => {
      const who = c.user ?? "not reported"
      const when = String(c.timestamp ?? "").replace("T", " ").replace("Z", " UTC")
      const size = c.size != null ? ` | size ${c.size} bytes` : ""
      return `${i + 1}. ${c.type ?? "change"} of "${c.title ?? "page not reported"}" by ${who} at ${when || "time not reported"}${size}`
    }).join("\n")
}

export interface PageInfoArgs {
  title: string;
}

export async function pageInfo(args: PageInfoArgs): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new WikiError("Provide a page title")
  const d = await getJson<{ query?: { pages?: any[] } }>({
    action: "query",
    prop: "info|revisions",
    titles: title,
    rvprop: "timestamp|user|size",
    rvlimit: "1",
    inprop: "url",
    formatversion: "2",
  })
  const page = (d.query?.pages ?? [])[0]
  if (!page || page.missing !== undefined) return `No hiddenpalace page "${title}".`
  const rev = Array.isArray(page.revisions) ? page.revisions[0] : undefined
  return [
    `${page.title ?? title}`,
    `URL: ${page.canonicalurl ?? page.fullurl ?? "not reported"}`,
    `Page id: ${page.pageid ?? "not reported"} | namespace: ${page.ns ?? "not reported"}`,
    `Length: ${page.length != null ? `${page.length} bytes` : "not reported"}`,
    `Last touched: ${String(page.touched ?? "not reported").replace("T", " ").replace("Z", " UTC")}`,
    `Last edit by: ${rev?.user ?? "not reported"} at ${String(rev?.timestamp ?? "not reported").replace("T", " ").replace("Z", " UTC")}`,
  ].join("\n")
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
