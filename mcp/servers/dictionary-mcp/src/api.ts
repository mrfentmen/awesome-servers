/**
 * Free Dictionary — keyless public API client.
 */
const BASE = "https://api.dictionaryapi.dev"
const SOURCE = "Free Dictionary"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "dictionary-mcp", accept },
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

function entries(d: any, word: string): any[] {
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) throw new SourceError(`the dictionary has no entry for "${word}"`)
  return rows
}

function phonetic(row: any): string {
  const listed: any[] = Array.isArray(row?.phonetics) ? row.phonetics : []
  const withAudio = listed.find((p) => p?.audio)
  const text = clean(row?.phonetic) || clean(listed.find((p) => p?.text)?.text)
  return [text, withAudio?.audio ? `audio ${clean(withAudio.audio)}` : "", withAudio?.sourceUrl ? `source ${clean(withAudio.sourceUrl)}` : ""]
    .filter(Boolean).join(" · ")
}

function sameOrigin(url: string): string {
  return clean(url)
}

export async function define(a: { word: string; definitionsPerSense?: number }): Promise<string> {
  const word = clean(a.word).toLowerCase()
  if (!/^[a-z][a-z'-]{0,44}$/.test(word)) throw new SourceError("word must be letters, apostrophes or dashes")
  const per = a.definitionsPerSense ?? 3
  if (!Number.isInteger(per) || per < 1 || per > 6) throw new SourceError("definitionsPerSense must be between 1 and 6")
  const d = await getJson(`/api/v2/entries/en/${encodeURIComponent(word)}`)
  const rows = entries(d, word)
  const blocks: string[] = [`${clean(rows[0].word)}${phonetic(rows[0]) ? ` - ${phonetic(rows[0])}` : ""}`]
  for (const row of rows) {
    for (const meaning of row.meanings ?? []) {
      const defs: any[] = Array.isArray(meaning.definitions) ? meaning.definitions.slice(0, per) : []
      blocks.push(`\n${clean(meaning.partOfSpeech) || "unknown part of speech"}`)
      for (const def of defs) {
        blocks.push(`  - ${clean(def.definition)}`)
        if (def.example) blocks.push(`    e.g. ${clean(def.example)}`)
      }
      if (meaning.synonyms?.length) blocks.push(`    synonyms: ${meaning.synonyms.slice(0, 8).join(", ")}`)
    }
  }
  const sources = [...new Set(rows.flatMap((r) => (r.sourceUrls ?? []).map(sameOrigin)).filter(Boolean))]
  if (sources.length) blocks.push(`\nSource: ${sources.join(", ")}`)
  return blocks.join("\n")
}

export async function synonyms(a: { word: string }): Promise<string> {
  const word = clean(a.word).toLowerCase()
  if (!/^[a-z][a-z'-]{0,44}$/.test(word)) throw new SourceError("word must be letters, apostrophes or dashes")
  const d = await getJson(`/api/v2/entries/en/${encodeURIComponent(word)}`)
  const rows = entries(d, word)
  const blocks: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const meaning of row.meanings ?? []) {
      const syn: string[] = (meaning.synonyms ?? []).filter((s: string) => !seen.has(s))
      syn.forEach((s) => seen.add(s))
      const ant: string[] = meaning.antonyms ?? []
      const fromDefs = (meaning.definitions ?? []).flatMap((def: any) => def.synonyms ?? [])
      for (const s of fromDefs) {
        if (!seen.has(s)) { seen.add(s); syn.push(s) }
      }
      if (!syn.length && !ant.length) continue
      blocks.push(`${clean(meaning.partOfSpeech) || "?"}:`)
      if (syn.length) blocks.push(`  synonyms: ${syn.slice(0, 12).join(", ")}`)
      if (ant.length) blocks.push(`  antonyms: ${ant.slice(0, 12).join(", ")}`)
    }
  }
  if (!blocks.length) return `The dictionary lists no synonyms or antonyms for "${word}".`
  return [
    `${clean(rows[0].word)}${phonetic(rows[0]) ? ` - ${phonetic(rows[0])}` : ""}`,
    "",
    ...blocks,
  ].join("\n")
}
