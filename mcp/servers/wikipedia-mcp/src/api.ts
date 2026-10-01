const BASE = "https://en.wikipedia.org/api/rest_v1"
const UA = "mrfentmen-wikipedia-mcp/1.0 (https://github.com/mrfentmen)"
export class WikipediaError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new WikipediaError("Wikipedia rate limit hit, wait and retry")
  if (!res.ok) throw new WikipediaError(`Wikipedia error ${res.status}`)
  return (await res.json()) as T
}

interface Summary {
  title?: string
  extract?: string
  description?: string
  pageid?: number
  content_urls?: { desktop?: { page?: string } }
}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new WikipediaError("Provide a search query")
  const limit = Math.min(args.limit ?? 5, 15)
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${limit}&format=json&origin=*`
  const d = await get<any>(url)
  const hits = d?.query?.search ?? []
  if (hits.length === 0) return "No results"
  return hits.map((h: any, i: number) => `${i + 1}. ${h.title}\n   ${(h.snippet ?? "").replace(/<[^>]+>/g, "")}`).join("\n\n")
}

export async function summary(args: { title?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new WikipediaError("Provide an article title")
  const d = await get<Summary>(`${BASE}/page/summary/${encodeURIComponent(title)}`)
  return `Title: ${d.title ?? ""}\n${d.description ? `About: ${d.description}\n` : ""}${d.extract ?? ""}${d.content_urls?.desktop?.page ? `\nRead more: ${d.content_urls.desktop.page}` : ""}`
}

export async function random(args: Record<string, never>): Promise<string> {
  const d = await get<Summary>(`${BASE}/page/random/summary`)
  return `Title: ${d.title ?? ""}\n${d.description ? `About: ${d.description}\n` : ""}${d.extract ?? ""}${d.content_urls?.desktop?.page ? `\nRead more: ${d.content_urls.desktop.page}` : ""}`
}

// ---- muxC tools:

const WP_UA = "mrfentmen-wikipedia-mcp/1.0 (https://github.com/mrfentmen)"

class WikipediaToolError extends Error {}

async function wpJson(path: string, ms = 25000): Promise<any> {
  const res = await fetch(`https://en.wikipedia.org${path}`, { headers: { "User-Agent": WP_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) })
  if (res.status === 404) throw new WikipediaToolError("Wikipedia has no such page")
  if (!res.ok) throw new WikipediaToolError(`Wikipedia returned ${res.status} for ${path}`)
  return await res.json()
}

/** The sections of an article, which is how you get an outline before reading it. */
export async function articleOutline(args: { title?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new WikipediaToolError("Provide an article title, e.g. Ada Lovelace")
  const d = await wpJson(`/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=sections&format=json&formatversion=2`)
  if (d?.error) throw new WikipediaToolError(`Wikipedia: ${d.error.info}`)
  const sections: any[] = d?.parse?.sections ?? []
  if (!sections.length) return `Wikipedia has no sections for "${title}".`
  return `Sections of "${d.parse.title}" (${sections.length}):\n` +
    sections
      .filter((s) => !/^toc$/i.test(s.line ?? ""))
      .map((s, i) => `${i + 1}. ${"  ".repeat(Math.max(0, (Number(s.level ?? 2) - 2)))}- ${s.line}${s.number ? ` (${s.number})` : ""}`)
      .join("\n")
}

/** Every language Wikipedia has the same article in, from the langlinks the REST api exposes. */
export async function translations(args: { title?: string; limit?: number }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new WikipediaToolError("Provide an article title, e.g. Ada Lovelace")
  const limit = Math.max(1, Math.min(args.limit ?? 30, 200))
  const d = await wpJson(`/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(title)}&lllimit=${limit}&format=json&formatversion=2`)
  if (d?.error) throw new WikipediaToolError(`Wikipedia: ${d.error.info}`)
  const page = d?.query?.pages?.[0]
  const links: any[] = page?.langlinks ?? []
  if (!links.length) return `"${page?.title ?? title}" has no interlanguage links, or it does not exist.`
  return `"${page.title}" exists in ${links.length} languages (${links.length} shown):\n` +
    links.slice(0, limit).map((l, i) => `${i + 1}. ${l.lang}: ${l.title}`).join("\n")
}
