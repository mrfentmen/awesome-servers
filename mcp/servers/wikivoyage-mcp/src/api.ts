/**
 * Wikivoyage client. Keyless MediaWiki API. Travel guides, not an encyclopaedia:
 * every article is written for someone going there.
 */
const BASE = "https://en.wikivoyage.org/w/api.php"

export class WikivoyageError extends Error {}

interface ApiBody {
  query?: {
    search?: Array<{ title?: string; snippet?: string; size?: number; wordcount?: number }>
    pages?: Record<string, { title?: string; extract?: string; links?: Array<{ title?: string }> }>
    geosearch?: Array<{ title?: string; lat?: number; lon?: number; dist?: number }>
    random?: Array<{ title?: string }>
  }
  parse?: { sections?: Array<{ index?: string; line?: string; level?: string }> }
}

async function api(params: Record<string, string>): Promise<ApiBody> {
  const url = new URL(BASE)
  for (const [k, v] of Object.entries({ ...params, format: "json", formatversion: "2" })) {
    url.searchParams.set(k, v)
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "wikivoyage-mcp/1.0 (awesome-servers)" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new WikivoyageError(`Wikivoyage error ${res.status}`)
  return (await res.json()) as ApiBody
}

export function clean(html: string | undefined): string {
  return (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
}

export async function search(query: string, limit: number): Promise<string> {
  const body = await api({ action: "query", list: "search", srsearch: query, srlimit: String(limit) })
  const rows = body.query?.search ?? []
  if (!rows.length) return `No Wikivoyage articles matched "${query}".`
  return rows
    .map((r) => `${r.title} — ${clean(r.snippet)}`)
    .join("\n")
}

export async function overview(title: string): Promise<string> {
  const body = await api({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    titles: title,
  })
  const page = Object.values(body.query?.pages ?? {})[0]
  if (!page?.extract) return `No article found for "${title}".`
  return `${page.title}\n\n${page.extract.trim().slice(0, 4000)}`
}

export async function sections(title: string): Promise<string> {
  const body = await api({ action: "parse", page: title, prop: "sections", redirects: "1" })
  const rows = body.parse?.sections ?? []
  if (!rows.length) return `No sections found for "${title}".`
  return rows.map((s) => `${"  ".repeat(Math.max(Number(s.level ?? "2") - 2, 0))}${s.line}`).join("\n")
}

export async function nearby(lat: number, lon: number, radius: number, limit: number): Promise<string> {
  const body = await api({
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lon}`,
    gsradius: String(radius),
    gslimit: String(limit),
  })
  const rows = body.query?.geosearch ?? []
  if (!rows.length) return "No Wikivoyage articles within that radius."
  return rows.map((r) => `${r.title} — ${(Number(r.dist ?? 0) / 1000).toFixed(1)} km`).join("\n")
}

export async function links(title: string, limit: number): Promise<string> {
  const body = await api({ action: "query", prop: "links", titles: title, pllimit: String(limit), redirects: "1" })
  const page = Object.values(body.query?.pages ?? {})[0]
  const rows = page?.links ?? []
  if (!rows.length) return `No links found for "${title}".`
  return rows.map((l) => l.title).join("\n")
}

export async function random(limit: number): Promise<string> {
  const body = await api({ action: "query", list: "random", rnnamespace: "0", rnlimit: String(limit) })
  const rows = body.query?.random ?? []
  return rows.map((r) => r.title).join("\n") || "No random articles returned."
}

export async function randomWithOverviews(limit: number): Promise<string> {
  const titles = (await random(limit)).split("\n").filter(Boolean).slice(0, limit)
  const out: string[] = []
  for (const title of titles) {
    try {
      const body = await api({
        action: "query",
        prop: "extracts",
        exintro: "1",
        explaintext: "1",
        exsentences: "2",
        redirects: "1",
        titles: title,
      })
      const page = Object.values(body.query?.pages ?? {})[0]
      out.push(`${title} — ${(page?.extract ?? "").trim()}`)
    } catch {
      out.push(title)
    }
  }
  return out.join("\n\n")
}
