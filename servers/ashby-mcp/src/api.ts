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
