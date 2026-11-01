/**
 * KKBOX client. OAuth2 client-credentials against account.kkbox.com, then the
 * v1.1 catalogue API. Every catalogue read is scoped by a territory code.
 */
const TOKEN_URL = "https://account.kkbox.com/oauth2/token"
const BASE = "https://api.kkbox.com/v1.1"

export class KkboxError extends Error {}

export interface KkboxImage {
  url?: string
  width?: number
  height?: number
}

export interface KkboxArtist {
  id: string
  name: string
  url?: string
  images?: KkboxImage[]
}

export interface KkboxAlbum {
  id: string
  name: string
  url?: string
  release_date?: string
  track_count?: number
  artist?: KkboxArtist
  images?: KkboxImage[]
}

export interface KkboxTrack {
  id: string
  name: string
  duration?: number
  url?: string
  isrc?: string
  album?: { id?: string; name?: string }
  artists?: KkboxArtist[]
}

export interface KkboxPlaylist {
  id: string
  title?: string
  name?: string
  description?: string
  url?: string
  images?: KkboxImage[]
}

export interface KkboxChart {
  id: string
  name: string
  updated_at?: string
  tracks?: { id?: string; name?: string }[]
}

export interface KkboxCategory {
  id: string
  name: string
  subcategories?: KkboxCategory[]
}

export interface KkboxPaging {
  limit?: number
  offset?: number
  total?: number
}

export interface KkboxList<T> {
  data?: T[]
  paging?: KkboxPaging
  summary?: Record<string, number>
}

export interface KkboxSearchResult {
  tracks?: KkboxList<KkboxTrack>
  albums?: KkboxList<KkboxAlbum>
  artists?: KkboxList<KkboxArtist>
  playlists?: KkboxList<KkboxPlaylist>
}

export interface KkboxTokens {
  access_token?: string
  expires_in?: number
  token_type?: string
}

let cachedToken: { value: string; expiresAt: number } | null = null

function credentials(): { id: string; secret: string } {
  const id = process.env.KKBOX_CLIENT_ID
  const secret = process.env.KKBOX_CLIENT_SECRET
  if (!id || !secret) {
    throw new KkboxError(
      "Missing KKBOX_CLIENT_ID and KKBOX_CLIENT_SECRET. Create an app at https://developer.kkbox.com to get a client id and secret."
    )
  }
  return { id, secret }
}

/** Territory scopes the catalogue (TW, HK, SG, MY, JP). */
export function territory(): string {
  return (process.env.KKBOX_TERRITORY || "TW").toUpperCase()
}

async function accessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 30_000) return cachedToken.value

  const { id, secret } = credentials()
  const basic = Buffer.from(`${id}:${secret}`).toString("base64")
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new KkboxError(`KKBOX token error ${res.status} ${res.statusText}`)

  const data = (await res.json()) as KkboxTokens
  if (!data.access_token) throw new KkboxError("KKBOX returned no access token")

  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  }
  return cachedToken.value
}

type Param = string | number | undefined

async function get<T>(path: string, params: Record<string, Param> = {}): Promise<T> {
  const token = await accessToken()
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set("territory", territory())
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new KkboxError(`KKBOX error ${res.status} for ${path}`)
  return (await res.json()) as T
}

export function search(
  q: string,
  type: "track" | "album" | "artist" | "playlist",
  limit = 20,
  offset = 0
): Promise<KkboxSearchResult> {
  return get<KkboxSearchResult>("/search", { q, type, limit, offset })
}

export function getTrack(trackId: string): Promise<KkboxTrack> {
  return get<KkboxTrack>(`/tracks/${encodeURIComponent(trackId)}`)
}

export function getAlbum(albumId: string): Promise<KkboxAlbum> {
  return get<KkboxAlbum>(`/albums/${encodeURIComponent(albumId)}`)
}

export function getArtist(artistId: string): Promise<KkboxArtist> {
  return get<KkboxArtist>(`/artists/${encodeURIComponent(artistId)}`)
}

export function getPlaylist(playlistId: string): Promise<KkboxPlaylist> {
  return get<KkboxPlaylist>(`/playlists/${encodeURIComponent(playlistId)}`)
}

export function getArtistAlbums(artistId: string, limit = 20, offset = 0): Promise<KkboxList<KkboxAlbum>> {
  return get<KkboxList<KkboxAlbum>>(`/artists/${encodeURIComponent(artistId)}/albums`, { limit, offset })
}

export function getAlbumTracks(albumId: string, limit = 30, offset = 0): Promise<KkboxList<KkboxTrack>> {
  return get<KkboxList<KkboxTrack>>(`/albums/${encodeURIComponent(albumId)}/tracks`, { limit, offset })
}

export function getCharts(): Promise<{ data?: KkboxChart[] }> {
  return get<{ data?: KkboxChart[] }>("/charts")
}

export function getFeaturedPlaylists(limit = 20, offset = 0): Promise<KkboxList<KkboxPlaylist>> {
  return get<KkboxList<KkboxPlaylist>>("/featured-playlists", { limit, offset })
}

export function getNewReleases(): Promise<{ data?: KkboxAlbum[]; paging?: KkboxPaging }> {
  return get<{ data?: KkboxAlbum[]; paging?: KkboxPaging }>("/new-release-categories")
}

export function getCategories(): Promise<{ data?: KkboxCategory[] }> {
  return get<{ data?: KkboxCategory[] }>("/categories")
}

/** KKBOX durations are milliseconds. */
export function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "?:??"
  const total = Math.round(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function artistNames(artists?: KkboxArtist[]): string {
  if (!artists || artists.length === 0) return "unknown artist"
  return artists.map((a) => a.name).filter(Boolean).join(", ")
}

export function formatTrack(track: KkboxTrack, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${track.name}`,
    `${artistNames(track.artists)}${track.album?.name ? ` — ${track.album.name}` : ""}`,
    `duration ${formatDuration(track.duration)}`,
  ]
  if (track.url) lines.push(track.url)
  return lines.join("\n")
}

export function formatAlbum(album: KkboxAlbum, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [`${prefix}${album.name}`]
  if (album.artist?.name) lines.push(`by ${album.artist.name}`)
  const meta = [
    album.release_date ? `released ${album.release_date}` : "",
    typeof album.track_count === "number" ? `${album.track_count} tracks` : "",
  ].filter(Boolean)
  if (meta.length > 0) lines.push(meta.join(", "))
  if (album.url) lines.push(album.url)
  return lines.join("\n")
}

export function formatArtist(artist: KkboxArtist): string {
  const lines = [artist.name]
  if (artist.url) lines.push(artist.url)
  return lines.join("\n")
}

export function formatPlaylist(playlist: KkboxPlaylist, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const title = playlist.title || playlist.name || "(untitled playlist)"
  const lines = [`${prefix}${title}`]
  if (playlist.description) lines.push(playlist.description.slice(0, 200))
  if (playlist.url) lines.push(playlist.url)
  return lines.join("\n")
}

export function formatChart(chart: KkboxChart, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [`${prefix}${chart.name}`]
  if (chart.updated_at) lines.push(`updated ${chart.updated_at}`)
  if (chart.tracks && chart.tracks.length > 0) {
    const top = chart.tracks
      .slice(0, 10)
      .map((t, i) => `${i + 1}. ${t.name ?? "(unknown)"}`)
      .join("\n")
    lines.push(top)
  }
  return lines.join("\n")
}

export function formatCategory(category: KkboxCategory, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const subs = category.subcategories?.map((s) => s.name).filter(Boolean) ?? []
  return `${prefix}${category.name}${subs.length > 0 ? ` (${subs.slice(0, 6).join(", ")})` : ""}`
}

export function formatPaging(paging?: KkboxPaging): string {
  if (!paging) return ""
  const parts: string[] = []
  if (typeof paging.total === "number") parts.push(`${paging.total} total`)
  if (typeof paging.offset === "number") parts.push(`offset ${paging.offset}`)
  if (typeof paging.limit === "number") parts.push(`limit ${paging.limit}`)
  return parts.length > 0 ? `\n\n(${parts.join(", ")})` : ""
}
