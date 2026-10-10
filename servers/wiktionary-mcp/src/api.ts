const BASE = "https://en.wiktionary.org/w/api.php"
const UA = "mrfentmen-wiktionary-mcp/1.0 (https://github.com/mrfentmen)"
export class WiktionaryError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new WiktionaryError("Wiktionary rate limit hit, wait and retry")
  if (!res.ok) throw new WiktionaryError(`Wiktionary error ${res.status}`)
  return (await res.json()) as T
}

export async function define(args: { word?: string }): Promise<string> {
  const word = (args.word ?? "").trim()
  if (!word) throw new WiktionaryError("Provide a word to look up")
  const d = await get<any>(`${BASE}?action=query&prop=extracts&titles=${encodeURIComponent(word)}&explaintext=1&format=json&origin=*`)
  const pages = d?.query?.pages ?? {}
  const page = Object.values(pages)[0] as any
  if (!page || page?.missing !== undefined) return `No entry for "${word}"`
  const extract = page?.extract ?? ""
  if (!extract) return `No definition for "${word}"`
  const cleaned = extract
    .replace(/\n==+\s*English\s*==+\n/, "")
    .replace(/====[^=]*====/g, "")
    .replace(/==[^=]*==/g, "")
    .split("\n")
    .filter((l: string) => l.trim())
    .slice(0, 25)
  return `# ${word}\n\n${cleaned.join("\n")}`
}

// ---- muxB tools:

interface WikiPage {
  pageid?: number
  title?: string
  missing?: unknown
}

function firstPage(data: any): WikiPage | null {
  const pages = (data?.query?.pages ?? {}) as Record<string, WikiPage>
  const page = Object.values(pages)[0]
  if (!page || page.missing !== undefined) return null
  return page
}

export interface WordLanguagesArgs {
  word: string
  limit?: number
}

export async function wordLanguages(args: WordLanguagesArgs): Promise<string> {
  const word = (args.word ?? "").trim()
  if (!word) throw new WiktionaryError("Provide a word to look up")
  const limit = Math.max(1, Math.min(args.limit ?? 25, 100))
  const d = await get<any>(
    `${BASE}?action=query&prop=langlinks&lllimit=${limit}&titles=${encodeURIComponent(word)}&format=json&origin=*`,
  )
  const page = firstPage(d)
  if (!page) return `No entry for "${word}"`
  const links = (page as any).langlinks as Array<{ lang?: string; "*"?: string }> | undefined
  if (!links?.length) return `No interlanguage links recorded for "${word}".`
  return `Wiktionary languages for "${word}" (${links.length} shown):\n` +
    links.map((l, i) => `${i + 1}. ${l.lang ?? "?"} -> ${l["*"] ?? "not reported"}`).join("\n")
}

export interface EntrySectionsArgs {
  word: string
}

export async function entrySections(args: EntrySectionsArgs): Promise<string> {
  const word = (args.word ?? "").trim()
  if (!word) throw new WiktionaryError("Provide a word to look up")
  const d = await get<any>(
    `${BASE}?action=parse&prop=tocdata&page=${encodeURIComponent(word)}&format=json&origin=*`,
  )
  if (d?.error) throw new WiktionaryError(String(d.error?.info ?? "Wiktionary could not parse that title"))
  const sections = d?.parse?.tocdata?.sections as Array<Record<string, unknown>> | undefined
  if (!sections?.length) return `No section outline published for "${word}".`
  return `Section outline of the Wiktionary entry "${word}" (${sections.length} sections):\n` +
    sections
      .map((s) => {
        const level = Number(s.tocLevel ?? 1)
        const number = String(s.number ?? "?")
        return `${"  ".repeat(Math.max(0, level - 1))}${number} ${String(s.line ?? "?")}`
      })
      .join("\n")
}

export interface WordRevisionsArgs {
  word: string
  limit?: number
}

export async function wordRevisions(args: WordRevisionsArgs): Promise<string> {
  const word = (args.word ?? "").trim()
  if (!word) throw new WiktionaryError("Provide a word to look up")
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const d = await get<any>(
    `${BASE}?action=query&prop=revisions&rvprop=timestamp%7Cuser%7Ccomment&rvlimit=${limit}&titles=${encodeURIComponent(word)}&format=json&origin=*`,
  )
  const page = firstPage(d)
  if (!page) return `No entry for "${word}"`
  const revisions = (page as any).revisions as Array<Record<string, string>> | undefined
  if (!revisions?.length) return `No revision history recorded for "${word}".`
  return `Latest revisions of "${word}" (${revisions.length} shown):\n` +
    revisions
      .map((r, i) => {
        const when = String(r.timestamp ?? "?").slice(0, 10)
        const who = String(r.user ?? "?").slice(0, 60)
        const comment = String(r.comment ?? "").replace(/\s+/g, " ").trim()
        return `${i + 1}. ${when} by ${who}${comment ? ` - ${comment.slice(0, 120)}` : " - no edit summary"}`
      })
      .join("\n")
}
