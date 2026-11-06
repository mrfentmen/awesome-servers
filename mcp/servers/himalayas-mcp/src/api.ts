/**
 * Himalayas — a remote job board with a public JSON feed. Keyless.
 *
 * Verified live: GET /jobs/api?limit=<n>&offset=<n> returns
 * `{jobs, totalCount, offset, limit, nextCursor}`. Each job carries a unix
 * `pubDate` in seconds and an `applicationLink`.
 */
const API = "https://himalayas.app/jobs/api"

export class HimalayasError extends Error {}

interface Job {
  title?: string
  companyName?: string
  locationRestrictions?: string[]
  pubDate?: number
  minSalary?: number | null
  maxSalary?: number | null
  currency?: string | null
  employmentType?: string
  seniority?: string[]
  categories?: string[]
  applicationLink?: string
  guid?: string
  excerpt?: string
}

interface JobsBody {
  jobs?: Job[]
  totalCount?: number
  offset?: number
  limit?: number
  nextCursor?: string
}

async function get<T>(params: URLSearchParams, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "himalayas-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new HimalayasError(`Himalayas responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof HimalayasError) throw e
    if ((e as Error).name === "AbortError") throw new HimalayasError("Himalayas request timed out")
    throw new HimalayasError(`Himalayas request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const posted = (unix: number | undefined): string =>
  typeof unix === "number" && Number.isFinite(unix) ? new Date(unix * 1000).toISOString().slice(0, 10) : "date unknown"

function salary(job: Job): string {
  const min = typeof job.minSalary === "number" ? job.minSalary : undefined
  const max = typeof job.maxSalary === "number" ? job.maxSalary : undefined
  if (min === undefined && max === undefined) return ""
  const fmt = (n: number): string => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))
  const range = min !== undefined && max !== undefined ? `${fmt(min)}-${fmt(max)}` : min !== undefined ? `from ${fmt(min)}` : `up to ${fmt(max ?? 0)}`
  const unit = job.currency ?? ""
  return `${range} ${unit}`.trim()
}

export async function jobs(limit = 10, offset = 0): Promise<string> {
  const size = clamp(limit, 1, 100)
  const start = Number.isInteger(offset) && offset > 0 ? offset : 0
  const body = await get<JobsBody>(new URLSearchParams({ limit: String(size), offset: String(start) }))

  const list = body.jobs ?? []
  const total = body.totalCount ?? list.length
  if (list.length === 0) return start > 0 ? `No jobs at offset ${start} — Himalayas lists ${total} in total.` : "Himalayas returned no jobs."

  const lines = list.map((j, i) => {
    const locations = (j.locationRestrictions ?? []).join(", ")
    const meta = [
      j.companyName ?? "unknown company",
      locations || "location not restricted",
      j.employmentType ?? "",
      (j.seniority ?? []).join("/"),
      salary(j),
      `posted ${posted(j.pubDate)}`,
    ]
      .filter((p) => p !== "")
      .join(" · ")
    const url = j.applicationLink ?? j.guid ?? ""
    return `${start + i + 1}. ${(j.title ?? "(untitled)").trim()}\n   ${meta}${url ? `\n   ${url}` : ""}`
  })

  return [`Remote jobs — ${total} total, showing ${start + 1}-${start + list.length}`, "", ...lines].join("\n")
}
