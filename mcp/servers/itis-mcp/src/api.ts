/**
 * ITIS (Integrated Taxonomic Information System) JSON service client, keyless.
 * Docs: https://www.itis.gov/ws_description.html
 */
const BASE = "https://www.itis.gov/ITISWebService/jsonservice"

export class ItisError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "itis-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new ItisError(`ITIS error ${res.status}`)
  return (await res.json()) as T
}

export interface Taxon {
  tsn: string
  name: string
  author?: string
  kingdom?: string
  rank?: string
}

export async function searchScientific(name: string, limit = 5): Promise<Taxon[]> {
  const data = await getJson<Raw>(`/searchByScientificName?srchKey=${encodeURIComponent(name)}`)
  const rows: Raw[] = Array.isArray(data.scientificNames) ? data.scientificNames : []
  return rows.slice(0, limit).map((r) => ({
    tsn: String(r.tsn ?? "?"),
    name: String(r.combinedName ?? "?"),
    author: r.author,
  }))
}

export async function commonNames(tsn: string, limit = 10): Promise<string[]> {
  if (!/^\d+$/.test(tsn.trim())) throw new ItisError(`TSN must be numeric, got "${tsn}".`)
  const data = await getJson<Raw>(`/getCommonNamesFromTSN?tsn=${tsn.trim()}`)
  const rows: Raw[] = Array.isArray(data.commonNames) ? data.commonNames : []
  return rows.slice(0, limit).map((r) => String(r.commonName)).filter(Boolean)
}

export async function hierarchy(tsn: string): Promise<string[]> {
  if (!/^\d+$/.test(tsn.trim())) throw new ItisError(`TSN must be numeric, got "${tsn}".`)
  const data = await getJson<Raw>(`/getHierarchyDownFromTSN?tsn=${tsn.trim()}`)
  const rows: Raw[] = Array.isArray(data.hierarchyList) ? data.hierarchyList : []
  return rows.slice(0, 15).map((r) => `${String(r.rankName ?? "?")}: ${String(r.taxonName ?? "?")}`)
}

export function formatTaxon(t: Taxon, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${t.tsn}] ${t.name}${t.author ? ` ${t.author}` : ""}`
}

// ---- muxF tools:
interface FullRecord {
  tsn?: string
  scientificName?: { combinedName?: string; author?: string; kingdom?: string; unitName1?: string }
  taxRank?: { rankName?: string; rankId?: string; kingdomName?: string }
  kingdom?: { kingdomName?: string; kingdomId?: string }
  taxonAuthor?: { authorship?: string; updateDate?: string }
  credibilityRating?: { credRating?: string }
  completenessRating?: { completeness?: string; rankId?: string }
  currencyRating?: { taxonCurrency?: string; rankId?: string }
  usage?: { taxonUsageRating?: string }
  dateData?: { initialTimeStamp?: string; updateDate?: string }
  unacceptReason?: { unacceptReason?: string | null }
  commonNameList?: { commonNames?: Array<{ commonName?: string; language?: string; tsn?: string } | null> }
  synonymList?: { synonyms?: Array<{ sciName?: string; combinedName?: string; tsn?: string; author?: string | null; acceptedName?: string | null } | null> }
  commentList?: { comments?: Array<{ comment?: string; source?: string; updateDate?: string } | null> }
  expertList?: { experts?: Array<{ name?: string; comment?: string; updateDate?: string } | null> }
  publicationList?: { publications?: Array<{ publicationName?: string; author?: string; actualPubDate?: string; isbn?: string; issn?: string } | null> }
  geographicDivisionList?: { geoDivisions?: Array<{ geographicValue?: string; updateDate?: string } | null> }
  jurisdictionalOriginList?: { jurisdictionalOrigins?: Array<{ jurisdictionValue?: string } | null> }
  otherSourceList?: { otherSources?: Array<{ referenceFor?: string; acquisitionDate?: string } | null> }
  hierarchyUp?: HierarchyUp
  parentTSN?: { parentTsn?: string }
}

interface HierarchyUp {
  taxonName?: string
  parentName?: string
  parentTsn?: string
  rankName?: string
  author?: string
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function or(value: unknown): string {
  return clean(value) || 'not reported'
}

function list<T>(value: Array<T | null> | undefined): T[] {
  return Array.isArray(value) ? value.filter((x): x is T => x !== null && x !== undefined) : []
}

// ITIS still carries legacy Latin-1 bytes in some names, so a strict UTF-8
// decode would throw on an otherwise good record. Fall back rather than fail.
async function fullRecord(tsn: string): Promise<FullRecord> {
  const res = await fetch(`${BASE}/getFullRecordFromTSN?tsn=${encodeURIComponent(tsn)}`, {
    headers: { 'User-Agent': 'itis-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new ItisError(`ITIS error ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  let body: string
  try {
    body = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    body = new TextDecoder('latin1').decode(bytes)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new ItisError(`ITIS returned a record for TSN ${tsn} that is not valid JSON.`)
  }
  if (!parsed || typeof parsed !== 'object') throw new ItisError(`ITIS returned no full record for TSN ${tsn}.`)
  return parsed as FullRecord
}

function numericTsn(value: unknown): string {
  const raw = String(value ?? '').trim()
  return /^\d+$/.test(raw) ? raw : ''
}

/** Every synonym ITIS holds for a taxon, with the name each one redirects to and whether the taxon itself is accepted. */
export async function synonymReport(args: { tsn?: string; limit?: number }): Promise<string> {
  const tsn = numericTsn((args.tsn ?? '').toString())
  if (!tsn) throw new ItisError(`TSN must be numeric, got "${args.tsn ?? ''}".`)
  const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 25), 60))
  const d = await fullRecord(tsn)
  const name = or(d.scientificName?.combinedName)
  const synonyms = list(d.synonymList?.synonyms)
  const usage = or(d.usage?.taxonUsageRating)
  const lines = [
    `Synonyms of ${name} (TSN ${tsn})`,
    `Usage rating: ${usage}${usage && usage.toLowerCase() !== 'valid' ? ' - this taxon is not the accepted one, so treat it as a synonym itself' : ''}`,
    `Synonyms on file: ${synonyms.length}`,
  ]
  if (!synonyms.length) {
    lines.push('ITIS holds no synonym list for this taxon.')
    return lines.join('\n')
  }
  const withAccepted = synonyms.filter((s) => clean(s.acceptedName))
  lines.push(`Of those, ${withAccepted.length} name the taxon they are accepted under inside ITIS.`)
  for (const s of synonyms.slice(0, limit)) {
    const parts = [`- ${or(s.sciName ?? s.combinedName)}`]
    if (clean(s.author)) parts.push(` ${clean(s.author)}`)
    if (clean(s.tsn)) parts.push(` | TSN ${s.tsn}`)
    if (clean(s.acceptedName)) parts.push(` -> accepted as ${clean(s.acceptedName)}`)
    lines.push(parts.join(''))
  }
  if (synonyms.length > limit) lines.push(`... and ${synonyms.length - limit} more synonym(s).`)
  return lines.join('\n')
}

// ---- gap3d tools:

// ITIS holds a geographic distribution on the full record and no tool on this
// server reports it. taxon_profile counts "12 geographic division(s)" and stops,
// so the answer a field user actually wants - where does this taxon occur - is
// not reachable. This prints the divisions and the jurisdictional origins, and
// walks the parent chain to say whether the coverage is inherited or its own.

interface RangeRecord {
  tsn?: string
  scientificName?: { combinedName?: string }
  geographicDivisionList?: { geoDivisions?: Array<{ geographicValue?: string; updateDate?: string } | null> | null } | null
  jurisdictionalOriginList?: { jurisdictionalOrigins?: Array<{ jurisdictionValue?: string } | null> | null } | null
  parentTSN?: { parentTsn?: string } | null
}

function rangeEntries<T>(value: Array<T | null> | undefined | null): T[] {
  return Array.isArray(value) ? value.filter((x): x is T => x !== null && x !== undefined) : []
}

function rangeStamp(value: string | undefined): string {
  return value ? String(value).slice(0, 10) : 'no date recorded'
}

export interface TaxonRangeArgs {
  tsn?: string
  limit?: number
  ancestors?: number
}

