const BASE = "https://api.stackexchange.com/2.3"
const UA = "mrfentmen-stackexchange-mcp/1.0 (https://github.com/mrfentmen)"
export class StackexchangeError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const b = await res.text().catch(() => "")
    throw new StackexchangeError(`Stack Exchange returned HTTP ${res.status} ${b.slice(0, 80)}`)
  }
  return (await res.json()) as T
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function search(args: { query?: string; site?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new StackexchangeError("Provide a search query")
  const site = (args.site ?? "stackoverflow").trim()
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(
    `${BASE}/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(q)}&site=${encodeURIComponent(site)}&pagesize=${limit}`
  )
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No questions found on ${site}`
  return `Questions on ${site}:\n` + items.map((it, i) => {
    const d2 = it?.creation_date ? new Date(it.creation_date * 1000).toISOString().slice(0, 10) : ""
    return `${i + 1}. [${it?.score ?? 0}] ${stripHtml(it?.title ?? "n/a")} | answers ${it?.answer_count ?? 0} | ${d2}\n   ${it?.link ?? ""}`
  }).join("\n")
}

export async function answers(args: { questionId?: number; site?: string; limit?: number }): Promise<string> {
  const id = Number(args.questionId)
  if (!Number.isInteger(id) || id <= 0) throw new StackexchangeError("Provide a positive question ID")
  const site = (args.site ?? "stackoverflow").trim()
  const limit = Math.min(args.limit ?? 5, 10)
  const d = await get<any>(
    `${BASE}/questions/${id}/answers?order=desc&sort=votes&site=${encodeURIComponent(site)}&pagesize=${limit}&filter=withbody`
  )
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No answers found for question ${id}`
  return `Top answers for question ${id} on ${site}:\n` + items.map((it, i) => {
    const owner = it?.owner?.display_name ?? "anonymous"
    const body = stripHtml(it?.body ?? "").slice(0, 400)
    return `${i + 1}. ${it?.score ?? 0} votes by ${owner}\n   ${body || "no text"}`
  }).join("\n\n")
}

function siteParam(site?: string): string {
  return (site ?? "stackoverflow").trim() || "stackoverflow"
}

export async function questionList(args: { site?: string; limit?: number }): Promise<string> {
  const site = siteParam(args.site)
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/questions?order=desc&sort=activity&site=${encodeURIComponent(site)}&pagesize=${limit}`)
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No questions on ${site}`
  return items.map((it, i) => `${i + 1}. [${it?.score ?? 0}] ${stripHtml(it?.title ?? "n/a")} | answers ${it?.answer_count ?? 0}\n   ${it?.link ?? ""}`).join("\n")
}

export async function questionDetails(args: { questionId?: number; site?: string }): Promise<string> {
  const id = Number(args.questionId)
  if (!Number.isInteger(id) || id <= 0) throw new StackexchangeError("Provide a positive question ID")
  const site = siteParam(args.site)
  const d = await get<any>(`${BASE}/questions/${id}?order=desc&sort=activity&site=${encodeURIComponent(site)}&filter=withbody`)
  const it = ((d?.items ?? []) as any[])[0]
  if (!it) return `Question ${id} not found`
  return `${stripHtml(it.title ?? "n/a")}\nScore ${it?.score ?? 0} | views ${it?.view_count ?? 0} | ${it?.link ?? ""}\n\n${stripHtml(it?.body ?? "").slice(0, 800)}`
}

export async function tagList(args: { site?: string; limit?: number }): Promise<string> {
  const site = siteParam(args.site)
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/tags?order=desc&sort=popular&site=${encodeURIComponent(site)}&pagesize=${limit}`)
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No tags on ${site}`
  return items.map((t, i) => `${i + 1}. ${t?.name ?? "?"} (x${t?.count ?? "?"})`).join("\n")
}

export async function topUsers(args: { site?: string; limit?: number }): Promise<string> {
  const site = siteParam(args.site)
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/users?order=desc&sort=reputation&site=${encodeURIComponent(site)}&pagesize=${limit}`)
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No users on ${site}`
  return items.map((u, i) => `${i + 1}. ${u?.display_name ?? "?"} | rep ${u?.reputation ?? 0}`).join("\n")
}

export async function siteList(): Promise<string> {
  const d = await get<any>(`${BASE}/sites?pagesize=100`)
  const items = (d?.items ?? []) as any[]
  const open = items.filter((s) => s?.site_state === "normal" || s?.site_state === "open_beta")
  return open.slice(0, 40).map((s, i) => `${i + 1}. ${s?.name ?? "?"} (${s?.api_site_parameter ?? "?"})`).join("\n")
}

export async function answerLookup(args: { answerId?: number; site?: string }): Promise<string> {
  const id = Number(args.answerId)
  if (!Number.isInteger(id) || id <= 0) throw new StackexchangeError("Provide a positive answer ID")
  const site = siteParam(args.site)
  const d = await get<any>(`${BASE}/answers/${id}?order=desc&sort=votes&site=${encodeURIComponent(site)}&filter=withbody`)
  const it = ((d?.items ?? []) as any[])[0]
  if (!it) return `Answer ${id} not found`
  return `Score ${it?.score ?? 0} by ${it?.owner?.display_name ?? "anonymous"}\n\n${stripHtml(it?.body ?? "").slice(0, 800)}`
}

export async function questionComments(args: { questionId?: number; site?: string }): Promise<string> {
  const id = Number(args.questionId)
  if (!Number.isInteger(id) || id <= 0) throw new StackexchangeError("Provide a positive question ID")
  const site = siteParam(args.site)
  const d = await get<any>(`${BASE}/questions/${id}/comments?order=desc&sort=votes&site=${encodeURIComponent(site)}&pagesize=10`)
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No comments on question ${id}`
  return items.map((c, i) => `${i + 1}. ${c?.owner?.display_name ?? "?"}: ${stripHtml(c?.body ?? "").slice(0, 200)}`).join("\n")
}

export async function userAnswers(args: { userId?: number; site?: string; limit?: number }): Promise<string> {
  const id = Number(args.userId)
  if (!Number.isInteger(id) || id <= 0) throw new StackexchangeError("Provide a positive user ID")
  const site = siteParam(args.site)
  const limit = Math.min(args.limit ?? 5, 10)
  const d = await get<any>(`${BASE}/users/${id}/answers?order=desc&sort=votes&site=${encodeURIComponent(site)}&pagesize=${limit}`)
  const items = (d?.items ?? []) as any[]
  if (!items.length) return `No answers by user ${id}`
  return items.map((it, i) => `${i + 1}. score ${it?.score ?? 0} on question ${it?.question_id ?? "?"}: ${stripHtml(it?.body ?? "").slice(0, 200)}`).join("\n\n")
}
