/**
 * Stack Exchange API v2.3 — keyless Q&A data for Stack Overflow and 180+
 * other sites. Answers include HTML bodies, which are converted to text.
 */
const BASE = "https://api.stackexchange.com/2.3"

export class StackExchangeError extends Error {}

async function getJson(path: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "stackexchange-mcp", accept: "application/json", "accept-encoding": "gzip" },
    })
    if (!res.ok) throw new StackExchangeError(`Stack Exchange responded ${res.status}`)
    const text = await res.text()
    let d: any
    try {
      d = JSON.parse(text)
    } catch {
      throw new StackExchangeError("Stack Exchange returned malformed JSON")
    }
    if (d?.error_message) throw new StackExchangeError(`Stack Exchange: ${d.error_message}`)
    return d
  } catch (e) {
    if (e instanceof StackExchangeError) throw e
    if ((e as Error).name === "AbortError") throw new StackExchangeError("Stack Exchange request timed out")
    throw new StackExchangeError(`Stack Exchange request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const siteArg = (site: string): string => {
  const v = site.trim().toLowerCase()
  if (!/^[a-z][a-z0-9.]{2,40}$/.test(v)) throw new StackExchangeError(`"${site}" is not a Stack Exchange site, e.g. stackoverflow or superuser`)
  return v
}

const sizeArg = (n: number): number => {
  if (!Number.isInteger(n) || n < 1 || n > 25) throw new StackExchangeError("limit must be between 1 and 25")
  return n
}

const idArg = (id: number): number => {
  if (!Number.isInteger(id) || id < 1) throw new StackExchangeError("id must be a positive integer")
  return id
}

function stripHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code: string) => `\n${code.replace(/<[^>]+>/g, "")}\n`)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function questionLine(q: any, i?: number): string {
  const answered = q?.is_answered ? "answered" : "unanswered"
  const tags = (q?.tags ?? []).slice(0, 4).join(", ")
  return [
    `${i !== undefined ? `${i + 1}. ` : ""}[${q?.score ?? 0}] ${stripHtml(q?.title)}`,
    `   ${q?.answer_count ?? 0} answers · ${answered} · ${q?.view_count ?? 0} views${tags ? ` · ${tags}` : ""}`,
    `   ${q?.link ?? ""}`,
  ].join("\n")
}

function items(d: any): any[] {
  return Array.isArray(d?.items) ? d.items : []
}

export async function searchQuestions(query: string, site = "stackoverflow", limit = 8): Promise<string> {
  const q = query.trim()
  if (q.length < 3) throw new StackExchangeError("Search query must be at least 3 characters")
  const s = siteArg(site)
  const d = await getJson(`/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(q)}&site=${s}&pagesize=${sizeArg(limit)}`)
  const rows = items(d)
  if (rows.length === 0) return `Stack Exchange (${s}) has no questions matching "${query}".`
  return [
    `${s} questions matching "${query}" (${rows.length} of ${Number(d?.total ?? rows.length).toLocaleString("en-US")}):`,
    ...rows.map((r, i) => questionLine(r, i)),
  ].join("\n\n")
}

export async function questionsByTag(tag: string, site = "stackoverflow", limit = 8): Promise<string> {
  const t = tag.trim()
  if (!/^[a-z0-9][a-z0-9.+#-]{0,34}$/i.test(t)) throw new StackExchangeError(`"${tag}" is not a valid tag name`)
  const s = siteArg(site)
  const d = await getJson(`/questions?order=desc&sort=votes&tagged=${encodeURIComponent(t)}&site=${s}&pagesize=${sizeArg(limit)}`)
  const rows = items(d)
  if (rows.length === 0) return `No questions tagged "${tag}" on ${s}.`
  return [`Top ${s} questions tagged "${tag}" (${rows.length} of ${Number(d?.total ?? rows.length).toLocaleString("en-US")}):`, ...rows.map((r, i) => questionLine(r, i))].join("\n\n")
}

export async function hotQuestions(site = "stackoverflow", limit = 8): Promise<string> {
  const s = siteArg(site)
  const d = await getJson(`/questions?order=desc&sort=hot&site=${s}&pagesize=${sizeArg(limit)}`)
  const rows = items(d)
  if (rows.length === 0) return `No hot questions on ${s} right now.`
  return [`Hot ${s} questions right now (${rows.length}):`, ...rows.map((r, i) => questionLine(r, i))].join("\n\n")
}

export async function questionDetail(questionId: number, site = "stackoverflow"): Promise<string> {
  const id = idArg(questionId)
  const s = siteArg(site)
  const d = await getJson(`/questions/${id}?site=${s}&filter=withbody`)
  const q = items(d)[0]
  if (!q) throw new StackExchangeError(`No question ${id} on ${s}`)
  return [
    `${stripHtml(q.title)}`,
    `Score ${q.score ?? 0} · ${q.answer_count ?? 0} answers · ${q.view_count ?? 0} views · ${q.is_answered ? "answered" : "unanswered"}`,
    `Tags: ${(q.tags ?? []).join(", ") || "none"}`,
    `Asked: ${q.creation_date ? new Date(Number(q.creation_date) * 1000).toISOString().slice(0, 10) : "?"} by ${q.owner?.display_name ?? "unknown"}`,
    `Link: ${q.link ?? ""}`,
    "",
    stripHtml(q.body).slice(0, 1600) || "No body text.",
  ].join("\n")
}

export async function answersForQuestion(questionId: number, site = "stackoverflow", limit = 5): Promise<string> {
  const id = idArg(questionId)
  const s = siteArg(site)
  const d = await getJson(`/questions/${id}/answers?order=desc&sort=votes&site=${s}&filter=withbody&pagesize=${sizeArg(limit)}`)
  const rows = items(d)
  if (rows.length === 0) return `Question ${id} on ${s} has no answers yet.`
  const blocks = rows.map((a, i) => {
    const accepted = a.is_accepted ? " · accepted" : ""
    return `Answer ${i + 1} [${a.score ?? 0} votes${accepted}] by ${a.owner?.display_name ?? "unknown"}:\n${stripHtml(a.body).slice(0, 1200)}`
  })
  return [`Answers to question ${id} on ${s} (${rows.length}):`, "", ...blocks].join("\n\n")
}

export async function userProfile(userId: number, site = "stackoverflow"): Promise<string> {
  const id = idArg(userId)
  const s = siteArg(site)
  const d = await getJson(`/users/${id}?site=${s}`)
  const u = items(d)[0]
  if (!u) throw new StackExchangeError(`No user ${id} on ${s}`)
  const badges = u.badge_counts ?? {}
  return [
    `${u.display_name ?? "unknown"} (user ${u.user_id}) on ${s}`,
    `Reputation: ${Number(u.reputation ?? 0).toLocaleString("en-US")}`,
    `Badges: ${badges.gold ?? 0} gold · ${badges.silver ?? 0} silver · ${badges.bronze ?? 0} bronze`,
    u.location ? `Location: ${u.location}` : "",
    u.creation_date ? `Member since ${new Date(Number(u.creation_date) * 1000).toISOString().slice(0, 10)}` : "",
    u.link ? `Profile: ${u.link}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
