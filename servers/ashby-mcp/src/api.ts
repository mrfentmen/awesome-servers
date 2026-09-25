/**
 * Ashby public posting API client, keyless.
 * Docs: https://developers.ashbyhq.com/docs/posting-api
 */
const BASE = "https://api.ashbyhq.com/posting-api"

export class AshbyError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "ashby-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new AshbyError("No such organization board. Check the slug (e.g. 'ashby').")
  if (!res.ok) throw new AshbyError(`Ashby error ${res.status}`)
  return (await res.json()) as T
}

export interface Job {
  id: string
  title?: string
  department?: string
  location?: string
  type?: string
  url?: string
}

export async function listJobs(org: string, limit = 10): Promise<Job[]> {
  if (!/^[A-Za-z0-9-]+$/.test(org.trim())) throw new AshbyError(`Not an org slug: "${org}".`)
  const data = await getJson<Raw>(`/job-board/${encodeURIComponent(org.trim())}`)
  const rows: Raw[] = Array.isArray(data.jobs) ? data.jobs : []
  return rows.slice(0, limit).map((j) => ({
    id: String(j.id),
    title: j.title,
    department: j.department,
    location: j.locationName ?? j.location,
    type: j.employmentType,
    url: j.jobUrl,
  }))
}

export function formatJob(j: Job, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const meta = [j.department, j.location, j.type].filter(Boolean).join(" · ")
  return `${prefix}[${j.id}] ${j.title ?? "(untitled)"}${meta ? ` (${meta})` : ""}${j.url ? `\n   ${j.url}` : ""}`
}

interface BoardJob {
  id?: string
  title?: string
  department?: string
  team?: string
  location?: string
  locationName?: string
  employmentType?: string
  isRemote?: boolean
  jobUrl?: string
  publishedAt?: string
  descriptionPlain?: string
  compensation?: { compensationTierSummary?: string; scrapeableCompensationSalarySummary?: string }
}

function checkedOrg(org: string): string {
  const value = (org ?? "").trim()
  if (!/^[A-Za-z0-9-]+$/.test(value)) throw new AshbyError(`Not an org slug: "${org}".`)
  return encodeURIComponent(value)
}

async function fetchBoard(org: string, includeCompensation = false): Promise<BoardJob[]> {
  const suffix = includeCompensation ? "?includeCompensation=true" : ""
  const data = await getJson<Raw>(`/job-board/${checkedOrg(org)}${suffix}`)
  return Array.isArray(data.jobs) ? (data.jobs as BoardJob[]) : []
}

const teamOf = (job: BoardJob) => [job.department, job.team].filter(Boolean).join(" / ") || "no team"

const placeOf = (job: BoardJob) =>
  [job.location ?? job.locationName, job.isRemote ? "remote" : "", job.employmentType]
    .filter(Boolean)
    .join(" · ") || "no location given"

const brief = (job: BoardJob, index: number) =>
  `${index + 1}. [${job.id ?? "?"}] ${job.title ?? "(untitled)"} (${teamOf(job)}) - ${placeOf(job)}` +
  `${job.compensation?.compensationTierSummary ? `\n   comp: ${job.compensation.compensationTierSummary}` : ""}` +
  `${job.jobUrl ? `\n   ${job.jobUrl}` : ""}`

export async function searchJobs(org: string, query: string, limit = 10): Promise<string> {
  const needle = String(query ?? "").trim().toLowerCase()
  if (!needle) throw new AshbyError("query is required.")
  const jobs = await fetchBoard(org)
  const hits = jobs.filter((job) =>
    `${job.title ?? ""} ${job.department ?? ""} ${job.team ?? ""} ${job.location ?? ""} ${job.locationName ?? ""}`
      .toLowerCase()
      .includes(needle))
  if (!hits.length) return `No roles at ${org} match "${query}" (searched ${jobs.length}).`
  return `Ashby jobs at ${org} matching "${query}" (${hits.length} of ${jobs.length}):\n` +
    hits.slice(0, limit).map(brief).join("\n")
}

export async function getJob(org: string, jobId: string): Promise<string> {
  const id = String(jobId ?? "").trim()
  if (!id) throw new AshbyError("job_id is required.")
  const jobs = await fetchBoard(org)
  const found = jobs.find((job) => String(job.id) === id)
  if (!found) return `No role with id ${id} at ${org}. Use list_jobs or search_jobs to get an id.`
  const description = String(found.descriptionPlain ?? "").replace(/\s+/g, " ").trim()
  return `${found.title ?? "(untitled)"} at ${org}\n` +
    `Team: ${teamOf(found)}\n` +
    `Location: ${placeOf(found)}\n` +
    `Published: ${String(found.publishedAt ?? "?").slice(0, 10)}\n` +
    `Apply: ${found.jobUrl ?? "?"}\n\n` +
    description.slice(0, 4000)
}

export async function departments(org: string): Promise<string> {
  const jobs = await fetchBoard(org)
  if (!jobs.length) return `No open roles at ${org}.`
  const counts = new Map<string, number>()
  for (const job of jobs) {
    const key = job.department || "unassigned"
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return `Ashby departments at ${org} (${ranked.length} hiring, ${jobs.length} roles):\n` +
    ranked.map(([name, count], i) => `${i + 1}. ${name} - ${count} role(s)`).join("\n")
}

export async function remoteJobs(org: string, limit = 10): Promise<string> {
  const jobs = await fetchBoard(org)
  const hits = jobs.filter((job) => job.isRemote === true)
  if (!hits.length) return `No remote roles at ${org} right now.`
  return `Remote roles at ${org} (${hits.length} of ${jobs.length}):\n` +
    hits.slice(0, limit).map(brief).join("\n")
}

export async function compensation(org: string, limit = 10): Promise<string> {
  const jobs = await fetchBoard(org, true)
  const paid = jobs.filter((job) => Boolean(job.compensation?.compensationTierSummary))
  if (!paid.length) return `No published compensation ranges at ${org} right now.`
  return `Roles with published pay at ${org} (${paid.length} of ${jobs.length}):\n` +
    paid.slice(0, limit).map(brief).join("\n")
}
