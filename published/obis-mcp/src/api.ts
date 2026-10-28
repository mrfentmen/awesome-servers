/**
 * Ocean Life (OBIS) — keyless public API client.
 */
const BASE = "https://api.obis.org/v3"
const SOURCE = "Ocean Life (OBIS)"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "obis-mcp", accept },
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

function checkName(name: string): string {
  const n = clean(name)
  if (n.length < 2) throw new SourceError("name must be at least 2 characters")
  return n
}

function taxonLine(t: any): string {
  const flags = [t.is_marine ? "marine" : "", t.is_brackish ? "brackish" : "", t.is_freshwater ? "freshwater" : ""].filter(Boolean).join(", ")
  return [
    `${clean(t.scientificName)}${t.scientificNameAuthorship ? ` (${clean(t.scientificNameAuthorship)})` : ""}`,
    `  OBIS taxonID ${t.taxonID} · rank ${clean(t.taxonRank) || "unknown"} · status ${clean(t.taxonomicStatus) || "unknown"}`,
    flags ? `  habitats: ${flags}` : "",
    t.acceptedNameUsage && t.acceptedNameUsage !== t.scientificName ? `  accepted name: ${clean(t.acceptedNameUsage)}` : "",
    t.kingdom ? `  ${[t.kingdom, t.phylum, t.class, t.order, t.family].map((x) => clean(x)).filter(Boolean).join(" > ")}` : "",
  ].filter(Boolean).join("\n")
}

export async function taxonInfo(a: { name: string }): Promise<string> {
  const name = checkName(a.name)
  const d = await getJson(`/taxon/${encodeURIComponent(name)}`)
  const hits: any[] = d?.results ?? []
  if (!hits.length) return `OBIS knows no taxon called "${name}".`
  return [
    `OBIS taxon lookup "${name}" - ${d.total ?? hits.length} match(es):`,
    "",
    ...hits.slice(0, 5).map(taxonLine),
  ].join("\n")
}

export async function taxonChildren(a: { taxonId: number }): Promise<string> {
  const id = Math.trunc(a.taxonId)
  if (!Number.isFinite(id) || id < 1) throw new SourceError("taxonId must be a positive integer")
  const d = await getJson(`/taxon/${id}/children`)
  const kids: any[] = d?.results ?? []
  if (!kids.length) return `OBIS taxon ${id} has no children in the backbone.`
  return [`${d.total ?? kids.length} child taxon/taxa of OBIS ${id}:`, "", ...kids.slice(0, 25).map((k) => `- ${clean(k.scientificName)} (${clean(k.taxonRank)}, taxonID ${k.taxonID}, ${clean(k.taxonomicStatus)})`)].join("\n")
}

export async function occurrences(a: { taxonId?: number; scientificName?: string; limit?: number }): Promise<string> {
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new SourceError("limit must be between 1 and 50")
  const params = new URLSearchParams({ size: String(limit) })
  if (a.taxonId !== undefined) {
    const id = Math.trunc(a.taxonId)
    if (!Number.isFinite(id) || id < 1) throw new SourceError("taxonId must be a positive integer")
    params.set("taxonid", String(id))
  } else if (a.scientificName) {
    params.set("scientificname", clean(a.scientificName))
  } else {
    throw new SourceError("pass either taxonId or scientificName")
  }
  const d = await getJson(`/occurrence?${params.toString()}`)
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `No OBIS occurrence records for that query.`
  const blocks = rows.map((r) => {
    const where = [r.decimalLongitude, r.decimalLatitude].every((v) => Number.isFinite(Number(v)))
      ? `${Number(r.decimalLatitude).toFixed(3)}, ${Number(r.decimalLongitude).toFixed(3)}`
      : "position not stated"
    const when = r.date_start ? new Date(Number(r.date_start)).toISOString().slice(0, 10) : (r.date_year ? String(r.date_year) : "date unknown")
    return [
      `${clean(r.scientificName) || "unidentified"} - ${when} · ${where}${r.depth !== undefined ? ` · depth ${r.depth} m` : ""}`,
      `  dataset: ${clean(r.datasetName) || clean(r.datasetID) || "unknown"}`,
      r.basisOfRecord ? `  basis: ${clean(r.basisOfRecord)}${r.occurrenceStatus ? ` · status ${clean(r.occurrenceStatus)}` : ""}` : "",
    ].filter(Boolean).join("\n")
  })
  return [`OBIS occurrences - ${d.total ?? rows.length} matching records, showing ${rows.length}:`, "", ...blocks].join("\n")
}
