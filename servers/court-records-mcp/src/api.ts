const FEED = "https://www.courtlistener.com/feed/search/"
const API = "https://www.courtlistener.com/api/rest/v4"
const UA = "mrfentmen-court-records-mcp/1.0 (https://github.com/mrfentmen)"
export class CourtError extends Error {}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function parseFeed(xml: string): Array<{ title: string; link: string; summary: string }> {
  const out: Array<{ title: string; link: string; summary: string }> = []
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g
  let m: RegExpExecArray | null
  while ((m = entryRe.exec(xml)) !== null) {
    const e = m[1]
    const title = /<title>([\s\S]*?)<\/title>/.exec(e)?.[1] ?? ""
    const link = /<link[^>]*href="([^"]+)"/.exec(e)?.[1] ?? ""
    const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(e)?.[1] ?? ""
    if (title) out.push({ title: stripTags(title), link, summary: stripTags(summary).slice(0, 500) })
  }
  return out
}

export async function searchCases(args: { query?: string; page_size?: number }): Promise<string> {
  const q = encodeURIComponent(args.query ?? "")
  if (!q) throw new CourtError("Provide a search query")
  const res = await fetch(`${FEED}?q=${q}&type=o`, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new CourtError(`CourtListener error ${res.status}`)
  const rows = parseFeed(await res.text()).slice(0, args.page_size ?? 10)
  return (
    rows.map((c) => `${c.title}\n  ${c.summary}\n  ${c.link}`).join("\n\n") || "No cases found"
  )
}

export async function getCase(args: { case_id?: number }): Promise<string> {
  const id = args.case_id ?? 0
  if (!id) throw new CourtError("Provide a CourtListener opinion id")
  const token = process.env.COURT_LISTENER_API_TOKEN
  if (!token) {
    throw new CourtError(
      "Full opinion text needs a free CourtListener API token. Set COURT_LISTENER_API_TOKEN, or use search_cases which works without a key."
    )
  }
  const res = await fetch(`${API}/opinions/${id}/`, {
    headers: { "User-Agent": UA, Authorization: `Token ${token}` },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) {
    throw new CourtError("CourtListener rejected the API token. Check COURT_LISTENER_API_TOKEN.")
  }
  if (!res.ok) throw new CourtError(`CourtListener error ${res.status}`)
  const c = await res.json()
  const text = stripTags(c.plain_text ?? c.text ?? "").slice(0, 3000)
  return `${c.case_name ?? c.id ?? "opinion"}\n${c.date_filed ?? ""}\n\n${text}`
}

export async function searchDockets(args: { query?: string; page_size?: number }): Promise<string> {
  const q = encodeURIComponent(args.query ?? "")
  if (!q) throw new CourtError("Provide a search query")
  const res = await fetch(`${FEED}?q=${q}&type=r`, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new CourtError(`CourtListener error ${res.status}`)
  const rows = parseFeed(await res.text()).slice(0, args.page_size ?? 10)
  return (
    rows.map((c) => `${c.title}\n  ${c.summary}\n  ${c.link}`).join("\n\n") || "No dockets found"
  )
}

export async function listCourts(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const res = await fetch(`${API}/courts/?page_size=${limit}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new CourtError(`CourtListener error ${res.status}`)
  const d = (await res.json()) as { results?: Array<{ id?: string; full_name?: string; short_name?: string }> }
  const rows = d.results ?? []
  if (!rows.length) return "No courts returned."
  return rows.map((c, i) => `${i + 1}. ${c.full_name ?? c.id ?? "?"} (${c.short_name ?? ""})`).join("\n")
}

export async function searchJudges(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new CourtError("Provide a judge name")
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25))
  const res = await fetch(`${API}/people/?name_first=${encodeURIComponent(q)}&page_size=${limit}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new CourtError(`CourtListener error ${res.status}`)
  const d = (await res.json()) as { results?: Array<{ id?: number; name_first?: string; name_last?: string }> }
  const rows = d.results ?? []
  if (!rows.length) return `No judges found for "${q}".`
  return rows.map((p, i) => `${i + 1}. ${p.name_first ?? ""} ${p.name_last ?? ""} (id ${p.id ?? "?"})`).join("\n")
}
