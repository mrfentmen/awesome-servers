/**
 * Stardew Valley Wiki (MediaWiki API) client, keyless.
 * This wiki has no TextExtracts extension, so article text is read
 * from raw wikitext and cleaned up best-effort.
 */
const API = "https://stardewvalleywiki.com/mediawiki/api.php"

export class StardewError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function api(params: Record<string, string>): Promise<Raw> {
  const qs = new URLSearchParams({ format: "json", ...params }).toString()
  const res = await fetch(`${API}?${qs}`, {
    headers: { "User-Agent": "stardew-wiki-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new StardewError(`Stardew Wiki error ${res.status}`)
  return (await res.json()) as Raw
}

export interface SearchHit {
  title: string
  snippet: string
}

const stripTags = (s: string): string => s.replace(/<[^>]+>/g, "")

export async function searchWiki(query: string, limit = 5): Promise<SearchHit[]> {
  const data = await api({ action: "query", list: "search", srsearch: query, srlimit: String(limit) })
  const hits: Raw[] = data?.query?.search ?? []
  return hits.map((h) => ({
    title: String(h.title),
    snippet: stripTags(String(h.snippet ?? "")).replace(/\s+/g, " ").trim(),
  }))
}

/** Best-effort wikitext -> readable text. */
export function cleanWikitext(wikitext: string): string {
  let t = wikitext
  t = t.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
  t = t.replace(/<ref[^/]*\/>/gi, "")
  t = t.replace(/\{\{\s*[Ff]ile\s*:[^}]*\}\}/g, "")
  // strip templates innermost-first, a few passes
  for (let i = 0; i < 6; i++) {
    const next = t.replace(/\{\{[^{}]*\}\}/g, " ")
    if (next === t) break
    t = next
  }
  // tables
  t = t.replace(/\{\|[\s\S]*?\|\}/g, " ")
  // file/image links
  t = t.replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, " ")
  // [[target|label]] -> label, [[target]] -> target
  t = t.replace(/\[\[([^|\]]*\|)?([^\]]+)\]\]/g, "$2")
  // external links [http://x label] -> label
  t = t.replace(/\[https?:[^\s\]]*\s+([^\]]+)\]/g, "$1")
  t = t.replace(/\[https?:[^\]]*\]/g, "")
  t = t.replace(/'''?/g, "")
  t = t.replace(/<[^>]+>/g, "")
  // section headers, lists, indent
  t = t.replace(/^==+\s*(.*?)\s*==+$/gm, "\n$1:\n")
  t = t.replace(/^[*#:;]+\s*/gm, "- ")
  t = t.replace(/[ \t]+/g, " ")
  t = t.replace(/\n{3,}/g, "\n\n")
  return t.trim()
}

export interface Article {
  title: string
  url?: string
  image?: string
  text: string
}

export async function getPage(title: string): Promise<Article | null> {
  const data = await api({
    action: "query",
    prop: "info|pageimages|revisions",
    inprop: "url",
    rvprop: "content",
    rvslots: "main",
    titles: title,
  })
  const pages: Raw = data?.query?.pages ?? {}
  const page: Raw | undefined = Object.values(pages)[0] as Raw | undefined
  if (!page || page.missing !== undefined) return null
  const slots = page?.revisions?.[0]?.slots?.main as Raw | undefined
  const wikitext = typeof slots?.["*"] === "string" ? (slots["*"] as string) : ""
  const text = cleanWikitext(wikitext).slice(0, 1500)
  return {
    title: String(page.title ?? title),
    url: page.fullurl,
    image: page.thumbnail?.source,
    text: text || "(no readable text on this page)",
  }
}

export async function randomPage(): Promise<{ title: string }> {
  const data = await api({ action: "query", list: "random", rnnamespace: "0", rnlimit: "1" })
  const hit = data?.query?.random?.[0]
  if (!hit) throw new StardewError("Could not pick a random page")
  return { title: String(hit.title) }
}

export function formatArticle(a: Article): string {
  const lines = [
    `${a.title}`,
    a.url ? `Wiki: ${a.url}` : "",
    a.image ? `Image: ${a.image}` : "",
    "",
    a.text,
  ].filter((l) => l !== "")
  const out = lines.join("\n")
  return out.length > 1800 ? out.slice(0, 1800) + "..." : out
}

// ---- muxB tools:
type CmHit = { pageid?: number; title?: string; ns?: number }
type LinkHit = { ns?: number; title?: string }
type SectionHit = { index?: string; level?: string; line?: string; anchor?: string }

