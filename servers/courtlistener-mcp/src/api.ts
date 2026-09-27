/**
 * CourtListener API v4 client, keyless for search.
 * Docs: https://www.courtlistener.com/help/api/rest/
 * Full opinion/docket detail endpoints need an API key; search does not.
 */
const BASE = "https://www.courtlistener.com/api/rest/v4"

export class CourtListenerError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function searchApi(query: string, type: string, limit: number): Promise<Raw[]> {
  const url = `${BASE}/search/?q=${encodeURIComponent(query)}&type=${type}`
  const res = await fetch(url, {
    headers: { "User-Agent": "courtlistener-mcp/1.0" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new CourtListenerError(`CourtListener error ${res.status}`)
  const data = (await res.json()) as Raw
  const results: Raw[] = Array.isArray(data.results) ? data.results : []
  return results.slice(0, limit)
}

const fullUrl = (path?: string): string | undefined =>
  typeof path === "string" && path ? `https://www.courtlistener.com${path}` : undefined

export interface OpinionHit {
  caseName?: string
  court?: string
  dateFiled?: string
  status?: string
  citation?: string
  citeCount?: number
  judge?: string
  syllabus?: string
  url?: string
}

const clean = (s: unknown, max: number): string | undefined => {
  if (typeof s !== "string" || !s) return undefined
  const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  return t ? (t.length > max ? t.slice(0, max) + "..." : t) : undefined
}

export async function searchOpinions(query: string, limit = 5): Promise<OpinionHit[]> {
  const rows = await searchApi(query, "o", limit)
  return rows.map((r) => ({
    caseName: typeof r.caseName === "string" ? r.caseName : undefined,
    court: typeof r.court === "string" ? r.court : undefined,
    dateFiled: typeof r.dateFiled === "string" ? r.dateFiled.slice(0, 10) : undefined,
    status: typeof r.status === "string" ? r.status : undefined,
    citation: Array.isArray(r.citation) ? String(r.citation[0]) : typeof r.citation === "string" ? r.citation : undefined,
    citeCount: typeof r.citeCount === "number" ? r.citeCount : undefined,
    judge: typeof r.judge === "string" && r.judge ? r.judge : undefined,
    syllabus: clean(r.syllabus, 280),
    url: fullUrl(r.absolute_url),
  }))
}

export interface DocketHit {
  caseName?: string
  court?: string
  docketNumber?: string
  dateFiled?: string
  url?: string
}

export async function searchDockets(query: string, limit = 5): Promise<DocketHit[]> {
  const rows = await searchApi(query, "r", limit)
  return rows.map((r) => ({
    caseName: typeof r.caseName === "string" ? r.caseName : undefined,
    court: typeof r.court === "string" ? r.court : undefined,
    docketNumber: typeof r.docketNumber === "string" ? r.docketNumber : undefined,
    dateFiled: typeof r.dateFiled === "string" ? r.dateFiled.slice(0, 10) : undefined,
    url: fullUrl(r.absolute_url),
  }))
}

export function formatOpinion(o: OpinionHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${o.caseName ?? "(unnamed case)"}${o.status ? ` [${o.status}]` : ""}`,
    o.court ? `Court: ${o.court}` : "",
    o.dateFiled ? `Filed: ${o.dateFiled}` : "",
    o.citation ? `Cite: ${o.citation}` : "",
    o.citeCount !== undefined ? `Cited by: ${o.citeCount}` : "",
    o.judge ? `Judge: ${o.judge}` : "",
    o.syllabus ? `Syllabus: ${o.syllabus}` : "",
    o.url ? `More: ${o.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatDocket(d: DocketHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${d.caseName ?? "(unnamed docket)"}${d.docketNumber ? ` (${d.docketNumber})` : ""}`,
    d.court ? `Court: ${d.court}` : "",
    d.dateFiled ? `Filed: ${d.dateFiled}` : "",
    d.url ? `More: ${d.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export interface PersonHit {
  name?: string
  court?: string
  dateFiled?: string
  url?: string
}

export async function searchPeople(query: string, limit = 5): Promise<PersonHit[]> {
  const rows = await searchApi(query, "p", limit)
  return rows.map((r) => ({
    name: typeof r.name === "string" ? r.name : undefined,
    court: typeof r.court === "string" ? r.court : undefined,
    dateFiled: typeof r.dateFiled === "string" ? r.dateFiled.slice(0, 10) : undefined,
    url: fullUrl(r.absolute_url),
  }))
}

export function formatPerson(p: PersonHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${p.name ?? "(unnamed person)"}`,
    p.court ? `Court: ${p.court}` : "",
    p.dateFiled ? `Filed: ${p.dateFiled}` : "",
    p.url ? `More: ${p.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export interface OralArgHit {
  caseName?: string
  court?: string
  dateArgued?: string
  duration?: string
  url?: string
}

export async function searchOralArgs(query: string, limit = 5): Promise<OralArgHit[]> {
  const rows = await searchApi(query, "oa", limit)
  return rows.map((r) => ({
    caseName: typeof r.caseName === "string" ? r.caseName : undefined,
    court: typeof r.court === "string" ? r.court : undefined,
    dateArgued: typeof r.dateArgued === "string" ? r.dateArgued.slice(0, 10) : undefined,
    duration: typeof r.duration === "string" ? r.duration : undefined,
    url: fullUrl(r.absolute_url),
  }))
}

export function formatOralArg(o: OralArgHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${o.caseName ?? "(unnamed argument)"}`,
    o.court ? `Court: ${o.court}` : "",
    o.dateArgued ? `Argued: ${o.dateArgued}` : "",
    o.duration ? `Duration: ${o.duration}` : "",
    o.url ? `Listen: ${o.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
