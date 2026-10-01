/**
 * STAPI (Star Trek API) client, keyless.
 * Docs: http://stapi.co/api-documentation
 * List endpoints are GET; search endpoints are POST form-encoded.
 */
const BASE = "http://stapi.co/api/v1/rest"

export class StapiError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "stapi-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new StapiError("Not found in the Star Trek database.")
  if (!res.ok) throw new StapiError(`STAPI error ${res.status}`)
  return (await res.json()) as T
}

async function postForm<T>(path: string, fields: Record<string, string>): Promise<T> {
  const body = new URLSearchParams(fields)
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "User-Agent": "stapi-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new StapiError(`STAPI error ${res.status}`)
  return (await res.json()) as T
}

export interface CharacterHit {
  uid: string
  name: string
}

export async function searchCharacters(name: string, limit = 5): Promise<CharacterHit[]> {
  const data = await postForm<Raw>("/character/search", { name, pageSize: String(Math.min(Math.max(limit, 1), 50)) })
  const rows: Raw[] = Array.isArray(data.characters) ? data.characters : []
  const total = (data.page as Raw)?.totalElements
  if (rows.length === 0 && total === 0) return []
  return rows.slice(0, limit).map((c) => ({ uid: String(c.uid), name: String(c.name ?? "?") }))
}

export interface CharacterDetails extends CharacterHit {
  gender?: string
  birthYear?: number
  birthPlace?: string
  height?: number
  maritalStatus?: string
  serialNumber?: string
}

const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined)
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined)

export async function getCharacter(uid: string): Promise<CharacterDetails | null> {
  const clean = uid.trim().toUpperCase()
  if (!/^CHMA\d+$/.test(clean)) throw new StapiError(`Not a character uid: "${uid}". Use search_characters (uids look like CHMA0000015352).`)
  const data = await getJson<Raw>(`/character?uid=${clean}`)
  const c: Raw = data.character ?? {}
  if (!c.uid) return null
  return {
    uid: String(c.uid),
    name: String(c.name ?? "?"),
    gender: str(c.gender),
    birthYear: num(c.yearOfBirth),
    birthPlace: str(c.placeOfBirth),
    height: num(c.height),
    maritalStatus: str(c.maritalStatus),
    serialNumber: str(c.serialNumber),
  }
}

export function formatCharacter(c: CharacterDetails | CharacterHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const base = `${prefix}[${c.uid}] ${c.name}`
  if (!("gender" in c)) return base
  const d = c as CharacterDetails
  const extra = [
    d.gender ? d.gender : "",
    d.birthYear ? `b. ${d.birthYear}` : "",
    d.birthPlace ? `in ${d.birthPlace}` : "",
    d.maritalStatus ? d.maritalStatus : "",
  ].filter(Boolean).join(", ")
  return extra ? `${base} — ${extra}` : base
}

// ---- muxB tools:
type StapiPage = { totalElements?: number; pageSize?: number; numberOfElements?: number; pageNumber?: number }
type StapiSpecies = Record<string, unknown> & { uid?: string; name?: string }
type StapiLocation = Record<string, unknown> & { uid?: string; name?: string }
type StapiOrganization = Record<string, unknown> & { uid?: string; name?: string }
type StapiSeries = {
  uid?: string;
  title?: string;
  abbreviation?: string;
  productionStartYear?: number;
  productionEndYear?: number;
  originalRunStartDate?: string | null;
  originalRunEndDate?: string | null;
  originalBroadcaster?: { uid?: string; name?: string } | null;
  productionCompany?: { uid?: string; name?: string } | null;
  seasonsCount?: number;
  episodesCount?: number;
  featureLengthEpisodesCount?: number;
}

// ---- gap4d2 tools:
