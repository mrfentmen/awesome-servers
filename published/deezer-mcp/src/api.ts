/**
 * Deezer — keyless public API client.
 */
const BASE = "https://api.deezer.com"
const SOURCE = "Deezer"
const UA = "deezer-mcp"

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

export async function search(a: { query: string, type?: string, limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 25)
  const d = await getJson(`/search/${a.type}?q=${encodeURIComponent(query)}&limit=${limit}`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return `Deezer has no ${a.type} matching "${query}".`
  const rows = list.map((x, i) => {
    if (a.type === "artist") return `${i + 1}. ${clean(x.name)} · ${clean(x.nb_album)} albums · ${clean(x.nb_fan)} fans`
    if (a.type === "album") return `${i + 1}. ${clean(x.title)} — ${clean(x.artist?.name)} · ${clean(x.nb_tracks)} tracks`
    return `${i + 1}. ${clean(x.title)} — ${clean(x.artist?.name)} · ${clean(x.album?.title)}`
  })
  return section(`${d?.total ?? list.length} ${a.type}(s) match "${query}"`, rows)
}

export async function artist(a: { artistId: number }): Promise<string> {
  if (!Number.isInteger(a.artistId) || a.artistId < 1) throw new SourceError("artistId must be a positive integer")
  const d = await getJson(`/artist/${a.artistId}`)
  if (!d?.id) throw new SourceError(`Deezer has no artist ${a.artistId}`)
  return section(clean(d.name), [bullet("Albums", d.nb_album), bullet("Fans", d.nb_fan), bullet("Link", d.link)])
}

export async function album(a: { albumId: number }): Promise<string> {
  if (!Number.isInteger(a.albumId) || a.albumId < 1) throw new SourceError("albumId must be a positive integer")
  const d = await getJson(`/album/${a.albumId}`)
  if (!d?.id) throw new SourceError(`Deezer has no album ${a.albumId}`)
  const tracks: any[] = Array.isArray(d.tracks?.data) ? d.tracks.data : []
  return section(`${clean(d.title)} — ${clean(d.artist?.name)}`, [
    bullet("Released", d.release_date),
    bullet("Tracks", d.nb_tracks),
    ...tracks.slice(0, 20).map((t, i) => `${i + 1}. ${clean(t.title)} (${clean(t.duration)}s)`),
  ])
}

export async function track(a: { trackId: number }): Promise<string> {
  if (!Number.isInteger(a.trackId) || a.trackId < 1) throw new SourceError("trackId must be a positive integer")
  const d = await getJson(`/track/${a.trackId}`)
  if (!d?.id) throw new SourceError(`Deezer has no track ${a.trackId}`)
  return section(`${clean(d.title)} — ${clean(d.artist?.name)}`, [
    bullet("Album", d.album?.title),
    bullet("Duration", clean(d.duration) + "s"),
    bullet("BPM", d.bpm),
    bullet("ISRC", d.isrc),
    bullet("Link", d.link),
  ])
}

export async function artist_top_tracks(a: { artistId: number, limit?: number }): Promise<string> {
  if (!Number.isInteger(a.artistId) || a.artistId < 1) throw new SourceError("artistId must be a positive integer")
  const limit = clampLimit(a.limit, 10, 50)
  const d = await getJson(`/artist/${a.artistId}/top?limit=${limit}`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return `No top tracks for artist ${a.artistId}.`
  return section(`${list.length} top track(s)`, list.map((t, i) => `${i + 1}. ${clean(t.title)} · ${clean(t.duration)}s`))
}

export async function chart_tracks(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const d = await getJson(`/chart/0/tracks?limit=${limit}`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return "Deezer returned an empty chart."
  return section(`${list.length} chart track(s)`, list.map((t, i) => `${i + 1}. ${clean(t.title)} — ${clean(t.artist?.name)}`))
}
