/**
 * MetaboLights — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/metabolights/ws"
const SOURCE = "MetaboLights"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "metabolights-mcp", accept },
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

const SEARCH = "https://www.ebi.ac.uk/ebisearch/ws/rest/metabolights"

function asList(value: unknown): any[] {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]
}

function text(value: unknown, max = 320): string {
  const s = clean(value)
  return s ? s.slice(0, max) : ""
}

async function searchIds(query: string, limit: number): Promise<{ ids: string[]; hitCount: number }> {
  const data = await getJson(`${SEARCH}?query=${encodeURIComponent(query)}&format=json&size=${limit}`, "application/json", 30000)
  const ids = asList(data?.entries).map((e: any) => text(e?.id ?? e, 32)).filter((v) => /^MTBLS\d+$/i.test(v))
  return { ids, hitCount: Number(data?.hitCount ?? ids.length) }
}

async function listIds(limit: number): Promise<{ ids: string[]; hitCount: number }> {
  const data = await getJson(`/studies?size=${limit}`, "application/json", 30000)
  const ids = asList(data?.content).map((v) => text(v, 32)).filter((v) => /^MTBLS\d+$/i.test(v))
  return { ids, hitCount: Number(data?.studies ?? ids.length) }
}

interface StudyInfo {
  id: string
  title: string
  release: string
}

async function fetchInfo(id: string): Promise<StudyInfo> {
  try {
    const raw = await getJson(`/studies/${encodeURIComponent(id)}`, "application/json", 25000)
    const isa = raw?.isaInvestigation ?? {}
    const study = asList(isa.studies)[0] ?? {}
    return {
      id,
      title: text(isa.title ?? study.title, 140),
      release: text(study.publicReleaseDate ?? isa.publicReleaseDate ?? raw?.mtblsStudy?.firstPublicDate, 20),
    }
  } catch {
    return { id, title: "", release: "" }
  }
}

export async function listStudies(a: { query?: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const query = clean(a.query)
  const { ids, hitCount } = query ? await searchIds(query, Math.max(limit, 10)) : await listIds(limit)
  if (!ids.length) return query ? `No MetaboLights study matches "${query}".` : "MetaboLights returned no studies."
  const shown = ids.slice(0, Math.min(limit, 10))
  const infos = await Promise.all(shown.map((id) => fetchInfo(id)))
  return [
    `${hitCount} MetaboLights study(ies)${query ? ` matching "${query}"` : ""} (showing ${infos.length}):`,
    "",
    ...infos.map((s, i) => {
      const bits = [s.title || "(title unavailable)", s.release ? `public ${s.release}` : ""].filter(Boolean)
      return `${i + 1}. ${s.id} - ${bits.join(" · ")}`
    }),
  ].join("\n")
}

async function fetchStudy(studyId: string): Promise<{ id: string; isa: any; study: any; status: any }> {
  const id = clean(studyId).toUpperCase()
  if (!/^MTBLS\d{1,6}$/.test(id)) throw new SourceError(`"${studyId}" does not look like a MetaboLights accession (MTBLS...)`)
  const raw = await getJson(`/studies/${id}`, "application/json", 30000)
  if (!raw?.mtblsStudy) throw new SourceError(`MetaboLights has no public study "${id}"`)
  const isa = raw.isaInvestigation ?? {}
  return { id, isa, study: asList(isa.studies)[0] ?? {}, status: raw.mtblsStudy }
}

export async function studyDetail(a: { studyId: string }): Promise<string> {
  const { id, isa, study, status } = await fetchStudy(a.studyId)
  const people = asList(isa.people)
    .map((p: any) => text(p?.lastName ? `${p.firstName ?? ""} ${p.lastName}` : p?.firstName ?? p, 60))
    .filter(Boolean)
  const pubs = asList(isa.publications).map((p: any) => text(p?.title ?? p?.doi ?? p, 200)).filter(Boolean)
  const description = text(isa.description ?? study.description, 700)
  return [
    `${id} - ${text(isa.title ?? study.title, 160) || "(no title)"}`,
    "",
    bullet("status", status.studyStatus),
    bullet("curated revision", status.revisionNumber),
    bullet("released", study.publicReleaseDate ?? isa.publicReleaseDate ?? status.firstPublicDate),
    bullet("submitted", isa.submissionDate ?? status.createdAt),
    bullet("modified", status.modifiedTime),
    bullet("people", people.length ? `${people.slice(0, 4).join(", ")}${people.length > 4 ? ` (+${people.length - 4})` : ""}` : ""),
    "",
    description || "No description on record.",
    pubs.length ? `\nPublication: ${pubs[0]}` : "",
  ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

export async function studyDesign(a: { studyId: string }): Promise<string> {
  const { id, study } = await fetchStudy(a.studyId)
  const descriptors = asList(study.studyDesignDescriptors).map((d: any) => text(d?.annotationValue ?? d?.value ?? d, 80)).filter(Boolean)
  const factors = asList(study.factors).map((f: any) => text(f?.factorName ?? f, 80)).filter(Boolean)
  const assays = asList(study.assays).map((x: any) => {
    const platform = text(x?.technologyPlatform, 80)
    const measurement = text(x?.measurementType?.annotationValue ?? x?.measurementType, 60)
    return [platform, measurement].filter(Boolean).join(" · ")
  }).filter(Boolean)
  const parts = [
    descriptors.length ? `Study design: ${[...new Set(descriptors)].join(", ")}` : "",
    factors.length ? `Factors: ${[...new Set(factors)].join(", ")}` : "",
    assays.length ? `Assays: ${assays.join(" | ")}` : "",
  ].filter(Boolean)
  if (!parts.length) return `No design descriptors, factors or assays recorded for ${id}.`
  return [`Design of ${id}:`, "", ...parts.map((p) => `- ${p}`)].join("\n")
}
