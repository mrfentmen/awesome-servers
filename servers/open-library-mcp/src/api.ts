type m0_SearchDoc = { key?: string; title?: string; author_name?: string[]; author_key?: string[]; first_publish_year?: number; edition_count?: number; isbn?: string[]; cover_i?: number; language?: string[] }
type m0_SearchResult = { numFound?: number; start?: number; docs?: m0_SearchDoc[] }
type m0_Work = { title?: string; description?: string | { value?: string }; subjects?: string[]; authors?: Array<{ author?: { key?: string } }>; first_publish_date?: string; covers?: number[] }
type m0_Author = { name?: string; bio?: string | { value?: string }; birth_date?: string; death_date?: string; work_count?: number; top_work?: string }

const m0 = (() => {
const BASE = "https://openlibrary.org"
const headers = { "User-Agent": "mrfentmen-open-library-mcp/1.0 (https://github.com/mrfentmen)" }

class OpenLibraryError extends Error {}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new OpenLibraryError(`Open Library error ${res.status}`)
  return (await res.json()) as T
}

function searchBooks(query: string, limit = 10): Promise<m0_SearchResult> {
  return request<m0_SearchResult>(`/search.json?q=${encodeURIComponent(query)}&limit=${limit}`)
}
function getWork(key: string): Promise<m0_Work> { return request<m0_Work>(`/works/${key.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, "")}.json`) }
function getAuthor(key: string): Promise<m0_Author> { return request<m0_Author>(`/authors/${key.replace(/^.*\/(authors\/)?/, "").replace(/\.json$/, "")}.json`) }
function getEditions(key: string, limit = 20): Promise<m0_SearchResult> { return request<m0_SearchResult>(`/works/${key.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, "")}/editions.json?limit=${limit}`) }

function formatBook(doc: m0_SearchDoc, index?: number): string {
  return [
    `${index === undefined ? "" : `${index + 1}. `}${doc.title ?? "Untitled"}`,
    doc.author_name?.length ? `Authors: ${doc.author_name.join(", ")}` : "",
    doc.first_publish_year ? `First published: ${doc.first_publish_year}` : "",
    doc.edition_count ? `Editions: ${doc.edition_count}` : "",
    doc.isbn?.length ? `ISBN: ${doc.isbn[0]}` : "",
    doc.key ? `m0_Work: https://openlibrary.org${doc.key}` : "",
  ].filter(Boolean).join("\n")
}
function formatWork(work: m0_Work): string {
  const description = typeof work.description === "string" ? work.description : work.description?.value
  return [`${work.title ?? "Untitled"}`, work.first_publish_date ? `First published: ${work.first_publish_date}` : "", description ? `Description: ${description.slice(0, 1400)}` : "", work.subjects?.length ? `Subjects: ${work.subjects.slice(0, 20).join(", ")}` : "", work.covers?.length ? `Cover: https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : ""].filter(Boolean).join("\n")
}
function formatAuthor(author: m0_Author): string { return [`${author.name ?? "Unknown author"}`, author.birth_date ? `Born: ${author.birth_date}` : "", author.death_date ? `Died: ${author.death_date}` : "", author.work_count ? `Works: ${author.work_count}` : "", author.top_work ? `Top work: ${author.top_work}` : "", typeof author.bio === "string" ? `Bio: ${author.bio.slice(0, 1200)}` : author.bio?.value ? `Bio: ${author.bio.value.slice(0, 1200)}` : ""].filter(Boolean).join("\n") }

return { OpenLibraryError, formatAuthor, formatBook, formatWork, getAuthor, getEditions, getWork, searchBooks };
})();

const m1 = (() => {
const UA = "mrfentmen-isbn-mcp/1.0 (https://github.com/mrfentmen)"
class IsbnError extends Error {}

function cleanIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase()
}

function validIsbn10(s: string): boolean {
  if (!/^\d{9}[\dX]$/.test(s)) return false
  let sum = 0
  for (let i = 0; i < 10; i++) {
    const v = s[i] === "X" ? 10 : Number(s[i])
    sum += v * (10 - i)
  }
  return sum % 11 === 0
}

function validIsbn13(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false
  let sum = 0
  for (let i = 0; i < 13; i++) {
    sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3)
  }
  return sum % 10 === 0
}

async function validate(args: { isbn?: string }): Promise<string> {
  const raw = (args.isbn ?? "").trim()
  if (!raw) throw new IsbnError("Provide an ISBN")
  const s = cleanIsbn(raw)
  if (s.length === 10) return `${raw} is a ${validIsbn10(s) ? "VALID" : "INVALID"} ISBN-10`
  if (s.length === 13) return `${raw} is a ${validIsbn13(s) ? "VALID" : "INVALID"} ISBN-13`
  return `${raw} is not a recognized ISBN length (10 or 13 digits)`
}

async function lookup(args: { isbn?: string }): Promise<string> {
  const raw = (args.isbn ?? "").trim()
  if (!raw) throw new IsbnError("Provide an ISBN")
  const s = cleanIsbn(raw)
  if (s.length === 10 && !validIsbn10(s)) throw new IsbnError("Invalid ISBN-10 checksum")
  if (s.length === 13 && !validIsbn13(s)) throw new IsbnError("Invalid ISBN-13 checksum")
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${s}&format=json&jscmd=data`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new IsbnError(`Open Library error ${res.status}`)
  const d = (await res.json()) as any
  const b = d?.[`ISBN:${s}`]
  if (!b) return `No book found for ISBN ${s}`
  const lines = [
    `Title: ${b.title ?? "n/a"}`,
    b.subtitle ? `Subtitle: ${b.subtitle}` : "",
    b.authors?.length ? `Authors: ${b.authors.map((a: any) => a.name).join(", ")}` : "",
    b.publishers?.length ? `Publishers: ${b.publishers.map((p: any) => p.name).join(", ")}` : "",
    b.publish_date ? `Published: ${b.publish_date}` : "",
    b.number_of_pages ? `Pages: ${b.number_of_pages}` : "",
  ].filter(Boolean)
  if (b.cover?.large) lines.push(`Cover: ${b.cover.large}`)
  return lines.join("\n")
}

return { IsbnError, lookup, validate };
})();

export const IsbnError = m1.IsbnError;
export const OpenLibraryError = m0.OpenLibraryError;
export const formatAuthor = m0.formatAuthor;
export const formatBook = m0.formatBook;
export const formatWork = m0.formatWork;
export const getAuthor = m0.getAuthor;
export const getEditions = m0.getEditions;
export const getWork = m0.getWork;
export const lookup = m1.lookup;
export const searchBooks = m0.searchBooks;
export const validate = m1.validate;
export const m0_getWork = m0.getWork;
export const m0_OpenLibraryError = m0.OpenLibraryError;
export const m0_formatAuthor = m0.formatAuthor;
export const m0_getEditions = m0.getEditions;
export const m0_getAuthor = m0.getAuthor;
export const m0_formatWork = m0.formatWork;
export const m0_searchBooks = m0.searchBooks;
export const m0_formatBook = m0.formatBook;
export const m1_IsbnError = m1.IsbnError;
export const m1_validate = m1.validate;
export const m1_lookup = m1.lookup;

// ---- muxC tools:

interface OlWorkEntry {
  key?: string
  title?: string
  first_publish_date?: string
  subjects?: string[]
  covers?: number[]
}

