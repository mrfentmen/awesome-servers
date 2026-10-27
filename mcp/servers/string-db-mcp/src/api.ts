/**
 * STRING Interactions — keyless public API client.
 */
const BASE = "https://string-db.org/api"
const SOURCE = "STRING Interactions"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "string-db-mcp", accept },
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

function checkTaxon(n: number | undefined): number {
  const v = n ?? 9606
  if (!Number.isInteger(v) || v < 1 || v > 100000000) throw new SourceError("species must be a numeric NCBI taxon id")
  return v
}

export async function mapIdentifiers(a: { identifiers: string; species?: number }): Promise<string> {
  const ids = clean(a.identifiers).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 25)
  if (!ids.length) throw new SourceError("identifiers must list at least one name")
  const species = checkTaxon(a.species)
  const params = new URLSearchParams({ identifiers: ids.join("%0d"), species: String(species), limit: "1", caller_identity: "string-db-mcp" })
  const rows: any[] = await getJson(`/json/get_string_ids?${params.toString()}`)
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return `STRING mapped none of: ${ids.join(", ")} (taxon ${species}).`
  return [
    `STRING identifiers for taxon ${species}:`,
    "",
    ...list.map((r) => `- ${clean(r.queryItem)} -> ${clean(r.stringId)}${r.preferredName && r.preferredName !== r.queryItem ? ` (preferred ${clean(r.preferredName)})` : ""}${r.annotation ? ` · ${clean(r.annotation)}` : ""}`),
  ].join("\n")
}

export async function interactionPartners(a: { identifier: string; species?: number; limit?: number }): Promise<string> {
  const ident = clean(a.identifier)
  if (!ident) throw new SourceError("identifier is required")
  const species = checkTaxon(a.species)
  const limit = a.limit ?? 15
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new SourceError("limit must be between 1 and 50")
  const params = new URLSearchParams({ identifiers: ident, species: String(species), limit: String(limit), caller_identity: "string-db-mcp" })
  const rows: any[] = await getJson(`/json/interaction_partners?${params.toString()}`)
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return `STRING has no interaction partners for ${ident} in taxon ${species}.`
  return [
    `Interaction partners of ${ident} (taxon ${species}) - ${list.length} returned:`,
    "",
    ...list.map((r) => `- ${clean(r.preferredName_B) || clean(r.stringId_B)} · combined score ${Number(r.score).toFixed(3)}${r.nscore !== undefined ? ` · nscore ${Number(r.nscore).toFixed(3)}` : ""}${r.escore !== undefined ? ` · experimental ${Number(r.escore).toFixed(3)}` : ""}`),
  ].join("\n")
}
