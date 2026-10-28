/**
 * RxNav (NLM) client. Keyless. RxNorm concept lookup, names, package NDCs and
 * the interaction checker.
 */
const BASE = "https://rxnav.nlm.nih.gov/REST"

export class RxNavError extends Error {}

export interface Concept {
  rxcui?: string
  name?: string
  synonym?: string
  tty?: string
  language?: string
}

interface DrugGroup {
  drugGroup?: {
    conceptGroup?: Array<{ tty?: string; conceptProperties?: Concept[] }>
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "rxnorm-mcp/1.0 (awesome-servers)" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new RxNavError(`RxNav error ${res.status}`)
  return (await res.json()) as T
}

export async function drugs(name: string): Promise<Concept[]> {
  const body = await get<DrugGroup>(`/drugs.json?name=${encodeURIComponent(name)}`)
  const groups = body.drugGroup?.conceptGroup ?? []
  return groups.flatMap((g) => g.conceptProperties ?? [])
}

async function normalizeOnce(name: string): Promise<string[]> {
  const body = await get<{ idGroup?: { rxnormId?: string[] } }>(
    `/rxcui.json?name=${encodeURIComponent(name)}&search=2`
  )
  return body.idGroup?.rxnormId ?? []
}

export async function normalize(name: string): Promise<string[]> {
  const direct = await normalizeOnce(name)
  if (direct.length) return direct
  // "glucophage 500mg" is not a concept; retry without the dose tail.
  const stripped = name.replace(/\b\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|%)\b/gi, "").trim()
  if (stripped && stripped !== name) return normalizeOnce(stripped)
  return []
}

export async function properties(rxcui: string): Promise<Concept | undefined> {
  const body = await get<{ properties?: Concept }>(`/rxcui/${encodeURIComponent(rxcui)}/properties.json`)
  return body.properties
}

export async function ndcs(rxcui: string): Promise<string[]> {
  const body = await get<{ ndcGroup?: { ndcList?: { ndc?: string[] } } }>(
    `/rxcui/${encodeURIComponent(rxcui)}/ndcs.json`
  )
  return body.ndcGroup?.ndcList?.ndc ?? []
}

export async function related(rxcui: string): Promise<Concept[]> {
  const body = await get<{ allRelatedGroup?: { conceptGroup?: Array<{ conceptProperties?: Concept[] }> } }>(
    `/rxcui/${encodeURIComponent(rxcui)}/allrelated.json`
  )
  return (body.allRelatedGroup?.conceptGroup ?? []).flatMap((g) => g.conceptProperties ?? [])
}

export async function spellings(name: string): Promise<string[]> {
  const body = await get<{ suggestionGroup?: { suggestionList?: { suggestion?: string[] } } }>(
    `/spellingsuggestions.json?name=${encodeURIComponent(name)}`
  )
  return body.suggestionGroup?.suggestionList?.suggestion ?? []
}

export function conceptLine(c: Concept): string {
  return `${c.rxcui}  ${c.name}${c.tty ? ` [${c.tty}]` : ""}${
    c.synonym && c.synonym !== c.name ? ` (syn: ${c.synonym})` : ""
  }`
}
