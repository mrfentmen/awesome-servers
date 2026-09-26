export class OpenLibraryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenLibraryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-openlibrary-mcp/1.0 (https://github.com/mrfentmen)"
const BASE = "https://openlibrary.org"
const COVERS = "https://covers.openlibrary.org/b/id"

interface SearchDoc {
  title?: string
  author_name?: string[]
  first_publish_year?: number
  key?: string
  cover_i?: number
  edition_count?: number
  language?: string[]
}

/**
 * Every record Open Library serves shares these optional fields. Anything the
 * tools read is declared here; the rest of the payload is ignored.
 */
interface OpenLibraryRecord extends SearchDoc {
  description?: unknown
  subjects?: string[]
  covers?: number[]
  first_publish_date?: string
  first_sentence?: unknown
  authors?: { key?: string }[]
  publish_date?: string
  publishers?: string[]
  number_of_pages?: number
  isbn_13?: string[]
  isbn_10?: string[]
  languages?: { key?: string }[]
  name?: string
  birth_date?: string
  death_date?: string
  alternate_names?: string[]
  bio?: unknown
  links?: { title?: string; url?: string }[]
  docs?: SearchDoc[]
  numFound?: number
  entries?: OpenLibraryRecord[]
  size?: number
  location?: string
  type?: { key?: string }
}

/**
 * Open Library answers some merged/deleted IDs with a 200 redirect record
 * ({"type":{"/type/redirect"},"location":"/works/OL...W"}) instead of a 404,
 * so follow those before giving up.
 */
async function req(path: string): Promise<OpenLibraryRecord> {
  let target = path
  for (let hop = 0; hop < 4; hop++) {
    let res: Response
    try {
      res = await fetch(BASE + target, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
      })
    } catch (e) {
      throw new OpenLibraryError(`Network error: ${(e as Error).message}`)
    }
    if (res.status === 404) throw new OpenLibraryError(`Not found (404) for ${target}`)
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300)
      throw new OpenLibraryError(`HTTP ${res.status}: ${body}`)
    }
    const data: OpenLibraryRecord = await res.json()
    const location = typeof data?.location === "string" ? data.location : ""
    if (data?.type?.key === "/type/redirect" && location) {
      // location is a path like "/works/OL893414W"; strip a trailing .json if present.
      target = `${location.replace(/\.json$/, "")}.json`
      continue
    }
    return data
  }
  throw new OpenLibraryError(`Too many redirects for ${path}`)
}

function textOf(value: unknown): string {
  if (typeof value !== "object" || value === null) return ""
  const row = value as { value?: unknown }
  return "value" in row ? String(row.value) : ""
}

/** Open Library returns descriptions/bios as a string or as { value: string }. */
function asText(value: unknown, max = 800): string {
  const raw = typeof value === "string" ? value : textOf(value)
  const clean = raw.replace(/\r/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\n{3,}/g, "\n\n").trim()
  if (!clean) return ""
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

const idPart = (id: string, prefix: string) => id.replace(`${prefix}/`, "").replace(/^\//, "").trim()

const keyToString = (key: unknown) => (typeof key === "string" ? key.replace(/^\//, "") : "")

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

async function search(params: URLSearchParams): Promise<string> {
  const d = await req(`/search.json?${params.toString()}`)
  const docs: SearchDoc[] = Array.isArray(d?.docs) ? d.docs : []
  if (!docs.length) return "No books found."
  const head = `${(d?.numFound ?? docs.length).toLocaleString()} match(es), showing ${docs.length}:`
  return (
    `${head}\n` +
    docs
      .map((b, i) => {
        const authors = (b.author_name ?? []).slice(0, 3).join(", ")
        const bits = [
          authors || "unknown author",
          b.first_publish_year ? `${b.first_publish_year}` : "",
          b.edition_count ? `${b.edition_count} edition(s)` : "",
        ].filter(Boolean)
        const cover = b.cover_i ? `\n   cover: ${COVERS}/${b.cover_i}-M.jpg` : ""
        return `${i + 1}. ${b.title ?? "Untitled"} — ${bits.join(" | ")}\n   work: ${b.key ?? "?"}${cover}`
      })
      .join("\n")
  )
}

export function searchBooks(query: string, limit = 10): Promise<string> {
  const p = new URLSearchParams({ q: query, limit: String(Math.min(Math.max(limit, 1), 25)) })
  return search(p)
}

export function searchByAuthor(name: string, limit = 10): Promise<string> {
  const p = new URLSearchParams({ author: name, limit: String(Math.min(Math.max(limit, 1), 25)) })
  return search(p)
}

export function searchBySubject(subject: string, limit = 10): Promise<string> {
  const p = new URLSearchParams({ subject, limit: String(Math.min(Math.max(limit, 1), 25)) })
  return search(p)
}

// ---------------------------------------------------------------------------
// Single records
// ---------------------------------------------------------------------------

export async function getWork(workId: string): Promise<string> {
  const id = idPart(workId, "/works/")
  const w = await req(`/works/${encodeURIComponent(id)}.json`)
  const lines = [`${w?.title ?? "Untitled"} (works/${id})`]
  const desc = asText(w?.description)
  if (desc) lines.push("", desc)
  const subjects = Array.isArray(w?.subjects) ? w.subjects.slice(0, 12) : []
  if (subjects.length) lines.push("", `Subjects: ${subjects.join(", ")}`)
  const meta: string[] = []
  if (w?.first_publish_date) meta.push(`First published: ${w.first_publish_date}`)
  if (Array.isArray(w?.covers) && w.covers.length) meta.push(`Cover: ${COVERS}/${w.covers[0]}-L.jpg`)
  if (meta.length) lines.push("", meta.join("\n"))
  const first = asText(w?.first_sentence, 300)
  if (first) lines.push("", `First sentence: ${first}`)
  return lines.join("\n")
}

export async function getEdition(editionId: string): Promise<string> {
  const id = idPart(editionId, "/books/")
  const b = await req(`/books/${encodeURIComponent(id)}.json`)
  const lines = [`${b?.title ?? "Untitled"} (books/${id})`]
  const meta: string[] = []
  const authors = Array.isArray(b?.authors)
    ? b.authors.map((a: any) => keyToString(a?.key)).filter(Boolean)
    : []
  if (authors.length) meta.push(`Authors: ${authors.join(", ")}`)
  if (b?.publish_date) meta.push(`Published: ${b.publish_date}`)
  if (Array.isArray(b?.publishers) && b.publishers.length) meta.push(`Publisher: ${b.publishers.join(", ")}`)
  if (b?.number_of_pages) meta.push(`Pages: ${b.number_of_pages}`)
  const isbn = [...(b?.isbn_13 ?? []), ...(b?.isbn_10 ?? [])]
  if (isbn.length) meta.push(`ISBN: ${isbn.slice(0, 6).join(", ")}`)
  const langs = Array.isArray(b?.languages) ? b.languages.map((l: any) => keyToString(l?.key).replace("languages/", "")).filter(Boolean) : []
  if (langs.length) meta.push(`Languages: ${langs.join(", ")}`)
  if (Array.isArray(b?.covers) && b.covers[0]) meta.push(`Cover: ${COVERS}/${b.covers[0]}-L.jpg`)
  if (meta.length) lines.push("", ...meta)
  return lines.join("\n")
}

export async function getAuthor(authorId: string): Promise<string> {
  const id = idPart(authorId, "/authors/")
  const a = await req(`/authors/${encodeURIComponent(id)}.json`)
  const lines = [`${a?.name ?? "Unknown author"} (authors/${id})`]
  const meta: string[] = []
  if (a?.birth_date) meta.push(`Born: ${a.birth_date}`)
  if (a?.death_date) meta.push(`Died: ${a.death_date}`)
  if (Array.isArray(a?.alternate_names) && a.alternate_names.length) {
    meta.push(`Also known as: ${a.alternate_names.slice(0, 5).join(", ")}`)
  }
  if (meta.length) lines.push("", ...meta)
  const bio = asText(a?.bio, 900)
  if (bio) lines.push("", bio)
  const links = Array.isArray(a?.links) ? a.links.filter((l: any) => l?.url).slice(0, 3) : []
  if (links.length) lines.push("", "Links:", ...links.map((l: any) => `  ${l.title ?? l.url}: ${l.url}`))
  return lines.join("\n")
}

export async function authorWorks(authorId: string, limit = 20): Promise<string> {
  const id = idPart(authorId, "/authors/")
  const d = await req(`/authors/${encodeURIComponent(id)}/works.json?limit=${Math.min(Math.max(limit, 1), 50)}`)
  const entries: any[] = Array.isArray(d?.entries) ? d.entries : []
  if (!entries.length) return `No works listed for ${id}.`
  return (
    `${(d?.size ?? entries.length).toLocaleString()} work(s) by ${id}, showing ${entries.length}:\n` +
    entries
      .map((w, i) => {
        const year = typeof w?.first_publish_date === "string" ? ` (${w.first_publish_date.slice(0, 4)})` : ""
        return `${i + 1}. ${w?.title ?? "Untitled"}${year} — ${keyToString(w?.key)}`
      })
      .join("\n")
  )
}
