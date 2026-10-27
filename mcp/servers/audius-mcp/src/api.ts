/**
 * Audius client — decentralized music platform (underground/independent).
 * Public discovery endpoints are keyless but require an app_name.
 * Docs: https://docs.audius.org/developers/server/ — the discovery
 * provider is a rotating host; we pin the stable community endpoint.
 */
const BASE = "https://discoveryprovider.audius.co/v1"
const APP = "audius-mcp"

export class AudiusError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${BASE}${path}${sep}app_name=${APP}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) throw new AudiusError(`Audius error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as { data?: T }
  return body.data as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudiusTrack {
  id: string
  title: string
  genre?: string
  mood?: string
  duration?: number
  play_count?: number
  release_date?: string
  permalink?: string
  user?: { name?: string; handle?: string }
}

export interface AudiusUser {
  id: string
  name: string
  handle: string
  bio?: string
  follower_count?: number
  followee_count?: number
  track_count?: number
  is_verified?: boolean
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function trendingTracks(genre?: string, limit = 8): Promise<AudiusTrack[]> {
  const g = genre && genre !== "all" ? `&genre=${encodeURIComponent(genre)}` : ""
  const data = await getJson<AudiusTrack[]>(`/tracks/trending?limit=${limit}${g}`)
  return data ?? []
}

export async function searchTracks(query: string, limit = 8): Promise<AudiusTrack[]> {
  const data = await getJson<AudiusTrack[]>(
    `/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`
  )
  return data ?? []
}

export async function searchUsers(query: string, limit = 8): Promise<AudiusUser[]> {
  const data = await getJson<AudiusUser[]>(
    `/users/search?query=${encodeURIComponent(query)}&limit=${limit}`
  )
  return data ?? []
}

export async function getUserTracks(userId: string, limit = 8): Promise<AudiusTrack[]> {
  const data = await getJson<AudiusTrack[]>(`/users/${userId}/tracks?limit=${limit}`)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtDur(sec?: number): string {
  if (!sec) return ""
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

export function formatTrack(t: AudiusTrack, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${t.title}`
  const artist = t.user?.name ? ` — ${t.user.name}${t.user.handle ? ` (@${t.user.handle})` : ""}` : ""
  const meta = [t.genre, t.mood, fmtDur(t.duration), t.play_count ? `${t.play_count.toLocaleString()} plays` : ""]
    .filter(Boolean)
    .join(" · ")
  const lines = [head + artist, meta, t.permalink ?? `https://audius.co${t.permalink ?? ""}`].filter(Boolean)
  return lines.join("\n")
}

export function formatUser(u: AudiusUser, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${u.name}${u.is_verified ? " ✓" : ""} (@${u.handle})`
  const meta = [
    u.follower_count ? `${u.follower_count.toLocaleString()} followers` : "",
    u.track_count ? `${u.track_count} tracks` : "",
  ]
    .filter(Boolean)
    .join(" · ")
  const lines = [head, meta, u.bio ? u.bio.slice(0, 200) : "", `https://audius.co/${u.handle}`].filter(Boolean)
  return lines.join("\n")
}
