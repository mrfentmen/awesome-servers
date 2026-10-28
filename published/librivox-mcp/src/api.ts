/**
 * LibriVox client. Keyless. Public-domain audiobooks read by volunteers:
 * catalog search, per-book detail, chapter lists and download links.
 */
const BASE = "https://librivox.org/api/feed/audiobooks"

export class LibriVoxError extends Error {}

export interface Author {
  first_name?: string
  last_name?: string
  dob?: string
  dod?: string
}

export interface Section {
  section_number?: string
  title?: string
  listen_url?: string
  playtime?: string
  readers?: Array<{ display_name?: string }>
}

export interface Book {
  id?: string
  title?: string
  description?: string
  language?: string
  copyright_year?: string
  num_sections?: string
  totaltime?: string
  url_librivox?: string
  url_zip_file?: string
  url_rss?: string
  url_text_source?: string
  url_iarchive?: string
  authors?: Author[]
  sections?: Section[]
}

interface Body {
  books?: Book[]
  error?: string
}

async function get(params: Record<string, string>): Promise<Body> {
  const url = new URL(BASE)
  for (const [k, v] of Object.entries({ ...params, format: "json" })) url.searchParams.set(k, v)
  const res = await fetch(url, {
    headers: { "User-Agent": "librivox-mcp/1.0 (awesome-servers)" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new LibriVoxError(`LibriVox error ${res.status}`)
  const body = (await res.json()) as Body
  if (body.error) throw new LibriVoxError(body.error)
  return body
}

export function authorName(a: Author): string {
  return [a.first_name, a.last_name].filter(Boolean).join(" ")
}

export function bookLine(b: Book): string {
  const authors = (b.authors ?? []).map(authorName).join(", ") || "unknown author"
  return `#${b.id} ${b.title} — ${authors} (${b.num_sections ?? "?"} sections, ${b.totaltime ?? "?"})`
}

export async function searchByTitle(title: string, limit: number): Promise<Book[]> {
  return (await get({ title, limit: String(limit) })).books ?? []
}

export async function searchByAuthor(author: string, limit: number): Promise<Book[]> {
  return (await get({ author, limit: String(limit) })).books ?? []
}

export async function detail(id: number): Promise<Book | undefined> {
  return (await get({ id: String(id), extended: "1" })).books?.[0]
}

export async function browse(limit: number, offset: number): Promise<Book[]> {
  return (await get({ limit: String(limit), offset: String(offset) })).books ?? []
}

export function detailText(b: Book): string {
  const authors = (b.authors ?? [])
    .map((a) => `${authorName(a)}${a.dob ? ` (${a.dob}–${a.dod ?? ""})` : ""}`)
    .join(", ")
  return [
    `#${b.id} ${b.title}`,
    `author: ${authors || "unknown"}`,
    `language: ${b.language ?? "?"} | year: ${b.copyright_year ?? "?"}`,
    `sections: ${b.num_sections ?? "?"} | runtime: ${b.totaltime ?? "?"}`,
    "",
    (b.description ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 900),
  ].join("\n")
}

export function sectionsText(b: Book, limit: number): string {
  const rows = (b.sections ?? []).slice(0, limit)
  if (!rows.length) return "No chapters listed."
  return rows
    .map(
      (s) =>
        `${s.section_number}. ${s.title} — ${s.playtime ?? "?"}s — ${(s.readers ?? [])
          .map((r) => r.display_name)
          .filter(Boolean)
          .join(", ")}\n   ${s.listen_url ?? ""}`
    )
    .join("\n")
}

export function linksText(b: Book): string {
  return [
    `catalog: ${b.url_librivox ?? "-"}`,
    `zip of all mp3s: ${b.url_zip_file ?? "-"}`,
    `podcast rss: ${b.url_rss ?? "-"}`,
    `text source: ${b.url_text_source ?? "-"}`,
    `internet archive: ${b.url_iarchive ?? "-"}`,
  ].join("\n")
}
