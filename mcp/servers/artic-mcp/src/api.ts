/**
 * Art Institute of Chicago — keyless public API client.
 */
const BASE = "https://api.artic.edu/api/v1"
const SOURCE = "Art Institute of Chicago"
const UA = "artic-mcp"

export class SourceError extends Error {}

async function request(path: string, init?: RequestInit, timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
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

export async function getJson(path: string, init?: RequestInit): Promise<any> {
  const res = await request(path, init)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
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

export async function search_artworks(a: { query: string, limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 20)
  const fields = "id,title,artist_title,date_display,image_id"
  const d = await getJson(`/artworks/search?q=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return `No artwork matches "${query}".`
  return section(`${d?.pagination?.total ?? list.length} artwork(s) match "${query}"`, list.map((x, i) => `${i + 1}. ${clean(x.title)} — ${clean(x.artist_title) || "unknown artist"} · ${clean(x.date_display) || "no date"} (id ${clean(x.id)})`))
}

export async function artwork(a: { artworkId: number }): Promise<string> {
  if (!Number.isInteger(a.artworkId) || a.artworkId < 1) throw new SourceError("artworkId must be a positive integer")
  const d = await getJson(`/artworks/${a.artworkId}?fields=id,title,artist_title,date_display,medium_display,place_of_origin,dimensions,credit_line,image_id`)
  const x = d?.data
  if (!x?.id) throw new SourceError(`No artwork ${a.artworkId}`)
  return section(clean(x.title), [
    bullet("Artist", x.artist_title),
    bullet("Date", x.date_display),
    bullet("Medium", x.medium_display),
    bullet("Origin", x.place_of_origin),
    bullet("Dimensions", x.dimensions),
    bullet("Credit", x.credit_line),
    bullet("Image", x.image_id ? `https://www.artic.edu/iiif/2/${clean(x.image_id)}/full/843,/0/default.jpg` : ""),
  ])
}

export async function artist_search(a: { query: string, limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 20)
  const d = await getJson(`/artists/search?q=${encodeURIComponent(query)}&limit=${limit}&fields=id,title,birth_date,death_date`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return `No artist matches "${query}".`
  return section(`${d?.pagination?.total ?? list.length} artist(s) match "${query}"`, list.map((x, i) => `${i + 1}. ${clean(x.title)} (${clean(x.birth_date) || "?"}–${clean(x.death_date) || "?"}) · id ${clean(x.id)}`))
}

export async function artist(a: { artistId: number }): Promise<string> {
  if (!Number.isInteger(a.artistId) || a.artistId < 1) throw new SourceError("artistId must be a positive integer")
  const d = await getJson(`/artists/${a.artistId}`)
  const x = d?.data
  if (!x?.id) throw new SourceError(`No artist ${a.artistId}`)
  const bio = String(x.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return section(clean(x.title), [bullet("Born", x.birth_date), bullet("Died", x.death_date), bullet("Type", x.agent_type_title), bullet("Bio", bio.slice(0, 700))])
}

export async function artwork_image_url(a: { artworkId: number, width?: number }): Promise<string> {
  if (!Number.isInteger(a.artworkId) || a.artworkId < 1) throw new SourceError("artworkId must be a positive integer")
  const width = clampLimit(a.width, 843, 3000)
  const d = await getJson(`/artworks/${a.artworkId}?fields=id,title,image_id`)
  const x = d?.data
  if (!x?.id) throw new SourceError(`No artwork ${a.artworkId}`)
  if (!x.image_id) return `${clean(x.title)} has no image in the public API.`
  return `${clean(x.title)}\nhttps://www.artic.edu/iiif/2/${clean(x.image_id)}/full/${width},/0/default.jpg`
}
