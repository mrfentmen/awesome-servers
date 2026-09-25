const UA = "mrfentmen-workable-mcp/1.0 (https://github.com/mrfentmen)"
const SEARCH = "https://jobs.workable.com/api/v1/jobs"
const WIDGET = "https://apply.workable.com/api/v1/widget/accounts"

export class WorkableError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new WorkableError(`Not found (404): ${url}`)
  if (!res.ok) throw new WorkableError(`Workable returned ${res.status}`)
  return (await res.json()) as T
}

interface ApiJob {
  id?: string
  title?: string
  created?: string
  employmentType?: string
  department?: string
  url?: string
  description?: string
  company?: { title?: string; website?: string; url?: string }
  location?: { city?: string | null; country?: string | null; region?: string | null; workplace?: string | null }
}

interface SearchResponse {
  totalSize?: number
  nextPageToken?: string
  jobs?: ApiJob[]
}

/** Job descriptions arrive as HTML; keep the text, drop the markup. */
function plain(html: unknown, max = 1200): string {
  const raw = typeof html === "string" ? html : ""
  const clean = raw
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

const where = (l?: ApiJob["location"]): string => {
  const parts = [l?.city, l?.region, l?.country].filter((p) => typeof p === "string" && p.trim()) as string[]
  const place = parts.length ? parts.join(", ") : "location n/a"
  return l?.workplace ? `${place} (${l.workplace})` : place
}

const since = (created?: string): string => {
  if (!created) return ""
  const days = Math.floor((Date.now() - Date.parse(created)) / 86400000)
  if (!Number.isFinite(days)) return ""
  if (days <= 0) return "today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

function line(j: ApiJob, i: number): string {
  const meta = [
    j.company?.title,
    where(j.location),
    j.employmentType,
    since(j.created),
    j.department ? `dept: ${j.department}` : "",
  ].filter(Boolean)
  return `${i + 1}. ${j.title ?? "Untitled"} — ${meta.join(" | ")}\n   ${j.url ?? ""}\n   id: ${j.id ?? "?"}`
}

let lastTotal = 0

async function query(search: URLSearchParams): Promise<SearchResponse> {
  const d = await getJson<SearchResponse>(`${SEARCH}?${search.toString()}`)
  if (typeof d?.totalSize === "number") lastTotal = d.totalSize
  return d
}

function searchParams(args: { query?: string; location?: string; limit?: number }): URLSearchParams {
  const p = new URLSearchParams()
  const q = (args.query ?? "").trim()
  const loc = (args.location ?? "").trim()
  if (q) p.set("query", q)
  if (loc) p.set("location", loc)
  // The Workable search API rejects limit > 20 with a 400.
  p.set("limit", String(Math.min(Math.max(args.limit ?? 10, 1), 20)))
  return p
}

export async function searchJobs(args: { query?: string; location?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  const loc = (args.location ?? "").trim()
  if (!q && !loc) return "Give a query, a location, or both — e.g. query 'data engineer', location 'Berlin'."
  const d = await query(searchParams(args))
  const jobs = Array.isArray(d.jobs) ? d.jobs : []
  if (!jobs.length) return `No Workable jobs match${q ? ` "${q}"` : ""}${loc ? ` in ${loc}` : ""}.`
  const desc = `Workable jobs${q ? ` for "${q}"` : ""}${loc ? ` in ${loc}` : ""}: ${(d.totalSize ?? jobs.length).toLocaleString()} total, showing ${jobs.length}`
  return `${desc}\n\n${jobs.map(line).join("\n\n")}`
}

export async function jobDetail(args: { job_id: string }): Promise<string> {
  const id = (args.job_id ?? "").trim()
  if (!id) return "Provide a job_id from search_jobs."
  const j = await getJson<ApiJob>(`${SEARCH}/${encodeURIComponent(id)}`)
  if (!j?.title) return `No job found with id ${id}.`
  const lines = [
    `${j.title}`,
    [
      j.company?.title,
      where(j.location),
      j.employmentType,
      since(j.created),
    ].filter(Boolean).join(" | "),
  ]
  if (j.company?.website) lines.push(`Company site: ${j.company.website}`)
  if (j.company?.url) lines.push(`Company page: ${j.company.url}`)
  if (j.url) lines.push(`Apply: ${j.url}`)
  const body = plain(j.description, 2500)
  if (body) lines.push("", body)
  return lines.join("\n")
}

export async function companyJobs(args: { board: string; limit?: number }): Promise<string> {
  const board = (args.board ?? "").trim().toLowerCase()
  if (!board) return "Provide a company board slug, e.g. 'stealth-it'."
  const d = await getJson<{
    name?: string
    description?: string | null
    jobs?: Array<{ title?: string; shortlink?: string; city?: string; country?: string; department?: string; employment_type?: string }>
  }>(`${WIDGET}/${encodeURIComponent(board)}?details=true`)
  const jobs = Array.isArray(d.jobs) ? d.jobs : []
  const head = `${d.name ?? board}${d.description ? ` — ${plain(d.description, 200)}` : ""}`
  if (!jobs.length) return `${head}\nNo open roles on this board.`
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 50)
  return (
    `${head}\n${jobs.length} open role(s), showing ${Math.min(jobs.length, limit)}:\n` +
    jobs
      .slice(0, limit)
      .map((j, i) => {
        const meta = [j.department, j.employment_type, [j.city, j.country].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join(" | ")
        return `${i + 1}. ${j.title ?? "?"}${meta ? ` — ${meta}` : ""}\n   ${j.shortlink ?? ""}`
      })
      .join("\n")
  )
}

/** Companies hiring for a keyword — useful for prospecting and outreach lists. */
export async function companies(args: { query: string; location?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) return "Provide a query, e.g. 'rust developer'."
  const limit = Math.min(Math.max(args.limit ?? 15, 1), 20)
  // Pull a wider sample than we display so the company counts are meaningful.
  const d = await query(searchParams({ query: q, location: args.location, limit: 20 }))
  const jobs = Array.isArray(d.jobs) ? d.jobs : []
  if (!jobs.length) return `No Workable jobs match "${q}".`
  const counts = new Map<string, { n: number; site?: string }>()
  for (const j of jobs) {
    const name = j.company?.title?.trim()
    if (!name) continue
    const cur = counts.get(name) ?? { n: 0, site: j.company?.website }
    cur.n += 1
    counts.set(name, cur)
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, limit)
  return (
    `Companies hiring for "${q}" (from ${jobs.length} sampled roles, ${(d.totalSize ?? jobs.length).toLocaleString()} total):\n` +
    ranked.map(([name, v], i) => `${i + 1}. ${name} — ${v.n} role(s)${v.site ? ` | ${v.site}` : ""}`).join("\n")
  )
}

/** Rough shape of the market for a keyword: hiring companies, locations and contract types. */
export async function marketSummary(args: { query: string; location?: string }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) return "Provide a query, e.g. 'product manager'."
  const d = await query(searchParams({ query: q, location: args.location, limit: 20 }))
  const jobs = Array.isArray(d.jobs) ? d.jobs : []
  if (!jobs.length) return `No Workable jobs match "${q}".`

  const tally = (values: string[]) => {
    const m = new Map<string, number>()
    for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }

  const types = tally(jobs.map((j) => j.employmentType ?? ""))
  const places = tally(jobs.map((j) => [j.location?.city, j.location?.country].filter(Boolean).join(", ")))
  const firms = tally(jobs.map((j) => j.company?.title ?? ""))
  const depts = tally(jobs.map((j) => j.department ?? ""))

  const block = (label: string, rows: [string, number][]) =>
    rows.length ? `${label}:\n${rows.map(([k, v]) => `  ${k} — ${v}`).join("\n")}` : ""

  return [
    `Workable market for "${q}"${args.location ? ` in ${args.location}` : ""}: ${(d.totalSize ?? jobs.length).toLocaleString()} open roles (sampled ${jobs.length}).`,
    "",
    block("Top employers", firms),
    block("Top locations", places),
    block("Contract types", types),
    block("Departments", depts),
  ]
    .filter((s) => s !== "")
    .join("\n")
}
