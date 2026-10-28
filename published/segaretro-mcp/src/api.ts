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
