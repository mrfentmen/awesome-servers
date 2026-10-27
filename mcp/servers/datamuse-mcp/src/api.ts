/**
 * Datamuse client. A word engine that knows how words sound and relate.
 * Keyless, no signup. Great for rhymes, thesaurus lookups, and spelling.
 */
const BASE = "https://api.datamuse.com"

export class DatamuseError extends Error {}

export interface WordHit {
  word: string
  score?: number
  numSyllables?: number
  defs?: string[]
  tags?: string[]
}

async function words(params: Record<string, string>): Promise<WordHit[]> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/words?${qs}`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new DatamuseError(`Datamuse error ${res.status}`)
  return (await res.json()) as WordHit[]
}

export function rhymesWith(word: string, limit = 10): Promise<WordHit[]> {
  return words({ rel_rhy: word, max: String(limit) })
}

export function meansLike(word: string, limit = 10): Promise<WordHit[]> {
  return words({ ml: word, max: String(limit) })
}

export function relatedTo(word: string, limit = 10): Promise<WordHit[]> {
  return words({ rel_trg: word, max: String(limit) })
}

export async function spellCheck(word: string): Promise<WordHit[]> {
  return words({ sp: word, max: "5" })
}

export async function suggest(prefix: string, limit = 10): Promise<WordHit[]> {
  const qs = new URLSearchParams({ s: prefix, max: String(limit) }).toString()
  const res = await fetch(`${BASE}/sug?${qs}`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new DatamuseError(`Datamuse error ${res.status}`)
  return (await res.json()) as WordHit[]
}

export function formatHits(hits: WordHit[]): string {
  return hits
    .map((h, i) => `${i + 1}. ${h.word}${h.numSyllables != null ? ` (${h.numSyllables} syllables)` : ""}${h.score != null ? `, score ${h.score}` : ""}`)
    .join("\n")
}

export function formatWithDefs(hits: WordHit[]): string {
  return hits
    .map((h, i) => {
      const lines = [`${i + 1}. ${h.word}`]
      for (const d of h.defs ?? []) lines.push(`   ${d}`)
      return lines.join("\n")
    })
    .join("\n")
}
