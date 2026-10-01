/**
 * UK Parliament Members API client, keyless.
 * Docs: https://members-api.parliament.uk/
 */
const BASE = "https://members-api.parliament.uk/api"

export class ParliamentError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "ukparliament-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new ParliamentError("Not found in UK Parliament data.")
  if (!res.ok) throw new ParliamentError(`UK Parliament error ${res.status}`)
  return (await res.json()) as T
}

export interface MemberHit {
  id: number
  name: string
  party?: string
  constituency?: string
}

function partyOf(v: Raw): string | undefined {
  const p = v.latestParty ?? v.party
  return p ? String(p.name ?? p) : undefined
}

export async function searchMembers(name: string, limit = 5): Promise<MemberHit[]> {
  const data = await getJson<Raw>(`/Members/Search?Name=${encodeURIComponent(name)}&skip=0&take=${Math.min(Math.max(limit, 1), 20)}`)
  const items: Raw[] = Array.isArray(data.items) ? data.items : []
  return items.slice(0, limit).map((it) => {
    const v: Raw = it.value ?? it
    return {
      id: Number(v.id),
      name: String(v.nameDisplayAs ?? v.nameListAs ?? "?"),
      party: partyOf(v),
      constituency: v.latestHouseMembership?.membershipFrom ? String(v.latestHouseMembership.membershipFrom) : undefined,
    }
  })
}

export interface MemberDetails extends MemberHit {
  fullTitle?: string
  gender?: string
  house?: string
  status?: string
}

export async function getMember(id: string): Promise<MemberDetails | null> {
  if (!/^\d+$/.test(id.trim())) throw new ParliamentError(`Member id must be numeric, got "${id}".`)
  const data = await getJson<Raw>(`/Members/${id.trim()}`)
  const v: Raw = data.value ?? data
  if (!v || v.id === undefined) return null
  const houseRaw: unknown = v.latestHouseMembership?.house
  return {
    id: Number(v.id),
    name: String(v.nameDisplayAs ?? v.nameListAs ?? "?"),
    party: partyOf(v),
    constituency: v.latestHouseMembership?.membershipFrom ? String(v.latestHouseMembership.membershipFrom) : undefined,
    fullTitle: v.nameFullTitle ? String(v.nameFullTitle) : undefined,
    gender: v.gender ? String(v.gender) : undefined,
    house: houseRaw === 1 || houseRaw === "1" ? "House of Commons" : houseRaw === 2 || houseRaw === "2" ? "House of Lords" : houseRaw ? String(houseRaw) : undefined,
    status: v.latestHouseMembership?.membershipStatus?.statusDescription
      ? String(v.latestHouseMembership.membershipStatus.statusDescription)
      : undefined,
  }
}

export function formatHit(h: MemberHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${h.id}] ${h.name}${h.party ? ` (${h.party})` : ""}${h.constituency ? ` — ${h.constituency}` : ""}`
}

export function formatMember(m: MemberDetails): string {
  const lines = [
    `[${m.id}] ${m.fullTitle ?? m.name}`,
    m.party ? `Party: ${m.party}` : "",
    m.constituency ? `Represents: ${m.constituency}` : "",
    m.house ? `House: ${m.house}` : "",
    m.status ? `Status: ${m.status}` : "",
    m.gender ? `Gender: ${m.gender}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxC tools:

interface ParlBiography {
  value?: {
    id?: number
    nameDisplayAs?: string
    nameListAs?: string
    latestParty?: { name?: string }
    mostRecentConstituency?: { name?: string }
    dateOfBirth?: string
    dateOfDeath?: string
    gender?: string
    representations?: Array<{ name?: string; house?: number; startDate?: string; endDate?: string; party?: { name?: string }; partyId?: number }>
  }
}

interface ParlContact {
  value?: Array<{ contactType?: string; value?: string }>
}

