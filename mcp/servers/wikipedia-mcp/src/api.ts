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

// ---- gap4a4 tools:

