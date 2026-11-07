/**
 * UniProt — Protein records from the UniProt knowledgebase, with sequences and organism names. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against rest.uniprot.org.
 */
const API = "https://rest.uniprot.org"

export class UniProtError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "uniprot-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new UniProtError(`UniProt returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof UniProtError) throw e
    if ((e as Error).name === "AbortError") throw new UniProtError("UniProt request timed out")
    throw new UniProtError(`UniProt request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchProteins(query: string, limit = 5): Promise<string> {
  const q = query.trim()
  if (q === "") throw new UniProtError("query must not be empty")
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/uniprotkb/search?query=${encodeURIComponent(q)}&size=${size}&format=json&fields=accession,protein_name,organism_name,length`)
  const items = rows(at(body, "results"))
  if (items.length === 0) return `UniProt found nothing for "${q}".`
  const lines = items.map((r, i) => {
    const name = val(at(r, "proteinDescription.recommendedName.fullName.value")) || val(at(r, "proteinDescription.submissionNames"))
    return `${i + 1}. ${val(at(r, "primaryAccession"))} — ${name} (${val(at(r, "organism.scientificName"))}, ${val(at(r, "sequence.length"))} aa)`
  })
  return [`UniProt results for "${q}" — ${items.length} shown`, "", ...lines].join("\n")
}

export async function getEntry(accession: string): Promise<string> {
  const acc = accession.trim().toUpperCase()
  if (acc === "") throw new UniProtError("accession must not be empty")
  const body = await get<unknown>(`${API}/uniprotkb/${encodeURIComponent(acc)}.json`)
  const name = val(at(body, "proteinDescription.recommendedName.fullName.value"))
  return [
    `${val(at(body, "primaryAccession"))} — ${name}`,
    "",
    `Organism: ${val(at(body, "organism.scientificName"))}`,
    `Length: ${val(at(body, "sequence.length"))} aa`,
    `Mass: ${val(at(body, "sequence.molWeight"))} Da`,
    `Reviewed: ${val(at(body, "entryType"))}`,
  ].join("\n")
}
