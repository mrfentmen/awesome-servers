const UA = "mrfentmen-job-search-mcp/1.0"

type Row = Record<string, unknown>

export class JobSearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "JobSearchError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const clamp = (value: number | undefined, fallback: number, max = 50) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max)

const truncate = (value: string, max = 3800) =>
  value.length <= max ? value : `${value.slice(0, max)}\n… (truncated)`

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined

/** HN sends ids as numbers in some endpoints and strings in others. */
const asId = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : ""

const arr = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : [])

const names = (value: unknown, field: string): string =>
  arr(value)
    .map((row) => str(row[field]))
    .filter(Boolean)
    .join(", ")

const entity = (raw: string, code: number): string =>
  Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : raw

/** Minimal HTML entity decode — feeds send escaped markup, not entities we control. */
const decode = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (raw: string, hex: string) =>
      entity(raw, Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (raw: string, dec: string) => entity(raw, Number(dec)))

const stripHtml = (value: string): string =>
  decode(value)
    .replace(/<p>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim()

async function getJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new JobSearchError(`Network error: ${errorMessage(e)}`)
  }
  if (!res.ok) throw new JobSearchError(`${new URL(url).host} returned ${res.status}`)
  return (await res.json()) as T
}

export interface Job {
  title: string
  company: string
  location: string
  url: string
  source: string
  posted?: string
  type?: string
  salary?: string
  /** Raw pay figures, kept alongside the label so salary_insights can aggregate. */
  salaryLow?: number
  salaryHigh?: number
  salaryCurrency?: string
  salaryPeriod?: string
  tags: string[]
}

export interface Query {
  query?: string
  location?: string
  limit: number
}

const matches = (job: Job, query?: string, location?: string): boolean => {
  const terms = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean)
  const haystack = [job.title, job.company, job.location, job.type ?? "", ...job.tags]
    .join(" ")
    .toLowerCase()
  if (terms.length && !terms.every((term) => haystack.includes(term))) return false
  const places = (location ?? "").trim().toLowerCase()
  if (!places) return true
  return places.split(/\s+/).every((part) => job.location.toLowerCase().includes(part))
}

const sortNewest = (jobs: Job[]): Job[] =>
  [...jobs].sort((a, b) => {
    const left = a.posted ? Date.parse(a.posted) : 0
    const right = b.posted ? Date.parse(b.posted) : 0
    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left)
  })

// Some boards (RemoteOK) send 0 rather than omitting pay they do not know, so a
// zero must be read as "not disclosed" instead of a salary.
const pay = (value: unknown): number | undefined => {
  const parsed = num(value)
  return parsed !== undefined && parsed > 0 ? parsed : undefined
}

const salaryLabel = (min: unknown, max: unknown, currency: unknown, period: unknown): string | undefined => {
  const low = pay(min)
  const high = pay(max)
  if (low === undefined && high === undefined) return undefined
  const symbol = str(currency) || "USD"
  const every = str(period)
  const format = (value: number) => value.toLocaleString("en-US")
  const range = low !== undefined && high !== undefined ? `${format(low)}-${format(high)}` : format((low ?? high) as number)
  return `${symbol} ${range}${every ? `/${every}` : ""}`.trim()
}

async function fromJobicy(opts: Query): Promise<Job[]> {
  const params = new URLSearchParams({ count: String(Math.min(Math.max(opts.limit * 3, 10), 50)) })
  const query = (opts.query ?? "").trim()
  if (query) params.set("tag", query.split(/\s+/)[0])
  if (opts.location) params.set("geo", opts.location.split(/\s+/)[0])
  const data = await getJson<{ jobs?: unknown }>(`https://jobicy.com/api/v2/remote-jobs?${params.toString()}`)
  return arr(data.jobs).map((j) => ({
    title: str(j.jobTitle),
    company: str(j.companyName),
    location: str(j.jobGeo),
    url: str(j.url),
    source: "Jobicy",
    posted: str(j.pubDate),
    type: Array.isArray(j.jobType) ? (j.jobType as unknown[]).map(str).filter(Boolean).join("/") : str(j.jobType),
    salary: salaryLabel(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod),
    salaryLow: pay(j.salaryMin),
    salaryHigh: pay(j.salaryMax),
    salaryCurrency: str(j.salaryCurrency) || undefined,
    salaryPeriod: str(j.salaryPeriod) || undefined,
    tags: [str(j.jobIndustry), ...arr(j.jobType).map(String)].filter(Boolean),
  }))
}

async function fromArbeitnow(opts: Query): Promise<Job[]> {
  const data = await getJson<{ data?: unknown }>("https://www.arbeitnow.com/api/job-board-api")
  return arr(data.data)
    .map((j) => ({
      title: str(j.title),
      company: str(j.company_name),
      location: str(j.location) || (j.remote === true ? "Remote" : ""),
      url: str(j.url),
      source: "Arbeitnow",
      posted: str(j.created_at),
      type: Array.isArray(j.job_types) ? (j.job_types as unknown[]).map(str).filter(Boolean).join("/") : "",
      tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(str).filter(Boolean) : [],
    }))
    .filter((job) => matches(job, opts.query, opts.location))
}

async function fromRemoteOk(opts: Query): Promise<Job[]> {
  // The first element of the feed is a legal notice, not a job.
  const data = await getJson<unknown>("https://remoteok.com/api")
  return arr(data)
    .filter((j) => str(j.position))
    .map((j) => ({
      title: str(j.position),
      company: str(j.company),
      location: str(j.location) || "Remote",
      url: str(j.url) || str(j.apply_url),
      source: "RemoteOK",
      posted: str(j.date),
      salary: salaryLabel(j.salary_min, j.salary_max, undefined, "year"),
      salaryLow: pay(j.salary_min),
      salaryHigh: pay(j.salary_max),
      salaryCurrency: pay(j.salary_min) !== undefined || pay(j.salary_max) !== undefined ? "USD" : undefined,
      salaryPeriod: "year",
      tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(str).filter(Boolean) : [],
    }))
    .filter((job) => matches(job, opts.query, opts.location))
}

async function fromTheMuse(opts: Query): Promise<Job[]> {
  const pages = Math.min(Math.max(Math.ceil(opts.limit / 20), 1), 3)
  const jobs: Job[] = []
  for (let page = 1; page <= pages; page += 1) {
    const params = new URLSearchParams({ page: String(page) })
    if (opts.location) params.set("location", opts.location)
    const data = await getJson<{ results?: unknown }>(
      `https://www.themuse.com/api/public/jobs?${params.toString()}`
    )
    for (const j of arr(data.results)) {
      const company = j.company as Row | undefined
      const refs = j.refs as Row | undefined
      jobs.push({
        title: str(j.name),
        company: str((company ?? {}).name),
        location: names(j.locations, "name"),
        url: str((refs ?? {}).landing_page),
        source: "The Muse",
        posted: str(j.publication_date),
        type: names(j.levels, "name"),
        tags: arr(j.categories).map((c) => str(c.name)).filter(Boolean),
      })
    }
  }
  return jobs.filter((job) => matches(job, opts.query, undefined))
}

async function fromRemotive(opts: Query): Promise<Job[]> {
  // Remotive now ignores search/category/limit, so filter the feed ourselves.
  const data = await getJson<{ jobs?: unknown }>("https://remotive.com/api/remote-jobs")
  return arr(data.jobs)
    .map((j) => ({
      title: str(j.title),
      company: str(j.company_name),
      location: str(j.candidate_required_location),
      url: str(j.url),
      source: "Remotive",
      posted: str(j.publication_date),
      type: str(j.job_type),
      salary: str(j.salary) || undefined,
      tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(str).filter(Boolean) : [],
    }))
    .filter((job) => matches(job, opts.query, opts.location))
}

async function fromHackerNews(opts: Query): Promise<Job[]> {
  const stories = await getJson<{ hits?: unknown }>(
    "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10"
  )
  const thread = arr(stories.hits).find((hit) =>
    str(hit.title).startsWith("Ask HN: Who is hiring?")
  )
  if (!thread) throw new JobSearchError("Could not find the latest Hacker News hiring thread")
  const threadId = str(thread.objectID)

  const params = new URLSearchParams({ tags: `comment,story_${threadId}`, hitsPerPage: "50" })
  const query = (opts.query ?? "").trim()
  if (query) params.set("query", query)
  const comments = await getJson<{ hits?: unknown }>(
    `https://hn.algolia.com/api/v1/search?${params.toString()}`
  )

  return arr(comments.hits)
    // Only top-level comments in the thread are job postings; replies are
    // discussion, which is why filtering on the text alone lets noise through.
    .filter((hit) => asId(hit.parent_id) === threadId)
    .map((hit) => {
      const text = stripHtml(str(hit.comment_text))
      const headline = (text.split("\n")[0] ?? "").trim().slice(0, 180)
      return {
        title: headline,
        company: headline.split("|")[0]?.trim() ?? "",
        location: "",
        url: `https://news.ycombinator.com/item?id=${str(hit.objectID)}`,
        source: "Hacker News",
        posted: str(hit.created_at),
        tags: [],
      }
    })
    .filter((job) => job.title.length > 12)
    .filter((job) => matches(job, query, undefined))
}

export interface Board {
  id: string
  name: string
  supportsQuery: boolean
  fetch: (opts: Query) => Promise<Job[]>
}

export const BOARDS: Board[] = [
  { id: "jobicy", name: "Jobicy", supportsQuery: true, fetch: fromJobicy },
  { id: "arbeitnow", name: "Arbeitnow", supportsQuery: false, fetch: fromArbeitnow },
  { id: "remoteok", name: "RemoteOK", supportsQuery: false, fetch: fromRemoteOk },
  { id: "themuse", name: "The Muse", supportsQuery: false, fetch: fromTheMuse },
  { id: "remotive", name: "Remotive", supportsQuery: false, fetch: fromRemotive },
  { id: "hn", name: "Hacker News", supportsQuery: true, fetch: fromHackerNews },
]

function selectBoards(boards?: string): Board[] {
  const wanted = (boards ?? "").trim()
  if (!wanted) return BOARDS
  const ids = wanted.split(",").map((id) => id.trim().toLowerCase()).filter(Boolean)
  const known = ids.filter((id) => BOARDS.some((board) => board.id === id))
  if (!known.length) {
    throw new JobSearchError(`boards must be a comma-separated subset of: ${BOARDS.map((b) => b.id).join(", ")}`)
  }
  return BOARDS.filter((board) => known.includes(board.id))
}

const dedupe = (jobs: Job[]): Job[] => {
  const seen = new Set<string>()
  const out: Job[] = []
  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(job)
  }
  return out
}

interface Harvest {
  jobs: Job[]
  failures: string[]
  searched: string[]
}

async function collect(opts: Query, boards?: string): Promise<Harvest> {
  const selected = selectBoards(boards)
  const settled = await Promise.allSettled(selected.map((board) => board.fetch(opts)))
  const jobs: Job[] = []
  const failures: string[] = []
  const searched: string[] = []
  settled.forEach((result, i) => {
    const board = selected[i]
    searched.push(board.name)
    if (result.status === "fulfilled") jobs.push(...result.value)
    else failures.push(`${board.name} (${errorMessage(result.reason)})`)
  })
  return { jobs, failures, searched }
}

function render(jobs: Job[], limit: number): string {
  return jobs
    .slice(0, limit)
    .map((job, i) => {
      const bits = [job.company, job.location, job.type, job.salary].filter(Boolean)
      const lines = [`${i + 1}. ${job.title}${bits.length ? ` — ${bits.join(" | ")}` : ""}`]
      if (job.url) lines.push(`   ${job.url}`)
      if (job.posted) lines.push(`   ${job.source}, posted ${job.posted.slice(0, 10)}`)
      return lines.join("\n")
    })
    .join("\n")
}

const header = (harvest: Harvest, found: number, limit: number): string => {
  const shown = Math.min(found, limit)
  const lines = [
    `Searched ${harvest.searched.length} job boards (${harvest.searched.join(", ")}).`,
    `${found} matching job(s), showing ${shown} across ${harvest.searched.length} board(s).`,
  ]
  if (harvest.failures.length) lines.push(`Unreachable: ${harvest.failures.join("; ")}`)
  return lines.join("\n")
}

export interface SearchArgs {
  query?: string
  location?: string
  boards?: string
  limit?: number
}

export async function searchJobs(args: SearchArgs = {}): Promise<string> {
  const limit = clamp(args.limit, 10, 50)
  const harvest = await collect({ query: args.query, location: args.location, limit }, args.boards)
  const jobs = sortNewest(dedupe(harvest.jobs))
  if (!jobs.length) {
    return `${header(harvest, 0, limit)}\nNothing matched. Try a broader query, drop the location, or use latest_jobs.`
  }
  return truncate(`${header(harvest, jobs.length, limit)}\n\n${render(jobs, limit)}`)
}

export async function latestJobs(args: SearchArgs = {}): Promise<string> {
  const limit = clamp(args.limit, 10, 50)
  const harvest = await collect({ query: undefined, location: args.location, limit }, args.boards)
  const jobs = sortNewest(dedupe(harvest.jobs)).filter((job) => job.posted)
  if (!jobs.length) return `${header(harvest, 0, limit)}\nNo dated postings came back.`
  return truncate(`${header(harvest, jobs.length, limit)}\nNewest first:\n\n${render(jobs, limit)}`)
}

export interface BoardArgs {
  board: string
  query?: string
  location?: string
  limit?: number
}

export async function jobsByBoard(args: BoardArgs): Promise<string> {
  const id = args.board.trim().toLowerCase()
  const board = BOARDS.find((b) => b.id === id || b.name.toLowerCase() === id)
  if (!board) throw new JobSearchError(`board must be one of: ${BOARDS.map((b) => b.id).join(", ")}`)
  const limit = clamp(args.limit, 10, 50)
  const jobs = sortNewest(dedupe(await board.fetch({ query: args.query, location: args.location, limit })))
  const note = board.supportsQuery
    ? `${board.name} filters server-side.`
    : `${board.name} has no search parameter, so results are filtered locally over the latest postings.`
  if (!jobs.length) return `${board.name}: no jobs matched. ${note}`
  return truncate(`${board.name}: ${jobs.length} matching job(s), showing ${Math.min(jobs.length, limit)}. ${note}\n\n${render(jobs, limit)}`)
}

export interface CompanyArgs {
  company: string
  boards?: string
  limit?: number
}

export async function companyJobs(args: CompanyArgs): Promise<string> {
  const needle = args.company.trim().toLowerCase()
  if (!needle) throw new JobSearchError("company is required")
  const limit = clamp(args.limit, 10, 50)
  const harvest = await collect({ query: undefined, location: undefined, limit }, args.boards)
  const jobs = sortNewest(
    dedupe(harvest.jobs.filter((job) => job.company.toLowerCase().includes(needle)))
  )
  if (!jobs.length) {
    return `${header(harvest, 0, limit)}\nNo posting from a company matching "${args.company}". Note most boards expose only their latest postings, so older roles may be missing.`
  }
  return truncate(`${header(harvest, jobs.length, limit)}\n\n${render(jobs, limit)}`)
}

export async function jobCategories(): Promise<string> {
  const lines = BOARDS.map((board) => {
    const capability = board.supportsQuery
      ? "keyword search server-side"
      : "no keyword parameter — filtered locally over latest postings"
    return `- ${board.name} (boards: "${board.id}") — ${capability}`
  })
  return truncate(
    [
      "This server aggregates six job boards, so there is no single shared category taxonomy. Use search_jobs for keywords, jobs_by_board to target one board, and these ids with the `boards` argument:",
      ...lines,
      "",
      "The Muse also accepts a location, and Jobicy accepts a location plus an industry tag.",
    ].join("\n")
  )
}

/** Only USD/year figures can be compared, so everything else is reported separately. */
const midpoint = (job: Job): number => {
  const low = job.salaryLow ?? job.salaryHigh ?? 0
  const high = job.salaryHigh ?? job.salaryLow ?? 0
  return (low + high) / 2
}

// RemoteOK occasionally labels an hourly rate as an annual field, which shows up
// as a three figure "salary". Nothing under this floor is a real annual figure.
const ANNUAL_FLOOR = 1000

const comparablePay = (job: Job): boolean =>
  (job.salaryLow !== undefined || job.salaryHigh !== undefined) &&
  (job.salaryCurrency ?? "USD").toUpperCase() === "USD" &&
  /year|annual/i.test(job.salaryPeriod ?? "year") &&
  midpoint(job) >= ANNUAL_FLOOR

const money = (value: number) => `USD ${Math.round(value).toLocaleString("en-US")}`

export interface SalaryArgs {
  query?: string
  boards?: string
  limit?: number
}

export async function salaryInsights(args: SalaryArgs = {}): Promise<string> {
  const limit = clamp(args.limit, 10, 50)
  const harvest = await collect({ query: args.query, location: undefined, limit }, args.boards)
  const paid = harvest.jobs.filter((job) => job.salaryLow !== undefined || job.salaryHigh !== undefined)
  const usable = paid.filter(comparablePay)
  if (!usable.length) {
    return `${header(harvest, paid.length, limit)}\n` +
      `Only ${paid.length} job(s) published pay, and none in a comparable USD-per-year form, so no average can be computed. ` +
      `RemoteOK and Jobicy are the boards that carry salary figures.`
  }

  const values = usable.map(midpoint).sort((a, b) => a - b)
  const median = values.length % 2
    ? values[(values.length - 1) / 2]
    : (values[values.length / 2 - 1] + values[values.length / 2]) / 2
  const byBoard = new Map<string, number>()
  for (const job of usable) byBoard.set(job.source, (byBoard.get(job.source) ?? 0) + 1)

  const top = [...usable].sort((a, b) => midpoint(b) - midpoint(a)).slice(0, Math.min(limit, 10))
  const lines = top.map((job, i) => {
    const bits = [job.company, job.location].filter(Boolean).join(" | ")
    return `${i + 1}. ${job.title}${bits ? ` — ${bits}` : ""}\n   ${job.salary} (${job.source})`
  })

  const skipped = paid.length - usable.length
  return truncate(
    [
      `Salary insights for ${args.query ? `"${args.query}"` : "all recent postings"} across ${harvest.searched.length} board(s).`,
      `${harvest.jobs.length} posting(s) scanned; ${paid.length} published pay, ${usable.length} comparable (${skipped} skipped as non-USD or non-annual).`,
      ``,
      `Lowest midpoint: ${money(values[0])}`,
      `Median midpoint: ${money(median)}`,
      `Highest midpoint: ${money(values[values.length - 1])}`,
      `Boards contributing pay data: ${[...byBoard.entries()].map(([name, n]) => `${name} (${n})`).join(", ")}`,
      ``,
      `Best paying matches:`,
      ...lines,
      harvest.failures.length ? `Unreachable: ${harvest.failures.join("; ")}` : "",
      `Figures are midpoints of each posting's own quoted range, and represent only the jobs that disclosed pay.`,
    ]
      .filter(Boolean)
      .join("\n")
  )
}

export interface CoverageArgs {
  query?: string
  location?: string
}

export async function boardCoverage(args: CoverageArgs = {}): Promise<string> {
  const probe = await Promise.all(
    BOARDS.map(async (board) => {
      try {
        const jobs = await board.fetch({ query: args.query, location: args.location, limit: 50 })
        return { board, count: jobs.length, ok: true, error: "" }
      } catch (e) {
        return { board, count: 0, ok: false, error: errorMessage(e) }
      }
    })
  )
  const total = probe.reduce((sum, row) => sum + row.count, 0)
  const live = probe.filter((row) => row.ok).length
  const lines = probe
    .sort((a, b) => b.count - a.count)
    .map((row, i) => {
      const how = row.board.supportsQuery ? "server-side keyword filter" : "filtered locally over latest postings"
      const detail = row.ok ? `${row.count} job(s) — ${how}` : `unreachable — ${row.error}`
      return `  ${i + 1}. ${row.board.name} [${row.board.id}]: ${detail}`
    })
  return truncate(
    [
      `Board coverage for ${args.query ? `"${args.query}"` : "an unfiltered pull"}${args.location ? ` in "${args.location}"` : ""}:`,
      `${total} job(s) across ${live} of ${BOARDS.length} reachable board(s).`,
      ...lines,
      ``,
      "Pass these ids to the `boards` argument of search_jobs, jobs_by_board or company_jobs. Counts are board-declared result sizes, so boards with a large feed naturally rank higher.",
    ].join("\n")
  )
}
