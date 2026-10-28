/**
 * Doom Wiki client. The definitive Doom wiki (doomwiki.org), a MediaWiki
 * install since 2005. Keyless, plain MediaWiki API with formatversion 2.
 */
const API = "https://doomwiki.org/w/api.php"

export class DoomWikiError extends Error {}

export interface PageHit {
  title: string
  pageid?: number
}

async function apiGet(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ format: "json", ...params }).toString()
  const res = await fetch(`${API}?${qs}`, {
    headers: { "User-Agent": "doomwiki-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new DoomWikiError(`Doom Wiki error ${res.status}`)
  return res.json()
}

export async function searchPages(query: string, limit = 8): Promise<PageHit[]> {
  const d = await apiGet({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
    srnamespace: "0",
  })
  return (d?.query?.search ?? []).map((s: any) => ({ title: s.title, pageid: s.pageid }))
}

export async function getPage(title: string): Promise<string> {
  const d = await apiGet({
    action: "parse",
    page: title,
    prop: "wikitext",
    formatversion: "2",
  })
  const wt: string = d?.parse?.wikitext ?? ""
  if (!wt) throw new DoomWikiError(`No page content for "${title}". It may be a redirect or missing.`)
  return wt
}

export async function categoryMembers(category: string, limit = 20): Promise<PageHit[]> {
  const d = await apiGet({
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
    cmnamespace: "0",
    cmlimit: String(limit),
  })
  return (d?.query?.categorymembers ?? []).map((s: any) => ({ title: s.title, pageid: s.pageid }))
}

/** Strip templates, links, refs from raw wikitext so it reads like prose. */
export function cleanWikiText(wt: string, maxChars = 4000): string {
  let s = wt
  s = s.replace(/\{\{[^{}]*\}\}/g, " ")
  s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
  s = s.replace(/'''?/g, "")
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, " ")
  s = s.replace(/<[^>]+>/g, " ")
  s = s.replace(/\n{3,}/g, "\n\n")
  s = s.replace(/[ \t]+\n/g, "\n")
  return s.trim().slice(0, maxChars)
}
