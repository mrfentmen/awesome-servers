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
  /** Workable names these fields subregion/countryName, not region/country. */
  location?: { city?: string | null; subregion?: string | null; countryName?: string | null }
  /** Pre-formatted place strings, e.g. "Billings, Montana, United States". */
  locations?: string[]
  /** on_site | remote | hybrid — this is a job field, not part of location. */
  workplace?: string | null
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

const WORKPLACE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  on_site: "On-site",
}

const where = (j: ApiJob): string => {
  const listed = (j.locations ?? []).find((entry) => typeof entry === "string" && entry.trim())
  const parts = [j.location?.city, j.location?.subregion, j.location?.countryName].filter(
    (p) => typeof p === "string" && p.trim()
  ) as string[]
  const place = listed?.trim() ?? (parts.length ? parts.join(", ") : "location n/a")
  const kind = j.workplace ? WORKPLACE_LABEL[j.workplace] ?? j.workplace : ""
  return kind ? `${place} (${kind})` : place
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
    where(j),
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

export interface SearchArgs {
  query?: string
  location?: string
  limit?: number
  /** on_site | remote | hybrid. Workable filters this server-side. */
  workplace?: string
}

const WORKPLACES = ["remote", "hybrid", "on_site"]

function searchParams(args: SearchArgs): URLSearchParams {
  const p = new URLSearchParams()
  const q = (args.query ?? "").trim()
  const loc = (args.location ?? "").trim()
  if (q) p.set("query", q)
  if (loc) p.set("location", loc)
  const mode = (args.workplace ?? "").trim().toLowerCase()
  if (WORKPLACES.includes(mode)) p.set("workplace", mode)
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
      where(j),
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
  const places = tally(jobs.map((j) => [j.location?.city, j.location?.countryName].filter(Boolean).join(", ")))
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

/** Only remote (or hybrid) roles, using Workable's own workplace filter. */
export async function remoteJobs(args: { query?: string; location?: string; workplace?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  const loc = (args.location ?? "").trim()
  const mode = (args.workplace ?? "remote").trim().toLowerCase()
  if (!WORKPLACES.includes(mode)) {
    return `workplace must be one of: ${WORKPLACES.join(", ")}.`
  }
  if (!q && !loc) return "Give a query, a location, or both — e.g. query 'designer', workplace 'remote'."
  const d = await query(searchParams({ query: q, location: loc, workplace: mode, limit: args.limit }))
  const jobs = Array.isArray(d.jobs) ? d.jobs : []
  if (!jobs.length) {
    return `No Workable ${mode} jobs${q ? ` for "${q}"` : ""}${loc ? ` in ${loc}` : ""}.`
  }
  return (
    `Workable ${mode} jobs${q ? ` for "${q}"` : ""}${loc ? ` in ${loc}` : ""}: ` +
    `${(d.totalSize ?? jobs.length).toLocaleString()} total, showing ${jobs.length}\n\n` +
    jobs.map(line).join("\n\n")
  )
}

/**
 * Workable's search results are not ordered by date, so this sorts them. The
 * search endpoint returns at most 20 rows per call, so this ranks the newest
 * among the roles the query matched, not the newest on the whole site.
 */
export async function recentJobs(args: { query?: string; location?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  const loc = (args.location ?? "").trim()
  if (!q && !loc) return "Give a query or a location so the sample is relevant — e.g. query 'product manager'."
  const limit = Math.min(Math.max(args.limit ?? 10, 1), 20)
  const d = await query(searchParams({ query: q, location: loc, limit: 20 }))
  const jobs = Array.isArray(d.jobs) ? d.jobs : []
  if (!jobs.length) return `No Workable jobs match${q ? ` "${q}"` : ""}${loc ? ` in ${loc}` : ""}.`
  const dated = jobs.filter((job) => job.created && Number.isFinite(Date.parse(job.created)))
  if (!dated.length) return "Workable returned no posting dates for this query."
  const ranked = [...dated].sort((a, b) => Date.parse(b.created as string) - Date.parse(a.created as string))
  const oldest = Date.parse(dated.reduce((a, b) => (Date.parse(a.created as string) <= Date.parse(b.created as string) ? a : b)).created as string)
  return (
    `Newest Workable jobs${q ? ` for "${q}"` : ""}${loc ? ` in ${loc}` : ""} — ` +
    `${ranked.length} dated role(s) of ${jobs.length} sampled, ${(d.totalSize ?? jobs.length).toLocaleString()} total matched:\n\n` +
    ranked.slice(0, limit).map(line).join("\n\n") +
    `\nOldest role in this sample was posted ${Math.floor((Date.now() - oldest) / 86400000)} day(s) ago, ` +
    `because Workable returns only 20 rows per search and not in date order.`
  )
}
// ---- batch-5 tools: query demand, one employer's roles, workplace split (2026-09-27) ----

/**
 * Open-role counts for several searches side by side. Each count is the API's
 * own total, which is the only way to compare demand without paging.
 */
export async function compareQueries(args: { queries: string[]; location?: string }): Promise<string> {
  const wanted = (args.queries ?? []).map((q) => String(q).trim()).filter(Boolean)
  if (wanted.length < 2) throw new Error("Give at least two queries to compare, e.g. ['rust', 'go'].")
  if (wanted.length > 5) throw new Error("Compare at most five queries at a time.")
  const rows = await Promise.all(
    wanted.map(async (term) => {
      const d = await query(searchParams({ query: term, location: args.location, limit: 1 }))
      return { query: term, total: d.totalSize ?? 0 }
    })
  )
  const ranked = [...rows].sort((a, b) => b.total - a.total)
  const top = ranked[0].total
  const bottom = ranked[ranked.length - 1]
  return [
    `Open Workable roles${args.location ? ` in ${args.location}` : ""}`,
    "",
    ...ranked.map((row, i) => `  ${i + 1}. ${row.query} — ${row.total.toLocaleString()} role(s)${top > 0 && row.total < top ? ` (${Math.round((row.total / top) * 100)}% of ${ranked[0].query})` : ""}`),
    "",
    top > 0
      ? `${ranked[0].query} has ${(top / Math.max(bottom.total, 1)).toFixed(1)}x the openings of ${bottom.query}.`
      : "None of these searches has open roles right now.",
    "Counts are the API's own totals for the whole market, not a sample.",
  ].join("\n")
}

/**
 * Every open role from one employer, found through the market search and then
 * filtered to that company, which the text search alone cannot do.
 */
export async function companyOpenings(args: { company: string; query?: string; limit?: number }): Promise<string> {
  const company = (args.company ?? "").trim()
  if (company.length < 2) throw new Error("Give a company name, e.g. 'Stripe'.")
  const q = (args.query ?? "").trim() || company
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 20)
  const d = await query(searchParams({ query: q, limit: 20 }))
  const jobs = (Array.isArray(d.jobs) ? d.jobs : []).filter((j) => (j.company?.title ?? "").toLowerCase().includes(company.toLowerCase()))
  if (!jobs.length) {
    return `No role from "${company}" appears in a sample of ${(d.totalSize ?? 0).toLocaleString()} result(s) for "${q}". Try a broader query, or the company's board slug with company_jobs.`
  }
  const workplaces = jobs.reduce<Record<string, number>>((acc, j) => {
    const mode = (j.workplace ?? "unstated").toLowerCase()
    acc[mode] = (acc[mode] ?? 0) + 1
    return acc
  }, {})
  return [
    `${company} on Workable: ${jobs.length} role(s) in the sampled page (${(d.totalSize ?? 0).toLocaleString()} result(s) for "${q}")`,
    `  workplace mix: ${Object.entries(workplaces).map(([mode, n]) => `${mode} ${n}`).join(", ")}`,
    "",
    ...jobs.slice(0, limit).map((j, i) => `${i + 1}. ${j.title ?? "?"} — ${where(j)} | ${j.employmentType ?? "?"}${j.department ? ` | ${j.department}` : ""}\n   ${j.url ?? j.company?.url ?? ""}`),
    jobs.length > limit ? `\nShowing ${limit} of ${jobs.length}.` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * How a market splits between remote, hybrid and on-site work, from the API's
 * own workplace filter rather than from the fields of one page of results.
 */
export async function workplaceSplit(args: { query: string; location?: string }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new Error("Give a query, e.g. 'product manager'.")
  const counts = await Promise.all(
    WORKPLACES.map(async (mode) => {
      const d = await query(searchParams({ query: q, location: args.location, workplace: mode, limit: 1 }))
      return { mode, total: d.totalSize ?? 0 }
    })
  )
  const total = counts.reduce((sum, row) => sum + row.total, 0)
  if (!total) return `No Workable role matches "${q}"${args.location ? ` in ${args.location}` : ""}.`
  return [
    `Workplace split for "${q}"${args.location ? ` in ${args.location}` : ""}: ${total.toLocaleString()} role(s)`,
    "",
    ...counts
      .sort((a, b) => b.total - a.total)
      .map((row) => `  ${row.mode.padEnd(8)} ${row.total.toLocaleString().padStart(8)}  ${Math.round((row.total / total) * 100)}%`),
    "",
    `${Math.round((Math.max(...counts.map((row) => row.total)) / total) * 100)}% of the market sits in the largest bucket.`,
    "Each figure is the API's own total for that filter, so the three are independent counts, not a sample.",
  ].join("\n")
}
