/**
 * Minimal Setlist.fm REST API v1.0 client.
 *
 * Docs: https://api.setlist.fm/docs/1.0/index.html
 * Requires a free API key (https://www.setlist.fm/settings/api) in the
 * SETLISTFM_API_KEY env var.
 */

const BASE = "https://api.setlist.fm/rest/1.0"

export class SetlistApiError extends Error {}

function apiKey(): string {
  const key = process.env.SETLISTFM_API_KEY
  if (!key) {
    throw new SetlistApiError(
      "SETLISTFM_API_KEY env var is missing. Get a free key at " +
        "https://www.setlist.fm/settings/api and export it before " +
        "starting this server."
    )
  }
  return key
}

async function get<T>(path: string): Promise<T> {
  const key = apiKey()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "x-api-key": key,
    },
  })
  if (!res.ok) {
    throw new SetlistApiError(
      `Setlist.fm API error ${res.status}: ${res.statusText}`
    )
  }
  return (await res.json()) as T
}

export interface Artist {
  mbid: string
  name: string
  disambiguation?: string
  url: string
}

export interface Setlist {
  id: string
  eventDate: string
  tour?: { name: string }
  venue?: { name: string; city?: { name: string; country?: { name: string } } }
  sets?: {
    set: {
      name?: string
      song: { name: string; info?: string; cover?: { name: string } }[]
    }[]
  }
  url: string
}

export interface ArtistSearchResult {
  artist: Artist
}

export interface SetlistsResult {
  setlist: Setlist[]
  total: number
  page: number
  itemsPerPage: number
}

export async function searchArtists(name: string): Promise<ArtistSearchResult[]> {
  const data = await get<{ artist: ArtistSearchResult[] }>(
    `/search/artists?artistName=${encodeURIComponent(name)}&p=1&sort=sortName`
  )
  return data.artist ?? []
}

export async function getArtistByMbid(mbid: string): Promise<Artist> {
  return await get<Artist>(`/artist/${mbid}`)
}

export async function getSetlists(
  artistMbid: string,
  page = 1,
  year?: number
): Promise<SetlistsResult> {
  const yearParam = year ? `&year=${year}` : ""
  return await get<SetlistsResult>(
    `/artist/${artistMbid}/setlists?p=${page}${yearParam}`
  )
}

export async function getSetlist(id: string): Promise<Setlist> {
  return await get<Setlist>(`/setlist/${id}`)
}

/** Search setlists containing a specific song, used to count live plays. */
export async function searchSetlistsBySong(
  artistMbid: string,
  songName: string,
  page = 1
): Promise<SetlistsResult> {
  return await get<SetlistsResult>(
    `/search/setlists?artistMbid=${artistMbid}&songName=${encodeURIComponent(
      songName
    )}&p=${page}`
  )
}

export function formatSetlist(s: Setlist): string {
  const city = s.venue?.city
    ? `${s.venue.city.name}${s.venue.city.country ? ", " + s.venue.city.country.name : ""}`
    : "unknown city"
  const venue = s.venue?.name ?? "unknown venue"
  const tour = s.tour ? ` (${s.tour.name} tour)` : ""
  const songs =
    s.sets?.set
      ?.flatMap((set) => set.song)
      .map((song, i) => `${i + 1}. ${song.name}${song.info ? ` [${song.info}]` : ""}`)
      .join("\n") ?? "no setlist data"
  return (
    `Setlist ${s.id} — ${s.eventDate} @ ${venue}, ${city}${tour}\n` +
    `URL: ${s.url}\n${songs}`
  )
}
