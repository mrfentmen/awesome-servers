/**
 * ClinVar — keyless public API client.
 */
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
const SOURCE = "ClinVar"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "clinvar-mcp", accept },
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

async function eutils(path: string, attempts = 3): Promise<any> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await getJson(path)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const transient = /responded (429|500|502|503|504)|timed out|request failed/i.test(message)
      if (!transient || attempt >= attempts) throw e
      await new Promise((resolve) => setTimeout(resolve, attempt * 900))
    }
  }
}

function classification(record: any): string {
  const germline = record?.germline_classification ?? {}
  const value = clean(germline.description)
  if (value) return value
  const other = clean(record?.oncogenicity_classification?.description) || clean(record?.clinical_impact_classification?.description)
  return other || "not classified"
}

function variantLine(record: any): string {
  const genes = Array.isArray(record.genes) ? record.genes.map((g: any) => clean(g.symbol)).filter(Boolean).join(", ") : clean(record.gene_sort)
  return [
    `${clean(record.title) || clean(record.accession) || "variant"}`,
    `  ${clean(record.obj_type) || "type unknown"}${genes ? ` · ${genes}` : ""} · ${classification(record)}`,
    `  ${clean(record.accession) || `uid ${record.uid}`}${record.record_status ? ` · ${clean(record.record_status)}` : ""}`,
  ].join("\n")
}

export async function searchVariants(a: { term: string; limit?: number }): Promise<string> {
  const term = clean(a.term)
  if (term.length < 2) throw new SourceError("term must be at least 2 characters")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const found = await eutils(`/esearch.fcgi?db=clinvar&retmode=json&retmax=${limit}&term=${encodeURIComponent(term)}`)
  const ids: string[] = found?.esearchresult?.idlist ?? []
  const count = String(found?.esearchresult?.count ?? "0")
  if (!ids.length) return `ClinVar has no variant for "${term}".`
  const sums = await eutils(`/esummary.fcgi?db=clinvar&retmode=json&id=${ids.join(",")}`)
  const result = sums?.result ?? {}
  return [
    `ClinVar variants for "${term}" - ${count} total, showing ${ids.length}:`,
    "",
    ...ids.map((id) => (result[id] ? variantLine(result[id]) : `${id} - no record returned`)),
  ].join("\n")
}

export async function variantDetail(a: { uid: string }): Promise<string> {
  const uid = clean(a.uid)
  if (!/^\d+$/.test(uid)) throw new SourceError("uid must be a numeric ClinVar uid")
  const sums = await eutils(`/esummary.fcgi?db=clinvar&retmode=json&id=${uid}`)
  const record = sums?.result?.[uid]
  if (!record) throw new SourceError(`ClinVar has no record ${uid}`)
  const germline = record.germline_classification ?? {}
  const traits: any[] = germline.trait_set ?? []
  const variations: any[] = record.variation_set ?? []
  const consequences = Array.isArray(record.molecular_consequence_list) ? record.molecular_consequence_list.join(", ") : ""
  const locations = variations.flatMap((v: any) => (Array.isArray(v.variation_loc) ? v.variation_loc : []))
  const loc = locations.find((l: any) => l.reference_allele) ?? locations[0]
  return [
    `${clean(record.title) || `Record ${uid}`}`,
    `Accession: ${clean(record.accession_version) || clean(record.accession) || uid}${record.obj_type ? ` · ${clean(record.obj_type)}` : ""}`,
    `Classification: ${classification(record)}`,
    germline.review_status ? `Review status: ${clean(germline.review_status)}` : "",
    germline.last_evaluated && clean(germline.last_evaluated) !== "1/01/01 00:00" ? `Last evaluated: ${clean(germline.last_evaluated)}` : "",
    traits.length ? `Traits: ${traits.slice(0, 6).map((t: any) => clean(t.trait_name)).filter(Boolean).join("; ")}` : "",
    record.protein_change ? `Protein change: ${clean(record.protein_change)}` : "",
    consequences ? `Consequences: ${consequences}` : "",
    loc ? `Location: chr${loc.chr}${loc.band ? loc.band : ""}:${loc.start}-${loc.stop} (${loc.assembly_name ?? "assembly unknown"})` : "",
    variations[0]?.cdna_change ? `cDNA change: ${clean(variations[0].cdna_change)}` : "",
    `ClinVar: https://www.ncbi.nlm.nih.gov/clinvar/variation/${uid}/`,
  ].filter(Boolean).join("\n")
}
