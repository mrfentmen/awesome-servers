/**
 * cBioPortal — keyless public API client.
 */
const BASE = "https://www.cbioportal.org/api"
const SOURCE = "cBioPortal"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "cbioportal-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

async function getAll(path: string): Promise<any[]> {
  const data = await getJson(path, "application/json", 30000)
  if (!Array.isArray(data)) throw new SourceError("cBioPortal returned an unexpected payload")
  return data
}

function matches(query: string | undefined, ...values: unknown[]): boolean {
  const needle = clean(query).toLowerCase()
  if (!needle) return true
  return values.some((v) => clean(v).toLowerCase().includes(needle))
}

export async function listCancerTypes(a: { query?: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 25, 100)
  const all = await getAll("/cancer-types")
  const hits = all.filter((c: any) => matches(a.query, c.cancerTypeId, c.name, c.shortName))
  if (!hits.length) return `No cBioPortal cancer type matches "${clean(a.query)}".`
  return [
    `${hits.length} cancer type(s)${a.query ? ` matching "${clean(a.query)}"` : ""} (showing ${Math.min(limit, hits.length)}):`,
    "",
    ...hits.slice(0, limit).map((c: any, i: number) => {
      const parent = clean(c.parent)
      return `${i + 1}. ${clean(c.name)} (${clean(c.cancerTypeId)})${parent ? ` · parent: ${parent}` : ""}`
    }),
  ].join("\n")
}

export async function findGenes(a: { query: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const all = await getAll(`/genes?keyword=${encodeURIComponent(clean(a.query))}&limit=${Math.max(limit, 20)}`)
  if (!all.length) return `No cBioPortal gene matches "${clean(a.query)}".`
  return [
    `${all.length} gene(s) matching "${clean(a.query)}" (showing ${Math.min(limit, all.length)}):`,
    "",
    ...all.slice(0, limit).map((g: any, i: number) =>
      `${i + 1}. ${clean(g.hugoGeneSymbol)} · entrez ${g.entrezGeneId}${g.type ? ` · ${clean(g.type)}` : ""}`),
  ].join("\n")
}

export async function listStudies(a: { query?: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const keyword = clean(a.query)
  const path = keyword
    ? `/studies?keyword=${encodeURIComponent(keyword)}&limit=${Math.max(limit, 25)}`
    : `/studies?limit=${Math.max(limit, 25)}`
  const all = await getAll(path)
  const hits = all.filter((s: any) => matches(a.query, s.name, s.studyId, s.cancerTypeId))
  if (!hits.length) return `No cBioPortal study matches "${keyword}".`
  return [
    `${hits.length} study(ies)${keyword ? ` matching "${keyword}"` : ""} (showing ${Math.min(limit, hits.length)}):`,
    "",
    ...hits.slice(0, limit).map((s: any, i: number) => {
      const bits = [clean(s.studyId), clean(s.cancerTypeId) ? `cancer type ${clean(s.cancerTypeId)}` : ""].filter(Boolean)
      return `${i + 1}. ${clean(s.name)}\n   ${bits.join(" · ")}`
    }),
  ].join("\n")
}

export async function studyDetails(a: { studyId: string }): Promise<string> {
  const id = clean(a.studyId)
  if (!/^[A-Za-z0-9._-]{2,64}$/.test(id)) throw new SourceError(`"${id}" is not a valid cBioPortal study id`)
  const s = await getJson(`/studies/${encodeURIComponent(id)}`, "application/json", 25000)
  if (!s || typeof s !== "object") throw new SourceError("cBioPortal returned an unexpected payload for this study")
  const description = clean(s.description)
  return [
    `${clean(s.name)} (${clean(s.studyId)})`,
    "",
    bullet("cancer type", s.cancerTypeId),
    bullet("reference", s.citation),
    bullet("pmid", s.pmid),
    bullet("public", s.publicStudy),
    bullet("groups", Array.isArray(s.groups) ? s.groups.join(", ") : s.groups),
    "",
    description ? description.slice(0, 700) : "No description on record.",
  ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
