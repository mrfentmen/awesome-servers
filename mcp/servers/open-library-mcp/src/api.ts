const BASE = "https://openlibrary.org"
const headers = { "User-Agent": "mrfentmen-open-library-mcp/1.0 (https://github.com/mrfentmen)" }

export class OpenLibraryError extends Error {}
type SearchDoc = { key?: string; title?: string; author_name?: string[]; author_key?: string[]; first_publish_year?: number; edition_count?: number; isbn?: string[]; cover_i?: number; language?: string[] }
type SearchResult = { numFound?: number; start?: number; docs?: SearchDoc[] }
type Work = { title?: string; description?: string | { value?: string }; subjects?: string[]; authors?: Array<{ author?: { key?: string } }>; first_publish_date?: string; covers?: number[] }
type Author = { name?: string; bio?: string | { value?: string }; birth_date?: string; death_date?: string; work_count?: number; top_work?: string }

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new OpenLibraryError(`Open Library error ${res.status}`)
  return (await res.json()) as T
}

export function searchBooks(query: string, limit = 10): Promise<SearchResult> {
  return request<SearchResult>(`/search.json?q=${encodeURIComponent(query)}&limit=${limit}`)
}
export function getWork(key: string): Promise<Work> { return request<Work>(`/works/${key.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, "")}.json`) }
export function getAuthor(key: string): Promise<Author> { return request<Author>(`/authors/${key.replace(/^.*\/(authors\/)?/, "").replace(/\.json$/, "")}.json`) }
export function getEditions(key: string, limit = 20): Promise<SearchResult> { return request<SearchResult>(`/works/${key.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, "")}/editions.json?limit=${limit}`) }

export function formatBook(doc: SearchDoc, index?: number): string {
  return [
    `${index === undefined ? "" : `${index + 1}. `}${doc.title ?? "Untitled"}`,
    doc.author_name?.length ? `Authors: ${doc.author_name.join(", ")}` : "",
    doc.first_publish_year ? `First published: ${doc.first_publish_year}` : "",
    doc.edition_count ? `Editions: ${doc.edition_count}` : "",
    doc.isbn?.length ? `ISBN: ${doc.isbn[0]}` : "",
    doc.key ? `Work: https://openlibrary.org${doc.key}` : "",
  ].filter(Boolean).join("\n")
}
export function formatWork(work: Work): string {
  const description = typeof work.description === "string" ? work.description : work.description?.value
  return [`${work.title ?? "Untitled"}`, work.first_publish_date ? `First published: ${work.first_publish_date}` : "", description ? `Description: ${description.slice(0, 1400)}` : "", work.subjects?.length ? `Subjects: ${work.subjects.slice(0, 20).join(", ")}` : "", work.covers?.length ? `Cover: https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : ""].filter(Boolean).join("\n")
}
export function formatAuthor(author: Author): string { return [`${author.name ?? "Unknown author"}`, author.birth_date ? `Born: ${author.birth_date}` : "", author.death_date ? `Died: ${author.death_date}` : "", author.work_count ? `Works: ${author.work_count}` : "", author.top_work ? `Top work: ${author.top_work}` : "", typeof author.bio === "string" ? `Bio: ${author.bio.slice(0, 1200)}` : author.bio?.value ? `Bio: ${author.bio.value.slice(0, 1200)}` : ""].filter(Boolean).join("\n") }
