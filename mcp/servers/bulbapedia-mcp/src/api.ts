/**
 * Bulbapedia (MediaWiki API) client, keyless.
 * Uses TextExtracts for clean article intros plus page URLs.
 */
const API = "https://bulbapedia.bulbagarden.net/w/api.php"

export class BulbapediaError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function api(params: Record<string, string>): Promise<Raw> {
  const qs = new URLSearchParams({ format: "json", ...params }).toString()
  const res = await fetch(`${API}?${qs}`, {
    headers: { "User-Agent": "bulbapedia-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new BulbapediaError(`Bulbapedia error ${res.status}`)
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
  if (!hit) throw new BulbapediaError("Could not pick a random article")
  return { title: String(hit.title) }
}

export function formatArticle(a: Article): string {
  const out = [a.title, a.url ? `Wiki: ${a.url}` : "", "", a.extract].filter((l) => l !== "").join("\n")
  return out.length > 1800 ? out.slice(0, 1800) + "..." : out
}

// ---- muxA tools:

const LIMITS = {
  page_details: 60,
  category_members: 60,
  page_links: 60,
} as const

function cap(value: number | undefined, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? max), max))
}

function clip(value: unknown, max = 160): string {
  const s = value == null ? "" : stripTags(String(value)).replace(/\s+/g, " ").trim()
  return s.length > max ? `${s.slice(0, max)}...` : s
}

export interface DetailsArgs {
  title: string
}

export interface CategoryArgs {
  category: string
  limit?: number
  namespace?: number
}

export interface LinksArgs {
  title: string
  limit?: number
  redirects?: boolean
}

export async function pageLinks(args: LinksArgs): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new BulbapediaError("Provide a page title, e.g. Pikachu.")
  const limit = cap(args.limit, LIMITS.page_links)
  const data = await api({
    action: "query",
    prop: "links|images",
    titles: title,
    pllimit: String(limit),
    imlimit: String(limit),
    ...(args.redirects === true ? { redirects: "1" } : {}),
  })
  const pages: Raw = data?.query?.pages ?? {}
  const page: Raw | undefined = Object.values(pages)[0] as Raw | undefined
  if (!page || page.missing !== undefined) return `No Bulbapedia page titled "${title}".`
  const links = (page.links ?? []) as Array<{ title?: string; ns?: number }>
  const images = (page.images ?? []) as Array<{ title?: string }>
  const redirects = (data?.query?.redirects ?? []) as Array<{ from?: string; to?: string }>
  const out = [`Outbound links from ${String(page.title ?? title)}: ${links.length}, images used: ${images.length}.`]
  if (redirects.length) {
    out.push("", `Redirects resolved (${redirects.length}):`)
    for (const r of redirects.slice(0, 10)) out.push(`  ${String(r.from ?? "?")} -> ${String(r.to ?? "?")}`)
  }
  if (links.length) {
    out.push("", "Links:")
    for (const l of links.slice(0, limit)) out.push(`  ${String(l.title ?? "?").replace(/^Category:/, "Category:")} (ns ${l.ns ?? "?"})`)
    if (links.length > limit) out.push(`  plus ${links.length - limit} more`)
  }
  if (images.length) {
    out.push("", "Images used:")
    for (const im of images.slice(0, limit)) out.push(`  ${String(im.title ?? "?").replace(/^File:/, "")}`)
    if (images.length > limit) out.push(`  plus ${images.length - limit} more`)
  }
  if (!links.length && !images.length) out.push("", "This page links nowhere and uses no images.")
  return out.join("\n")
}
