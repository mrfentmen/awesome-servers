/**
 * USAJOBS API client. Needs USAJOBS_API_KEY (free at https://developer.usajobs.gov/)
 * plus a contact email in the User-Agent header (USAJOBS_EMAIL).
 * Docs: https://developer.usajobs.gov/
 */
const BASE = "https://data.usajobs.gov/api"

export class UsajobsError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.USAJOBS_API_KEY
  const email = process.env.USAJOBS_EMAIL ?? "mcp@example.com"
  if (!key) throw new UsajobsError("Set USAJOBS_API_KEY first (free at developer.usajobs.gov).")
  return { "User-Agent": email, Accept: "application/json", "Authorization-Key": key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new UsajobsError("USAJOBS refused (401/403). Check API key.")
  if (!res.ok) throw new UsajobsError(`USAJOBS error ${res.status}`)
  return (await res.json()) as T
}

export interface FedJob {
  title?: string
  agency?: string
  locations: string[]
  pay?: string
  grade?: string
  posted?: string
  closes?: string
  url?: string
}

export async function searchJobs(keyword: string, location = "", limit = 5): Promise<{ total: number; jobs: FedJob[] }> {
  const qs = new URLSearchParams({ Keyword: keyword.trim(), ResultsPerPage: String(Math.min(Math.max(limit, 1), 50)) })
  if (location.trim()) qs.set("LocationName", location.trim())
  const data = await getJson<Raw>(`/search?${qs}`)
  const sr: Raw = data.SearchResult ?? {}
  const rows: Raw[] = Array.isArray(sr.SearchResultItems) ? sr.SearchResultItems : []
  const total = Number(sr.SearchResultCount ?? rows.length)
  return {
    total: isFinite(total) ? total : rows.length,
    jobs: rows.slice(0, limit).map((it) => {
      const d: Raw = it.MatchedObjectDescriptor ?? {}
      const pay: Raw = d.PositionRemuneration?.[0] ?? {}
      const locs: Raw[] = Array.isArray(d.PositionLocation) ? d.PositionLocation : []
      return {
        title: d.PositionTitle,
        agency: d.OrganizationName,
        locations: locs.map((l) => String(l.LocationName ?? l.CityName ?? "")).filter(Boolean).slice(0, 3),
        pay: pay.MinimumRange && pay.MaximumRange ? `$${pay.MinimumRange}-$${pay.MaximumRange}` : undefined,
        grade: Array.isArray(d.JobGrade) ? d.JobGrade.map((g: Raw) => g.Code).join(",") : undefined,
        posted: d.PublicationStartDate ? String(d.PublicationStartDate).slice(0, 10) : undefined,
        closes: d.ApplicationCloseDate ? String(d.ApplicationCloseDate).slice(0, 10) : undefined,
        url: d.PositionURI,
      }
    }),
  }
}

export function formatJob(j: FedJob, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const meta = [j.agency, j.locations.join("/"), j.pay, j.grade ? `GS-${j.grade}` : ""].filter(Boolean).join(" · ")
  return `${prefix}${j.title ?? "(untitled)"}${meta ? `\n   ${meta}` : ""}${j.posted || j.closes ? `\n   Posted ${j.posted ?? "?"} — closes ${j.closes ?? "?"}` : ""}${j.url ? `\n   ${j.url}` : ""}`
}
