/**
 * Lost Media Wiki (MediaWiki API) client, keyless.
 * Uses TextExtracts for clean article intros plus page URLs.
 */
const API = "https://lostmediawiki.com/w/api.php"

export class LostMediaError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function api(params: Record<string, string>): Promise<Raw> {
  const qs = new URLSearchParams({ format: "json", ...params }).toString()
  const res = await fetch(`${API}?${qs}`, {
    headers: { "User-Agent": "lostmedia-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new LostMediaError(`Lost Media Wiki error ${res.status}`)
  return (await res.json()) as Raw
}

export interface SearchHit {
  title: string
  snippet: string
}

const stripTags = (s: string): string => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

export async function searchArticles(query: string, limit = 5): Promise<SearchHit[]> {
  const data = await api({ action: "query", list: "search", srsearch: query, srlimit: String(limit) })
  const hits: Raw[] = data?.query?.search ?? []
  return hits.map((h) => ({ title: String(h.title), snippet: stripTags(String(h.snippet ?? "")) }))
}

export interface Article {
  title: string
  url?: string
  extract: string
}

export async function getArticle(title: string): Promise<Article | null> {
  const data = await api({
    action: "query",
    prop: "extracts|info",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
    titles: title,
  })
  const pages: Raw = data?.query?.pages ?? {}
  const page: Raw | undefined = Object.values(pages)[0] as Raw | undefined
  if (!page || page.missing !== undefined) return null
  return {
    title: String(page.title ?? title),
    url: page.fullurl,
    extract: String(page.extract ?? "").trim() || "(no summary on this page)",
  }
}

export async function randomArticle(): Promise<{ title: string }> {
  const data = await api({ action: "query", list: "random", rnnamespace: "0", rnlimit: "1" })
  const hit = data?.query?.random?.[0]
  if (!hit) throw new LostMediaError("Could not pick a random article")
  return { title: String(hit.title) }
}

export function statusOf(title: string, extract: string): string {
  const t = `${title} ${extract}`.toLowerCase()
  if (/partially found|partially lost/.test(t)) return "Partially found"
  if (/\bfound\b/.test(t)) return "Found"
  if (/lost\b/.test(t)) return "Lost"
  return "Unknown"
}

export function formatArticle(a: Article): string {
  const out = [
    `${a.title} [${statusOf(a.title, a.extract)}]`,
    a.url ? `Wiki: ${a.url}` : "",
    "",
    a.extract,
  ].filter((l) => l !== "").join("\n")
  return out.length > 1800 ? out.slice(0, 1800) + "..." : out
}

// ---- muxB tools:

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawPage = Record<string, any>

export interface RecentChangesArgs {
  limit?: number
}

export async function recentChanges(args: RecentChangesArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30))
  const data = await api({ action: "query", list: "recentchanges", rcnamespace: "0", rclimit: String(limit), rcprop: "title|user|comment|timestamp|flags" })
  const rows: RawPage[] = data?.query?.recentchanges ?? []
  if (!rows.length) return "The Lost Media Wiki has no recent article edits to show."
  return `Latest Lost Media Wiki article edits (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const when = String(r.timestamp ?? "?").slice(0, 16).replace("T", " ")
      const who = String(r.user ?? "?").slice(0, 60)
      const size = r.newlen !== undefined && r.oldlen !== undefined ? ` (${Number(r.oldlen)} -> ${Number(r.newlen)} bytes)` : ""
      const comment = String(r.comment ?? "").replace(/\s+/g, " ").trim()
      return [
        `${i + 1}. ${String(r.title ?? "?")}`,
        `   ${when} by ${who} [${String(r.type ?? "edit")}]${size}${r.minor ? " minor" : ""}`,
        ...(comment ? [`   ${comment.slice(0, 140)}`] : []),
      ].join("\n")
    }).join("\n")
}

export interface BrowseCategoriesArgs {
  prefix?: string
  limit?: number
}

export async function browseCategories(args: BrowseCategoriesArgs): Promise<string> {
  const prefix = (args.prefix ?? "").trim()
  const limit = Math.max(1, Math.min(args.limit ?? 25, 50))
  const data = await api({ action: "query", list: "allcategories", acprefix: prefix, aclimit: String(limit) })
  const rows: RawPage[] = data?.query?.allcategories ?? []
  if (!rows.length) return `The Lost Media Wiki has no categories starting with "${prefix}".`
  return `Lost Media Wiki categories starting with "${prefix}" (${rows.length} shown):\n` +
    rows.map((c, i) => `${i + 1}. ${String(c["*"] ?? "?")}${c.subcats ? "" : " (no subcategories)"}`).join("\n")
}
