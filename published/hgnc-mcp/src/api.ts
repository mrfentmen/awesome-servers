/**
 * HGNC Gene Names — keyless public API client.
 */
const BASE = "https://rest.genenames.org"
const SOURCE = "HGNC Gene Names"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "hgnc-mcp", accept },
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

const FIELDS = ["symbol", "alias_symbol", "prev_symbol", "name", "entrez_id", "ensembl_gene_id", "uniprot_ids"]

function first(value: unknown): string {
  if (Array.isArray(value)) return clean(value[0])
  return clean(value)
}

function list(value: unknown): string[] {
  if (value === undefined || value === null) return []
  return (Array.isArray(value) ? value : [value]).map((v) => clean(v)).filter(Boolean)
}

function geneLine(doc: any, index: number): string {
  const symbol = clean(doc.symbol)
  const name = clean(doc.name)
  const locus = clean(doc.locus_group)
  const location = clean(doc.location)
  const aliases = list(doc.alias_symbol)
  const prev = list(doc.prev_symbol)
  const title = name ? `${symbol} - ${name}` : symbol
  const parts = [
    `${index + 1}. ${title}`,
    [locus, location].filter(Boolean).join(" · "),
    aliases.length ? `aliases: ${aliases.slice(0, 4).join(", ")}${aliases.length > 4 ? ` +${aliases.length - 4} more` : ""}` : "",
    prev.length ? `previous symbols: ${prev.slice(0, 4).join(", ")}` : "",
  ]
  return parts.filter(Boolean).join("\n   ")
}

function recordSummary(doc: any): string {
  const lines = [
    `${clean(doc.symbol)} - ${clean(doc.name)}`,
    "",
    bullet("status", doc.status),
    bullet("locus group", doc.locus_group),
    bullet("location", doc.location),
    bullet("entrez id", first(doc.entrez_id)),
    bullet("ensembl id", first(doc.ensembl_gene_id)),
    bullet("OMIM id", first(doc.omim_id)),
  ]
  const aliases = list(doc.alias_symbol)
  const prev = list(doc.prev_symbol)
  const uniprot = list(doc.uniprot_ids)
  if (aliases.length) lines.push(`aliases (${aliases.length}): ${aliases.slice(0, 6).join(", ")}${aliases.length > 6 ? " ..." : ""}`)
  if (prev.length) lines.push(`previous symbols: ${prev.join(", ")}`)
  if (uniprot.length) lines.push(`uniprot: ${uniprot.join(", ")}`)
  const dates = [doc.date_approved ? `approved ${doc.date_approved}` : "", doc.date_modified ? `modified ${doc.date_modified}` : ""].filter(Boolean)
  if (dates.length) lines.push("", dates.join(" · "))
  return lines.filter((l) => l !== undefined && l !== null).join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

export async function searchGenes(a: { query: string; field?: string; limit?: number }): Promise<string> {
  const field = a.field ?? "symbol"
  if (!FIELDS.includes(field)) throw new SourceError(`field must be one of ${FIELDS.join(", ")}`)
  const limit = clampLimit(a.limit, 10, 50)
  const data = await getJson(`/search/${field}/${encodeURIComponent(clean(a.query))}`, "application/json", 25000)
  const docs = data?.response?.docs
  if (!Array.isArray(docs)) throw new SourceError("HGNC returned an unexpected payload for this search")
  const found = Number(data?.response?.numFound ?? docs.length)
  if (!docs.length) return `No HGNC gene matches ${field} "${a.query}".`
  return [
    `${found} match(es) for ${field} "${a.query}"${docs.length > limit ? ` (showing ${limit})` : ""}:`,
    "",
    ...docs.slice(0, limit).map((d: any, i: number) => geneLine(d, i)),
  ].join("\n")
}

async function fetchGene(symbol: string): Promise<any> {
  const text = clean(symbol)
  if (!/^[A-Za-z0-9._-]{2,30}$/.test(text)) throw new SourceError(`"${text}" is not a valid gene symbol`)
  const data = await getJson(`/fetch/symbol/${encodeURIComponent(text)}`, "application/json", 25000)
  const status = Number(data?.responseHeader?.status)
  const docs = data?.response?.docs
  if (status !== 0 || !Array.isArray(docs) || !docs.length) {
    throw new SourceError(`HGNC has no approved gene with symbol "${text}"`)
  }
  return docs[0]
}

export async function geneRecord(a: { symbol: string }): Promise<string> {
  const doc = await fetchGene(a.symbol)
  return recordSummary(doc)
}

export async function geneXrefs(a: { symbol: string }): Promise<string> {
  const doc = await fetchGene(a.symbol)
  const groups: Array<[string, unknown]> = [
    ["Ensembl gene", doc.ensembl_gene_id],
    ["Entrez gene", doc.entrez_id],
    ["UniProt", doc.uniprot_ids],
    ["RefSeq", doc.refseq_accession],
    ["CCDS", doc.ccds_id],
    ["OMIM", doc.omim_id],
    ["MIM", doc.mim_id],
    ["Vega", doc.vega_id],
    ["MGD (mouse)", doc.mgd_id],
    ["RGD (rat)", doc.rgd_id],
    ["ZFIN (zebrafish)", doc.zfin_id],
    ["Xenopus", doc.xenopus_id],
    ["PubChem", doc.pubchem_id],
    ["EC", doc.enzyme_id],
    ["NCBI gene family", doc.gene_family_id],
  ]
  const lines: string[] = []
  for (const [label, value] of groups) {
    const values = list(value)
    if (values.length) lines.push(`- ${label}: ${values.slice(0, 6).join(", ")}${values.length > 6 ? ` (+${values.length - 6} more)` : ""}`)
  }
  if (!lines.length) return `HGNC holds no cross-references for ${clean(doc.symbol)}.`
  return [`Cross-references for ${clean(doc.symbol)} (${lines.length} kind(s)):`, "", ...lines].join("\n")
}
