const BASE = "https://en.wikiquote.org/w/api.php"
const UA = "mrfentmen-wikiquote-mcp/1.0 (https://github.com/mrfentmen)"
export class WikiquoteError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new WikiquoteError("Wikiquote rate limit hit, wait and retry")
  if (!res.ok) throw new WikiquoteError(`Wikiquote error ${res.status}`)
  return (await res.json()) as T
}

export async function searchQuotes(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new WikiquoteError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${limit}&format=json&origin=*`)
  const hits = d?.query?.search ?? []
  if (!hits.length) return "No pages found"
  return hits.map((h: any, i: number) => `${i + 1}. ${h.title}`).join("\n")
}

export async function pageQuotes(args: { page?: string; limit?: number }): Promise<string> {
  const page = (args.page ?? "").trim()
  if (!page) throw new WikiquoteError("Provide a page title")
  const limit = Math.min(args.limit ?? 8, 15)
  const d = await get<any>(`${BASE}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&origin=*`)
  const text = d?.parse?.wikitext?.["*"] ?? ""
  if (!text) return "Page not found"
  const lines = text.split("\n")
    .filter((l: string) => l.startsWith("*") || l.startsWith("#"))
    .map((l: string) => l.replace(/^[*#]+\s*/, "").replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/'''|''/g, "").trim())
    .filter((l: string) => l.length > 3 && !l.startsWith("="))
    .slice(0, limit)
  if (!lines.length) return "No quotes on this page"
  return `Quotes from ${page}:\n\n${lines.map((l: string, i: number) => `${i + 1}. ${l}`).join("\n\n")}`
}

// ---- muxB tools:

const WQ_REST = "https://en.wikiquote.org/api/rest_v1"

export async function randomQuotePage(): Promise<string> {
  const res = await fetch(`${WQ_REST}/page/random/summary`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 429) throw new WikiquoteError("Wikiquote rate limit hit, wait and retry")
  if (!res.ok) throw new WikiquoteError(`Wikiquote error ${res.status}`)
  const d = (await res.json()) as { title?: string; description?: string; extract?: string; timestamp?: string; content_urls?: { desktop?: { page?: string } } }
  const page = d.content_urls?.desktop?.page ?? "URL not reported"
  return [
    `Random Wikiquote page: ${d.title ?? "title not reported"}`,
    `Description: ${d.description && d.description.trim() ? d.description.trim() : "not reported"}`,
    `Last edited: ${d.timestamp ?? "not reported"}`,
    `Page: ${page}`,
    "",
    String(d.extract ?? "").replace(/\s+/g, " ").trim().slice(0, 900) || "No extract reported",
  ].join("\n")
}

export async function pageLanguages(args: { page?: string; limit?: number }): Promise<string> {
  const page = (args.page ?? "").trim()
  if (!page) throw new WikiquoteError("Provide a page title")
  const limit = Math.max(1, Math.min(Number(args.limit ?? 20) || 20, 100))
  const d = await get<any>(
    `${BASE}?action=query&prop=langlinks&titles=${encodeURIComponent(page)}&lllimit=200&llprop=url%7Clangname&format=json&origin=*`,
  )
  const pages = d?.query?.pages ?? {}
  const first = Object.values(pages)[0] as any
  if (!first || first.missing !== undefined) return `No Wikiquote page titled "${page}".`
  const links = Array.isArray(first.langlinks) ? first.langlinks : []
  if (!links.length) return `No other-language Wikiquote pages link to "${page}".`
  return `Wikiquote pages for "${first.title ?? page}" in other languages (${links.length} total, showing ${Math.min(limit, links.length)}):\n` +
    links.slice(0, limit).map((l: any, i: number) => `${i + 1}. ${l.lang ?? "?"} (${l.langname ?? "name not reported"}): ${l.url ?? "URL not reported"}`).join("\n")
}
