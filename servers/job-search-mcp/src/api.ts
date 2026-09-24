const BASE = "https://remotive.com/api/remote-jobs"
const UA = "mrfentmen-job-search-mcp/1.0 (https://github.com/mrfentmen)"
export class JobError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new JobError(`Remotive error ${res.status}`)
  return (await res.json()) as T
}

export async function searchJobs(args: { query?: string; category?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const params = new URLSearchParams()
  if (args.query) params.set("search", args.query)
  if (args.category) params.set("category", args.category)
  params.set("limit", String(limit))
  const d = await get<any>(`${BASE}?${params.toString()}`)
  const jobs = d.jobs ?? []
  return jobs.map((j: any, i: number) =>
    `${i + 1}. ${j.title ?? ""}\n   ${j.company_name ?? ""} | ${j.category ?? ""} | ${j.candidate_required_location ?? ""}\n   ${j.url ?? ""}`
  ).join("\n\n") || "No jobs found"
}

export async function jobCategories(_args: Record<string, never>): Promise<string> {
  const d = await get<any>(`${BASE}/categories`)
  const cats = Array.isArray(d) ? d : d.jobs ?? []
  return cats.slice(0, 50).map((c: any) => c.name ?? c).join("\n") || "No categories"
}
