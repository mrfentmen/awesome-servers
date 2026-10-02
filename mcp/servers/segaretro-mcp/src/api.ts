/**
 * Sega Retro client — the wiki covering every Sega game, console, and
 * unreleased hardware. Standard MediaWiki API.
 */
const BASE = "https://segaretro.org/api.php"

export class SegaError extends Error {}

export interface WikiPage {
  pageid: number
  title: string
  snippet?: string
}

async function getJson<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ format: "json", ...params })
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: { "User-Agent": "segaretro-mcp/1.0 (research)" },
  })
  if (!res.ok) throw new SegaError(`Sega Retro error ${res.status}`)
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
    url: `https://segaretro.org/${encodeURIComponent(p.title ?? title).replace(/%2F/g, "/")}`,
  }
}

export async function categoryMembers(category: string, limit = 20): Promise<string[]> {
  const d = await getJson<{ query?: { categorymembers?: any[] } }>({
    action: "query",
    list: "categorymembers",
    cmtitle: category,
    cmlimit: String(limit),
  })
  return (d.query?.categorymembers ?? []).map((m) => m.title ?? "?")
}

export function wikiTextToPlain(wt: string, maxChars = 12000): string {
  return wt
    .replace(/\{\{[^}]*\}\}/g, "")
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
    rcprop: "user|title|timestamp|comment",
    rctype: "edit|new",
  })
  const rows = d.query?.recentchanges ?? []
  if (!rows.length) return "Sega Retro reported no recent changes."
  return `Recent changes on Sega Retro (${rows.length} shown, newest first):\n` +
    rows.map((c: any, i: number) => {
      const when = String(c?.timestamp ?? "").replace("T", " ").replace("Z", " UTC")
      const comment = String(c?.comment ?? "").replace(/\s+/g, " ").trim()
      return `${i + 1}. ${c?.type ?? "change"} of "${c?.title ?? "page not reported"}" by ${c?.user ?? "user not reported"} at ${when || "time not reported"}${comment ? `\n   ${comment.slice(0, 180)}` : ""}`
    }).join("\n")
}

export interface PageMetadataArgs {
  title: string;
  categoryLimit?: number;
}

export async function pageMetadata(args: PageMetadataArgs): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new SegaError("Provide an exact page title from search_pages")
  const catLimit = Math.max(1, Math.min(Number(args.categoryLimit ?? 20) || 20, 60))
  const d = await getJson<{ query?: { pages?: any[] } }>({
    action: "query",
    prop: "info|revisions|categories",
    titles: title,
    rvprop: "timestamp|user|size",
    rvlimit: "1",
    cllimit: String(catLimit),
    inprop: "url",
    formatversion: "2",
  })
  const page = (d.query?.pages ?? [])[0]
  if (!page || page.missing !== undefined) return `No Sega Retro page "${title}".`
  const rev = Array.isArray(page.revisions) ? page.revisions[0] : undefined
  const cats = (Array.isArray(page.categories) ? page.categories : [])
    .map((c: any) => String(c?.title ?? "").replace(/^Category:/, ""))
    .filter(Boolean)
  return [
    `${page.title ?? title}`,
    `URL: ${page.canonicalurl ?? page.fullurl ?? "not reported"}`,
    `Page id: ${page.pageid ?? "not reported"} | namespace: ${page.ns ?? "not reported"} | length: ${page.length != null ? `${page.length} bytes` : "not reported"}`,
    `Last touched: ${String(page.touched ?? "not reported").replace("T", " ").replace("Z", " UTC")}`,
    `Last edit by: ${rev?.user ?? "not reported"} at ${String(rev?.timestamp ?? "not reported").replace("T", " ").replace("Z", " UTC")}`,
    `Categories (${cats.length} shown):`,
    ...(cats.length ? cats.slice(0, catLimit).map((c: string, i: number) => `   ${i + 1}. ${c}`) : ["   none reported"]),
  ].join("\n")
}
