const BASE = "https://export.arxiv.org/api/query"
const UA = "mrfentmen-arxiv-mcp/1.0 (https://github.com/mrfentmen)"
export class ArxivError extends Error {}

function decodeXml(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
}

function extract(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gs")
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) out.push(decodeXml(m[1]))
  return out
}

async function queryXml(q: string, max: number): Promise<string> {
  const res = await fetch(`${BASE}?search_query=${encodeURIComponent(q)}&max_results=${max}&sortBy=relevance`, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new ArxivError(`arXiv error ${res.status}`)
  return res.text()
}

export async function searchPapers(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new ArxivError("Provide a search query")
  const limit = Math.min(args.limit ?? 5, 20)
  const xml = await queryXml(`all:${q}`, limit)
  const titles = extract(xml, "title").slice(1)
  const summaries = extract(xml, "summary")
  const ids = extract(xml, "id").slice(1)
  const dates = extract(xml, "published")
  if (titles.length === 0) return "No results"
  return titles.map((t, i) => {
    const id = (ids[i] ?? "").split("/abs/").pop() ?? ""
    const date = (dates[i] ?? "").slice(0, 10)
    return `${i + 1}. ${t}\n   ${id} (${date})\n   ${summaries[i] ? summaries[i].slice(0, 200) + (summaries[i].length > 200 ? "..." : "") : ""}`
  }).join("\n\n")
}

export async function paperInfo(args: { paperId?: string }): Promise<string> {
  const id = (args.paperId ?? "").trim()
  if (!id) throw new ArxivError("Provide an arXiv paper ID")
  const xml = await queryXml(`id:${id}`, 1)
  const titles = extract(xml, "title").slice(1)
  const summaries = extract(xml, "summary")
  const authors = extract(xml, "name")
  const dates = extract(xml, "published")
  if (titles.length === 0) return "No paper found"
  return `Title: ${titles[0]}\nID: ${id}\nPublished: ${(dates[0] ?? "").slice(0, 10)}\nAuthors: ${authors.join(", ") || "n/a"}\n\n${summaries[0] ?? ""}`
}

function formatResults(xml: string, limit: number): string {
  const titles = extract(xml, "title").slice(1)
  const summaries = extract(xml, "summary")
  const ids = extract(xml, "id").slice(1)
  const dates = extract(xml, "published")
  if (titles.length === 0) return "No results"
  return titles.slice(0, limit).map((t, i) => {
    const id = (ids[i] ?? "").split("/abs/").pop() ?? ""
    const date = (dates[i] ?? "").slice(0, 10)
    return `${i + 1}. ${t}\n   ${id} (${date})\n   ${summaries[i] ? summaries[i].slice(0, 200) + (summaries[i].length > 200 ? "..." : "") : ""}`
  }).join("\n\n")
}

async function querySorted(q: string, max: number, field: string): Promise<string> {
  const sortField = field === "newest" ? "submittedDate" : "relevance"
  const res = await fetch(`${BASE}?search_query=${encodeURIComponent(q)}&max_results=${max}&sortBy=${sortField}&sortOrder=descending`, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new ArxivError(`arXiv error ${res.status}`)
  return res.text()
}

export async function searchTitle(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new ArxivError("Provide a search query")
  const limit = Math.min(args.limit ?? 5, 20)
  return formatResults(await queryXml(`ti:${q}`, limit), limit)
}

export async function searchAuthor(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new ArxivError("Provide an author name")
  const limit = Math.min(args.limit ?? 5, 20)
  return formatResults(await queryXml(`au:${q}`, limit), limit)
}

export async function searchCategory(args: { category?: string; limit?: number }): Promise<string> {
  const c = (args.category ?? "").trim()
  if (!c) throw new ArxivError("Provide a category like cs.LG or quant-ph")
  const limit = Math.min(args.limit ?? 5, 20)
  return formatResults(await queryXml(`cat:${c}`, limit), limit)
}

export async function newestPapers(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim() || "all:electron"
  const limit = Math.min(args.limit ?? 5, 20)
  return formatResults(await querySorted(q.startsWith("all:") || q.includes(":") ? q : `all:${q}`, limit, "newest"), limit)
}

export async function papersById(args: { ids?: string }): Promise<string> {
  const list = (args.ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10)
  if (!list.length) throw new ArxivError("Provide comma-separated arXiv IDs")
  const res = await fetch(`${BASE}?id_list=${encodeURIComponent(list.join(","))}&max_results=${list.length}`, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new ArxivError(`arXiv error ${res.status}`)
  return formatResults(await res.text(), list.length)
}
