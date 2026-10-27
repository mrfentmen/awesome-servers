/**
 * Spaceflight News API v4 — keyless, documented, paginated JSON.
 * https://api.spaceflightnewsapi.net/v4/docs/
 */
const BASE = "https://api.spaceflightnewsapi.net/v4"

export class SpaceflightError extends Error {}

async function once(url: string, timeoutMs: number): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "spaceflight-news-api-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new SpaceflightError("Not found in the Spaceflight News API")
    if (res.status === 429) throw new RateLimited()
    if (!res.ok) throw new SpaceflightError(`Spaceflight News API responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof SpaceflightError || e instanceof RateLimited) throw e
    if ((e as Error).name === "AbortError") throw new SpaceflightError("Spaceflight News API request timed out")
    if (e instanceof SyntaxError) throw new SpaceflightError("Spaceflight News API returned malformed JSON")
    throw new SpaceflightError(`Spaceflight News API request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

class RateLimited extends Error {}

async function getJson(url: string, timeoutMs = 30000): Promise<any> {
  for (const pause of [0, 2500, 6000]) {
    if (pause) await new Promise((r) => setTimeout(r, pause))
    try {
      return await once(url, timeoutMs)
    } catch (e) {
      if (!(e instanceof RateLimited)) throw e
    }
  }
  throw new SpaceflightError("Spaceflight News API is rate limiting — wait a minute and retry")
}

const day = (v: unknown): string => String(v ?? "").slice(0, 16).replace("T", " ") || "undated"
const plain = (v: unknown, max = 700): string =>
  String(v ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)

interface Article {
  id: number
  title: string
  url: string
  image_url?: string
  news_site?: string
  summary?: string
  published_at?: string
  authors?: { name?: string }[]
}

function articleLine(a: Article, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  const authors = (a.authors ?? []).map((x) => x.name).filter(Boolean).join(", ")
  return [
    `${prefix}${a.title}`,
    `   ${a.news_site ?? "unknown site"} · ${day(a.published_at)}${authors ? ` · ${authors}` : ""}`,
    `   ${a.url}`,
    `   ${plain(a.summary, 220) || "no summary"}`,
  ].join("\n")
}

function page(params: Record<string, string | number>, limit: number): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) p.set(k, String(v))
  p.set("limit", String(limit))
  return p.toString()
}

async function list(kind: "articles" | "blogs" | "reports", query: string): Promise<{ rows: any[]; count: number }> {
  const d = await getJson(`${BASE}/${kind}/?${query}`)
  return { rows: Array.isArray(d.results) ? d.results : [], count: Number(d.count ?? 0) }
}

export async function latestNews(limit: number): Promise<string> {
  const { rows, count } = await list("articles", page({ ordering: "-published_at" }, limit))
  if (rows.length === 0) return "The Spaceflight News API returned no articles."
  return [`Latest spaceflight news (${rows.length} of ${count.toLocaleString("en-US")} articles):`, "", ...rows.map(articleLine)].join("\n")
}

export async function searchNews(term: string, limit: number): Promise<string> {
  const { rows, count } = await list("articles", page({ search: term.trim(), ordering: "-published_at" }, limit))
  if (rows.length === 0) return `No articles mention "${term}".`
  return [`Articles matching "${term}" (${rows.length} of ${count.toLocaleString("en-US")}):`, "", ...rows.map(articleLine)].join("\n")
}

export async function newsBySite(site: string, limit: number): Promise<string> {
  const { rows, count } = await list("articles", page({ news_site: site.trim(), ordering: "-published_at" }, limit))
  if (rows.length === 0) return `No articles from "${site}".`
  return [`Articles from ${site} (${rows.length} of ${count.toLocaleString("en-US")}):`, "", ...rows.map(articleLine)].join("\n")
}

export async function articleDetail(id: number): Promise<string> {
  const a: Article = await getJson(`${BASE}/articles/${id}/`)
  const authors = (a.authors ?? []).map((x) => x.name).filter(Boolean).join(", ")
  return [
    a.title,
    `${a.news_site ?? "unknown site"} · ${day(a.published_at)}${authors ? ` · ${authors}` : ""}`,
    a.url,
    "",
    plain(a.summary, 1500) || "no summary",
    "",
    a.image_url ? `Image: ${a.image_url}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function latestReports(limit: number): Promise<string> {
  const { rows, count } = await list("reports", page({ ordering: "-published_at" }, limit))
  if (rows.length === 0) return "No reports returned."
  const lines = rows.map(
    (r, i) =>
      `${i + 1}. ${r.title}\n   ${r.news_site ?? "unknown"} · ${day(r.published_at)}\n   ${r.url}\n   ${plain(r.summary, 200) || "no summary"}`
  )
  return [`Agency reports (${rows.length} of ${count.toLocaleString("en-US")}):`, "", ...lines].join("\n")
}

export async function newsSources(): Promise<string> {
  const d = await getJson(`${BASE}/info/`)
  const sites: string[] = Array.isArray(d.news_sites) ? d.news_sites : []
  if (sites.length === 0) return "No sources listed."
  return [`Spaceflight News API v${d.version ?? "?"} — ${sites.length} news sources:`, "", sites.join(", ")].join("\n")
}

export async function latestBlogs(limit: number): Promise<string> {
  const { rows, count } = await list("blogs", page({ ordering: "-published_at" }, limit))
  if (rows.length === 0) return "No blog posts returned."
  const lines = rows.map(
    (b, i) => `${i + 1}. ${b.title}\n   ${b.news_site ?? "unknown"} · ${day(b.published_at)}\n   ${b.url}\n   ${plain(b.summary, 180) || "no summary"}`
  )
  return [`Latest blog posts (${rows.length} of ${count.toLocaleString("en-US")}):`, "", ...lines].join("\n")
}
