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
// ---- batch-5 tools: ISBN lookup, every edition of a work, subject overview (2026-09-27) ----

// Fields these tools read that the shared record type does not declare.
// Interfaces merge, so this only widens what is already there.
interface OpenLibraryRecord {
  subtitle?: string
  by_statement?: string
  ocaid?: string
  edition_name?: string
  physical_format?: string
  publish_places?: string[]
  work_count?: number
  subject_type?: string
  works?: { key?: string; title?: string; authors?: { name?: string }[]; first_publish_year?: number; cover_id?: number }[]
}

/**
 * An ISBN carries a check digit, so a mistyped one can be rejected before a
 * request is spent on it.
 */
function normalizeIsbn(input: string): string {
  const clean = (input ?? "").replace(/[^0-9Xx]/g, "").toUpperCase()
  if (clean.length === 10) {
    if (!/^[0-9]{9}[0-9X]$/.test(clean)) throw new OpenLibraryError(`"${input}" is not a valid ISBN-10.`)
    let sum = 0
    for (let i = 0; i < 10; i++) sum += (clean[i] === "X" ? 10 : Number(clean[i])) * (10 - i)
    if (sum % 11 !== 0) throw new OpenLibraryError(`ISBN-10 "${clean}" fails its check digit, so it is a typo.`)
    return clean
  }
  if (clean.length === 13) {
    if (!/^[0-9]{13}$/.test(clean)) throw new OpenLibraryError(`"${input}" is not a valid ISBN-13.`)
    let sum = 0
    for (let i = 0; i < 13; i++) sum += Number(clean[i]) * (i % 2 === 0 ? 1 : 3)
    if (sum % 10 !== 0) throw new OpenLibraryError(`ISBN-13 "${clean}" fails its check digit, so it is a typo.`)
    return clean
  }
  throw new OpenLibraryError(`"${input}" has ${clean.length} digit(s); an ISBN has 10 or 13.`)
}

const asList = (value: string[] | undefined, max = 4) => (value ?? []).slice(0, max).join(", ")

const languageList = (languages: { key?: string }[] | undefined) =>
  (languages ?? [])
    .map((l) => (l.key ?? "").replace("/languages/", ""))
    .filter(Boolean)
    .slice(0, 8)
    .join(", ")

/** Resolve an ISBN to its edition record, without walking through search first. */
export async function editionByIsbn(args: { isbn: string }): Promise<string> {
  const isbn = normalizeIsbn(args.isbn)
  const edition = await req(`/isbn/${isbn}.json`)
  const authors = (edition.authors ?? []).map((a) => keyToString(a.key)).filter(Boolean)
  const cover = (edition.covers ?? []).find((id) => id > 0)
  return [
    `Edition for ISBN ${isbn}`,
    `  ${edition.title ?? "Untitled"}${edition.subtitle ? `: ${edition.subtitle}` : ""}`,
    `  format: ${edition.physical_format ?? edition.edition_name ?? "not stated"} | pages: ${edition.number_of_pages ?? "not stated"}`,
    `  published: ${edition.publish_date ?? "not stated"}${edition.publish_places?.length ? ` in ${asList(edition.publish_places, 3)}` : ""}`,
    `  publisher(s): ${asList(edition.publishers) || "not stated"}`,
    authors.length ? `  author record(s): ${authors.map((k) => `/${k}`).join(", ")}` : `  by: ${edition.by_statement ?? "not stated"}`,
    `  work: ${keyToString(edition.works?.[0]?.key) || "not linked"}`,
    `  ISBN-13: ${asList(edition.isbn_13, 3) || "none"} | ISBN-10: ${asList(edition.isbn_10, 2) || "none"}`,
    cover ? `  cover: ${COVERS}/${cover}-L.jpg` : "  no cover on this edition",
    edition.ocaid ? `  scanned copy: https://archive.org/details/${edition.ocaid}` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * Every edition Open Library knows for a work — the answer to "is there a later
 * or translated printing", which a single work record does not contain.
 */
export async function workEditions(args: { workId: string; limit?: number }): Promise<string> {
  const id = idPart(args.workId, "/works/")
  if (!id) throw new OpenLibraryError("Give a work id such as OL27448W.")
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50)
  const d = await req(`/works/${encodeURIComponent(id)}/editions.json?limit=${limit}`)
  const entries = Array.isArray(d.entries) ? d.entries : []
  if (!entries.length) return `Work ${id} has no editions listed.`
  const total = typeof d.size === "number" ? d.size : entries.length
  const years = entries
    .map((e) => Number(String(e.publish_date ?? "").match(/\d{4}/)?.[0] ?? 0))
    .filter((y) => y > 0)
    .sort((a, b) => a - b)
  const publishers = [...new Set(entries.flatMap((e) => e.publishers ?? []))].slice(0, 10)
  return [
    `Editions of work ${id}: ${total.toLocaleString()} listed, showing ${entries.length}`,
    years.length ? `  publication years in this page: ${years[0]} to ${years[years.length - 1]}` : "  no dated editions in this page",
    publishers.length ? `  publishers: ${publishers.join(", ")}` : "",
    "",
    ...entries.map((e, i) => {
      const bits = [
        e.publish_date ?? "",
        asList(e.publishers, 1) || "",
        e.number_of_pages ? `${e.number_of_pages}pp` : "",
        languageList(e.languages) || "",
      ].filter(Boolean)
      return `${i + 1}. ${e.title ?? "Untitled"} — ${bits.join(" | ") || "no details"}\n   edition: ${keyToString(e.key) || "?"}`
    }),
    total > entries.length ? `\nRaise limit (max 50) to see more than ${entries.length} of ${total.toLocaleString()}.` : "",
  ].filter((line) => line !== "").join("\n")
}

/** A subject as an entity: how many works it holds and which ones Open Library ranks first. */
export async function subjectOverview(args: { subject: string; limit?: number }): Promise<string> {
  const slug = (args.subject ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/^\/subjects\//, "")
  if (!slug) throw new OpenLibraryError("Give a subject, e.g. 'science fiction' or 'cooking'.")
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 25)
  const d = await req(`/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`)
  const works = Array.isArray(d.works) ? d.works : []
  if (typeof d.work_count !== "number" && !works.length) throw new OpenLibraryError(`Open Library has no subject "${args.subject}".`)
  return [
    `Subject "${d.name ?? slug}" (${d.subject_type ?? "subject"})`,
    `  works: ${typeof d.work_count === "number" ? d.work_count.toLocaleString() : "unknown"}`,
    "",
    works.length ? "Top works:" : "No works listed for this subject.",
    ...works.map((w, i) => {
      const authors = (w.authors ?? []).map((a) => a.name).filter(Boolean).slice(0, 2).join(", ")
      return `${i + 1}. ${w.title ?? "Untitled"}${authors ? ` — ${authors}` : ""}${w.first_publish_year ? ` (${w.first_publish_year})` : ""}\n   work: ${keyToString(w.key) || "?"}`
    }),
  ].join("\n")
}
