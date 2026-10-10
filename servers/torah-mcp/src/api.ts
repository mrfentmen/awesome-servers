export class TorahError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TorahError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://www.sefaria.org/api"

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

function stripHtml(html: string): string {
  return html
    .replace(/<sup class="footnote-marker">.*?<\/sup>/gi, "")
    .replace(/<i class="footnote">[\s\S]*?<\/i>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanSegments(segs: unknown): string[] {
  if (!Array.isArray(segs)) return []
  return segs.map((s) => stripHtml(String(s ?? ""))).filter((s) => s.length > 0)
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new TorahError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getWeeklyPortion(latitude?: number, longitude?: number, timezone?: string): Promise<string> {
  const qs = new URLSearchParams()
  if (latitude !== undefined) qs.append("latitude", String(latitude))
  if (longitude !== undefined) qs.append("longitude", String(longitude))
  if (timezone !== undefined) qs.append("timezone", timezone)
  const qstr = qs.toString()
  const url = `${BASE}/calendars${qstr ? "?" + qstr : ""}`
  const data = (await req(url)) as { date?: string; calendar_items?: Array<{ title?: { en?: string }; displayValue?: { en?: string }; url?: string; ref?: string; category?: string }> }
  const items = data.calendar_items ?? []
  if (items.length === 0) return `No calendar items for ${data.date ?? "today"}.`
  const lines = items.map((i) => `- ${i.title?.en ?? "?"}: ${i.displayValue?.en ?? ""}${i.ref ? ` (${i.ref})` : ""}`)
  return `Jewish calendar for ${data.date ?? "today"}:\n${lines.join("\n")}`
}

export async function getTanakhText(ref: string, language?: string): Promise<string> {
  const r = ref.trim()
  if (!r) throw new TorahError("Provide a reference like 'Genesis.1', 'Exodus 20' or 'Psalms.23'.")
  const data = (await req(`${BASE}/texts/${encodeURIComponent(r)}?commentary=0`)) as {
    ref?: string; heRef?: string; text?: unknown; he?: unknown; versions?: Array<{ language?: string; versionTitle?: string }>
  };
  const en = cleanSegments(data.text)
  const he = cleanSegments(data.he)
  const out: string[] = [`${data.ref ?? r}${data.heRef ? ` / ${data.heRef}` : ""}`]
  const showHe = !language || language === "he" || language === "both"
  const showEn = !language || language === "en" || language === "both"
  if (showEn && en.length > 0) out.push(`\nEnglish:\n${en.map((v, i) => `${i + 1}. ${v}`).join("\n")}`)
  if (showHe && he.length > 0) out.push(`\nHebrew:\n${he.map((v, i) => `${i + 1}. ${v}`).join("\n")}`)
  if (out.length === 1) {
    const vers = (data.versions ?? []).map((v) => `${v.versionTitle ?? "?"} [${v.language ?? "?"}]`).join(", ")
    throw new TorahError(`No text returned for "${r}".${vers ? ` Available versions: ${vers}` : ""}`)
  }
  return pretty(out.join("\n"))
}

export async function getCommentaries(ref: string, commentator?: string, maxResults?: number): Promise<string> {
  const r = ref.trim()
  if (!r) throw new TorahError("Provide a reference like 'Genesis.1.1'.")
  const links = (await req(`${BASE}/links/${encodeURIComponent(r)}`)) as Array<{ ref?: string; category?: string }>;
  const needle = (commentator ?? "").trim().toLowerCase()
  const comm = links.filter(
    (l) => (l.category ?? "") === "Commentary" && (!needle || (l.ref ?? "").toLowerCase().includes(needle))
  )
  if (comm.length === 0) return `No commentaries found for "${r}"${needle ? ` matching "${commentator}"` : ""}.`
  const n = Math.min(Math.max(maxResults ?? 3, 1), 5)
  const parts: string[] = []
  for (const c of comm.slice(0, n)) {
    const data = (await req(`${BASE}/texts/${encodeURIComponent(c.ref ?? "")}?commentary=0`)) as {
      ref?: string; text?: unknown; he?: unknown
    };
    const en = cleanSegments(data.text).join(" ")
    const he = cleanSegments(data.he).join(" ")
    const body = (en || he).slice(0, 1500)
    parts.push(`${data.ref ?? c.ref ?? ""}:\n${body}`)
  }
  return pretty(`Commentaries on ${r} (showing ${parts.length} of ${comm.length}):\n\n${parts.join("\n\n")}`)
}

export async function getConnections(ref: string, category?: string): Promise<string> {
  const r = ref.trim()
  if (!r) throw new TorahError("Provide a verse reference like 'Genesis.1.1'.")
  const data = (await req(`${BASE}/links/${encodeURIComponent(r)}`)) as Array<{ ref?: string; category?: string; type?: string; anchorRef?: string }>;
  const needle = (category ?? "").trim().toLowerCase()
  const list = needle ? data.filter((l) => `${l.category ?? ""} ${l.type ?? ""}`.toLowerCase().includes(needle)) : data
  if (list.length === 0) return `No linked sources found for "${r}".`
  const shown = list.slice(0, 25)
  return pretty(`Sources linked to ${r} (${list.length} shown ${shown.length}):\n${shown.map((l) => `- ${l.ref ?? "?"} [${l.category ?? l.type ?? "?"}]`).join("\n")}`)
}

export async function searchTexts(query: string, size?: number): Promise<string> {
  const q = query.trim()
  if (!q) throw new TorahError("Provide a search query.")
  const n = Math.min(size ?? 5, 20)
  const data = (await req(`${BASE}/search-wrapper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, type: "text", size: n }),
  })) as { hits?: { hits?: Array<{ _id?: string; _score?: number; highlight?: { exact?: string[] } }> } };
  const hits = data.hits?.hits ?? []
  if (hits.length === 0) return `No texts match "${q}".`
  const parts = hits.map((h) => {
    const hl = (h.highlight?.exact ?? []).map((s) => stripHtml(s)).join(" … ").slice(0, 300)
    return `- ${h._id ?? "?"}${hl ? `\n  ${hl}` : ""}`
  })
  return pretty(`Results for "${q}":\n${parts.join("\n")}`)
}

// ---- muxC tools:

const SEFARIA_BASE = "https://www.sefaria.org/api"

class SefariaLookupError extends Error {}

async function sefariaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SEFARIA_BASE}${path}`, {
    headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new SefariaLookupError(`Sefaria returned ${res.status}`)
  return (await res.json()) as T
}

interface SefariaIndex {
  title?: string
  heTitle?: string
  categories?: string[]
  schema?: { nodeType?: string; depth?: number; addressTypes?: string[]; nodeTypes?: Array<{ name?: string; depth?: number }> }
  enDesc?: string
  compDate?: string
  compPlace?: string
  pubDate?: string
  pubPlace?: string
  sectionNames?: string[]
  depth?: number
}

/** The structure of a book: how Sefaria addresses it and who wrote it. */
export async function bookIndex(args: { book?: string }): Promise<string> {
  const book = (args.book ?? "").trim()
  if (!book) throw new SefariaLookupError("Provide a book name, e.g. Genesis, Psalms or Mishnah")
  let index: SefariaIndex
  try {
    index = await sefariaGet<SefariaIndex>(`/index/${encodeURIComponent(book)}`)
  } catch (e) {
    throw new SefariaLookupError(`Sefaria has no book index for "${book}": ${e instanceof Error ? e.message : String(e)}`)
  }
  const schema = index.schema ?? {}
  const nodeTypes = (schema.nodeTypes ?? []).map((n) => `${n.name ?? "?"} (depth ${n.depth ?? "?"})`)
  return [
    `${index.title ?? book}${index.heTitle ? ` / ${index.heTitle}` : ""}`,
    `Categories: ${index.categories?.length ? index.categories.join(", ") : "not reported"}`,
    `Address scheme: ${schema.nodeType ?? "not reported"} at depth ${schema.depth ?? index.depth ?? "?"}${schema.addressTypes?.length ? `, address types: ${schema.addressTypes.join(", ")}` : ""}`,
    nodeTypes.length ? `Node types: ${nodeTypes.slice(0, 10).join(", ")}` : null,
    index.sectionNames?.length ? `Sections: ${index.sectionNames.slice(0, 12).join(", ")}` : null,
    `Composition: ${index.compDate ?? "date not reported"}${index.compPlace ? `, ${index.compPlace}` : ""}`,
    `Publication: ${index.pubDate ?? "date not reported"}${index.pubPlace ? `, ${index.pubPlace}` : ""}`,
    index.enDesc ? `Description: ${index.enDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 400)}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

interface SefariaLexiconSense {
  definition?: string
  // grammar is an object of grammatical labels, e.g. {verbal_stem: "Qal"}
  grammar?: Record<string, string> | string
  senses?: SefariaLexiconSense[]
}

interface SefariaLexiconEntry {
  headword?: string
  parent_lexicon?: string
  content?: { morphology?: string; senses?: SefariaLexiconSense[] }
}

function grammarText(grammar: SefariaLexiconSense["grammar"]): string {
  if (!grammar) return ""
  if (typeof grammar === "string") return ` (${grammar})`
  const parts = Object.entries(grammar)
    .map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`)
    .filter((s) => !s.endsWith(" "))
  return parts.length ? ` (${parts.join(", ")})` : ""
}

function senseLine(sense: SefariaLexiconSense, depth = 0): string {
  const text = String(sense.definition ?? "").replace(/\s+/g, " ").trim()
  // A parent sense that only carries children is a grouping label, not a definition.
  const nested = (sense.senses ?? []).map((s) => senseLine(s, depth + 1)).join("\n")
  if (!text) return nested
  const line = `${"  ".repeat(depth + 1)}- ${text}${grammarText(sense.grammar)}`
  return nested ? `${line}\n${nested}` : line
}

/** Dictionary lookup for a Hebrew or Aramaic word, from Sefaria's lexicon. */
export async function wordLookup(args: { word?: string; limit?: number }): Promise<string> {
  const word = (args.word ?? "").trim()
  if (!word) throw new SefariaLookupError("Provide a Hebrew or Aramaic word, URL-encoded if it contains a slash")
  const limit = Math.max(1, Math.min(args.limit ?? 2, 10))
  let entries: SefariaLexiconEntry[]
  try {
    entries = await sefariaGet<SefariaLexiconEntry[]>(`/words/${encodeURIComponent(word)}`)
  } catch (e) {
    throw new SefariaLookupError(`Sefaria lexicon lookup failed for "${word}": ${e instanceof Error ? e.message : String(e)}`)
  }
  if (!Array.isArray(entries) || !entries.length) {
    return `Sefaria's lexicon has no entry for "${word}".`
  }
  const shown = entries.slice(0, limit)
  return shown
    .map((entry) => {
      const content = entry.content ?? {}
      const senses = content.senses ?? []
      return [
        `${entry.headword ?? word}${content.morphology ? ` (${content.morphology})` : ""} - ${entry.parent_lexicon ?? "lexicon not reported"}`,
        senses.length
          ? senses.map((s) => senseLine(s, 0)).join("\n")
          : "  no senses published for this entry",
      ].join("\n")
    })
    .join("\n\n")
}
