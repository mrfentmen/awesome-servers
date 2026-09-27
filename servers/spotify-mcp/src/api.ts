/**
 * Spotify Web API client. Needs SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET
 * (free at https://developer.spotify.com/dashboard). Uses client-credentials
 * grant (catalog endpoints only, no user data). Token cached in memory.
 * Docs: https://developer.spotify.com/documentation/web-api
 */
export class SpotifyError extends Error {}

let cached: { token: string; exp: number } | null = null

async function appToken(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) {
    throw new SpotifyError("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (free at developer.spotify.com/dashboard).")
  }
  if (cached && cached.exp > Date.now() + 60000) return cached.token
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "User-Agent": "spotify-mcp/1.0",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new SpotifyError(`Spotify OAuth failed (${res.status}). Check client id/secret.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.access_token) throw new SpotifyError("Spotify OAuth returned no token.")
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cached.token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { "User-Agent": "spotify-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${await appToken()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new SpotifyError("Spotify refused (401/403). Check credentials.")
  if (res.status === 404) throw new SpotifyError("Not found on Spotify.")
  if (res.status === 429) throw new SpotifyError("Spotify rate limit hit; wait a bit and retry.")
  if (!res.ok) throw new SpotifyError(`Spotify error ${res.status}`)
  return (await res.json()) as T
}

export interface SearchItem {
  kind: string
  id: string
  name: string
  extra?: string
}

export async function searchCatalog(query: string, kind: "album" | "artist" | "track", limit = 5): Promise<SearchItem[]> {
  if (!query.trim()) throw new SpotifyError("Query is empty.")
  const qs = new URLSearchParams({ q: query.trim(), type: kind, limit: String(Math.min(Math.max(limit, 1), 50)) })
  const data = await api<Raw>(`/search?${qs}`)
  const bucket: Raw = data[`${kind}s`] ?? {}
  const rows: Raw[] = Array.isArray(bucket.items) ? bucket.items : []
  return rows.slice(0, limit).map((it) => ({
    kind,
    id: String(it.id),
    name: String(it.name ?? "?"),
    extra:
      kind === "track"
        ? `${((it.artists ?? []) as Raw[]).map((a) => a.name).join(", ")} · ${it.album?.name ?? ""}`.slice(0, 80)
        : kind === "album"
          ? `${((it.artists ?? []) as Raw[]).map((a) => a.name).join(", ")} · ${it.release_date ?? ""}`.slice(0, 80)
          : it.genres?.length ? `genres: ${(it.genres as string[]).slice(0, 3).join(", ")}` : undefined,
  }))
}

export async function getAlbum(id: string): Promise<Raw> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  return await api<Raw>(`/albums/${encodeURIComponent(id.trim())}`)
}

export async function getArtist(id: string): Promise<Raw> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  return await api<Raw>(`/artists/${encodeURIComponent(id.trim())}`)
}

export function formatItem(it: SearchItem, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${it.id}] ${it.name}${it.extra ? ` — ${it.extra}` : ""}`
}

export function formatAlbum(a: Raw): string {
  const artists = ((a.artists ?? []) as Raw[]).map((x) => x.name).join(", ")
  const tracks = `${a.total_tracks ?? "?"} tracks`
  return `[${String(a.id)}] ${String(a.name ?? "?")} — ${artists}\n${String(a.album_type ?? "album")} · ${String(a.release_date ?? "?")} · ${tracks}${a.label ? ` · ${a.label}` : ""}\n${a.external_urls?.spotify ?? ""}`.trim()
}

export function formatArtist(a: Raw): string {
  const followers = a.followers?.total !== undefined ? `${Number(a.followers.total).toLocaleString()} followers` : ""
  return `[${String(a.id)}] ${String(a.name ?? "?")}${followers ? ` — ${followers}` : ""}${a.genres?.length ? `\nGenres: ${(a.genres as string[]).slice(0, 5).join(", ")}` : ""}\n${a.external_urls?.spotify ?? ""}`.trim()
}

export async function getTrack(id: string): Promise<Raw> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  return await api<Raw>(`/tracks/${encodeURIComponent(id.trim())}`)
}

export async function artistTop(id: string): Promise<string> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  const d = await api<Raw>(`/artists/${encodeURIComponent(id.trim())}/top-tracks?market=US`)
  const rows: Raw[] = Array.isArray(d.tracks) ? d.tracks : []
  if (!rows.length) return "No top tracks."
  return rows.slice(0, 10).map((t, i) => `${i + 1}. ${String(t.name ?? "?")} (pop ${t.popularity ?? "?"})`).join("\n")
}

export async function artistAlbums(id: string): Promise<string> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  const d = await api<Raw>(`/artists/${encodeURIComponent(id.trim())}/albums?limit=10&market=US`)
  const rows: Raw[] = Array.isArray(d.items) ? d.items : []
  if (!rows.length) return "No albums."
  return rows.map((a, i) => `${i + 1}. ${String(a.name ?? "?")} (${String(a.release_date ?? "?").slice(0, 4)})`).join("\n")
}

export async function newReleases(limit = 10): Promise<string> {
  const d = await api<Raw>(`/browse/new-releases?limit=${Math.min(Math.max(limit, 1), 50)}`)
  const rows: Raw[] = Array.isArray(d.albums?.items) ? d.albums.items : []
  if (!rows.length) return "No new releases."
  return rows.map((a, i) => `${i + 1}. ${String(a.name ?? "?")} — ${((a.artists ?? []) as Raw[]).map((x) => x.name).join(", ")}`).join("\n")
}

export async function getEpisode(id: string): Promise<Raw> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  return await api<Raw>(`/episodes/${encodeURIComponent(id.trim())}?market=US`)
}

export async function getShow(id: string): Promise<Raw> {
  if (!/^[\w-]+$/.test(id.trim())) throw new SpotifyError(`Not a Spotify id: "${id}".`)
  return await api<Raw>(`/shows/${encodeURIComponent(id.trim())}?market=US`)
}

export async function browseCategories(limit = 10): Promise<string> {
  const d = await api<Raw>(`/browse/categories?limit=${Math.min(Math.max(limit, 1), 50)}`)
  const rows: Raw[] = Array.isArray(d.categories?.items) ? d.categories.items : []
  if (!rows.length) return "No categories."
  return rows.map((c, i) => `${i + 1}. ${String(c.name ?? "?")} [${String(c.id ?? "?")}]`).join("\n")
}

export function formatTrack(t: Raw): string {
  const artists = ((t.artists ?? []) as Raw[]).map((x) => x.name).join(", ")
  return `[${String(t.id)}] ${String(t.name ?? "?")} — ${artists}\nAlbum: ${String(t.album?.name ?? "?")} | ${Math.round(Number(t.duration_ms ?? 0) / 1000)}s | pop ${t.popularity ?? "?"}${t.external_urls?.spotify ? `\n${t.external_urls.spotify}` : ""}`.trim()
}
