/**
 * GEO Datasets — keyless public API client.
 */
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
const SOURCE = "GEO Datasets"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "geo-mcp", accept },
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

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
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

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function checkTerm(term: string): string {
  const t = clean(term)
  if (t.length < 2) throw new SourceError("term must be at least 2 characters")
  return t
}

function checkLimit(n: number | undefined): number {
  const v = n ?? 10
  if (!Number.isInteger(v) || v < 1 || v > 25) throw new SourceError("limit must be between 1 and 25")
  return v
}

async function eutils(path: string, attempts = 3): Promise<any> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await getJson(path)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const transient = /responded (429|500|502|503|504)/.test(message) || /timed out|request failed/i.test(message)
      if (!transient || attempt >= attempts) throw e
      await new Promise((resolve) => setTimeout(resolve, attempt * 900))
    }
  }
}

async function esearch(term: string, retmax: number): Promise<any> {
  return eutils(`/esearch.fcgi?db=gds&retmode=json&sort=date&retmax=${retmax}&term=${encodeURIComponent(term)}`)
}

function summarize(row: any): string {
  const samples = row.n_samples ? `${row.n_samples} samples` : "sample count unknown"
  return [
    `${row.accession ?? row.uid} - ${clean(row.title)}`,
    `  ${clean(row.gdsType ?? row.entrytype ?? "type unknown")} · ${clean(row.taxon ?? "taxon unknown")} · ${samples}`,
    row.pdat ? `  released ${String(row.pdat).slice(0, 10)}` : "",
    row.gpl ? `  platform ${clean(row.gpl)}` : "",
  ].filter(Boolean).join("\n")
}

export async function searchDatasets(a: { term: string; limit?: number }): Promise<string> {
  const term = checkTerm(a.term)
  const limit = checkLimit(a.limit)
  const found = await esearch(term, limit)
  const ids: string[] = found?.esearchresult?.idlist ?? []
  const count = String(found?.esearchresult?.count ?? "0")
  if (!ids.length) return `GEO has no dataset matching "${term}".`
  const sums = await eutils(`/esummary.fcgi?db=gds&retmode=json&id=${ids.join(",")}`)
  const result = sums?.result ?? {}
  const blocks = ids.map((id) => (result[id] ? summarize(result[id]) : `${id} - no record returned`))
  return [`GEO datasets matching "${term}" - ${count} total, showing ${ids.length}:`, "", ...blocks].join("\n")
}

export async function countDatasets(a: { term: string }): Promise<string> {
  const term = checkTerm(a.term)
  const found = await esearch(term, 1)
  const r = found?.esearchresult ?? {}
  const translated = (r.translationset ?? []).map((x: any) => x?.to).filter(Boolean).join("; ")
  return [
    `${clean(r.count) || "0"} GEO DataSets match "${term}".`,
    translated ? `NCBI translated the query to: ${clean(translated)}` : "",
    (r.querytranslation as string) ? `Warning: ${clean(r.querytranslation)}` : "",
  ].filter(Boolean).join("\n")
}

export async function datasetDetail(a: { uid: string }): Promise<string> {
  let uid = clean(a.uid)
  if (!uid) throw new SourceError("uid is required")
  if (/^GSE\d+$/i.test(uid)) {
    const found = await esearch(uid.toUpperCase(), 1)
    const ids: string[] = found?.esearchresult?.idlist ?? []
    if (!ids.length) throw new SourceError(`GEO has no accession ${uid}`)
    uid = ids[0]
  } else if (!/^\d+$/.test(uid)) {
    throw new SourceError("uid must be a numeric GEO UID or an accession like GSE335330")
  }
  const sums = await eutils(`/esummary.fcgi?db=gds&retmode=json&id=${uid}`)
  const row = sums?.result?.[uid]
  if (!row) throw new SourceError(`GEO has no dataset ${uid}`)
  const related = (row.gse ? `GSE ${row.gse}` : "") || (row.accession ? `accession ${row.accession}` : "")
  return [
    `${row.accession ?? row.uid} - ${clean(row.title)}`,
    `Type: ${clean(row.gdsType ?? row.entrytype) || "unknown"}`,
    `Organism: ${clean(row.taxon) || "unknown"}`,
    related ? `Series: ${related}` : "",
    row.n_samples ? `Samples: ${row.n_samples}` : "",
    clean(row.pdat) ? `Released: ${String(row.pdat).slice(0, 10)}` : "",
    clean(row.suppfile) ? `Supplementary file: ${clean(row.suppfile)}` : "",
    clean(row.summary) ? `Summary: ${clean(row.summary).slice(0, 1500)}` : "",
    `GEO: https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${encodeURIComponent(String(row.accession ?? uid))}`,
  ].filter(Boolean).join("\n")
}
