/**
 * iTunes Search API. Keyless, but it answers with text/javascript and a few
 * leading blank lines, so the body is read as text and parsed by hand.
 */
const BASE = "https://itunes.apple.com"

export class ItunesError extends Error {}

async function getJson(url: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "itunes-mcp" } })
    const body = (await res.text()).trim()
    if (!res.ok) throw new ItunesError(`iTunes responded ${res.status}`)
    if (!body.startsWith("{")) throw new ItunesError("iTunes returned an unexpected response")
    return JSON.parse(body)
  } catch (e) {
    if (e instanceof ItunesError) throw e
    if ((e as Error).name === "AbortError") throw new ItunesError("iTunes request timed out")
    if (e instanceof SyntaxError) throw new ItunesError("iTunes returned malformed JSON")
    throw new ItunesError(`iTunes request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const money = (n: unknown): string => {
  // iTunes reports prices in whole currency units (9.99), not cents.
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? `$${v.toFixed(2)}` : "free/unknown"
}

const day = (v: unknown): string => String(v ?? "").slice(0, 10) || "unknown"

function trackLine(r: any, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  const ms = Number(r.trackTimeMillis ?? 0)
  const length = ms > 0 ? ` · ${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}` : ""
  return `${prefix}${r.trackName ?? r.collectionName ?? "(untitled)"} — ${r.artistName ?? "unknown artist"}${length}\n   ${r.collectionName ?? ""} · ${day(r.releaseDate)} · ${r.primaryGenreName ?? "no genre"}`
}

function collectionLine(r: any, i = 0): string {
  return `${i + 1}. ${r.collectionName ?? r.artistName ?? "(untitled)"} — ${r.artistName ?? "unknown"}\n   ${r.trackCount ? `${r.trackCount} tracks · ` : ""}${day(r.releaseDate)} · ${r.primaryGenreName ?? "no genre"} · ${money(r.collectionPrice)}\n   Artwork: ${String(r.artworkUrl100 ?? "").replace("100x100", "600x600")}`
}

export async function searchMusic(term: string, entity: string, limit: number): Promise<string> {
  const url = `${BASE}/search?${new URLSearchParams({ term: term.trim(), entity, limit: String(limit), country: "US" })}`
  const d = await getJson(url)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No ${entity} results for "${term}".`
  const lines = rows.map((r, i) => (entity === "album" ? collectionLine(r, i) : trackLine(r, i)))
  return [`iTunes ${entity} results for "${term}" (${rows.length} of ${d.resultCount ?? rows.length}):`, "", ...lines].join("\n")
}

export async function artistAlbums(artistId: number, limit: number): Promise<string> {
  const url = `${BASE}/lookup?${new URLSearchParams({ id: String(artistId), entity: "album", limit: String(limit), country: "US" })}`
  const d = await getJson(url)
  const rows: any[] = (d.results ?? []).filter((r: any) => r.wrapperType === "collection")
  if (rows.length === 0) return `No albums for artist id ${artistId}.`
  const artist = rows[0]?.artistName ?? `artist ${artistId}`
  return [`Albums by ${artist} (${rows.length}):`, "", ...rows.map(collectionLine)].join("\n")
}

export async function albumTracks(collectionId: number): Promise<string> {
  const url = `${BASE}/lookup?${new URLSearchParams({ id: String(collectionId), entity: "song", limit: "200", country: "US" })}`
  const d = await getJson(url)
  const all: any[] = d.results ?? []
  const album = all.find((r) => r.wrapperType === "collection")
  const tracks = all.filter((r) => r.wrapperType === "track")
  if (tracks.length === 0) return `No tracks for collection id ${collectionId}.`
  const totalMs = tracks.reduce((a, t) => a + Number(t.trackTimeMillis ?? 0), 0)
  return [
    `${album?.collectionName ?? `collection ${collectionId}`} — ${album?.artistName ?? ""}`,
    `${tracks.length} tracks · ${Math.round(totalMs / 60000)} minutes total · released ${day(album?.releaseDate)}`,
    "",
    ...tracks
      .sort((a, b) => Number(a.trackNumber ?? 0) - Number(b.trackNumber ?? 0))
      .map((t) => `${String(t.trackNumber ?? "?").padStart(2, " ")}. ${t.trackName ?? "(untitled)"} — ${Math.floor(Number(t.trackTimeMillis ?? 0) / 60000)}:${String(Math.round((Number(t.trackTimeMillis ?? 0) % 60000) / 1000)).padStart(2, "0")}`),
  ].join("\n")
}

export async function searchPodcasts(term: string, limit: number): Promise<string> {
  const url = `${BASE}/search?${new URLSearchParams({ term: term.trim(), entity: "podcast", limit: String(limit), country: "US" })}`
  const d = await getJson(url)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No podcasts for "${term}".`
  const lines = rows.map(
    (r, i) =>
      `${i + 1}. ${r.collectionName ?? "(untitled)"} — ${r.artistName ?? "unknown"}\n   ${r.trackCount ? `${r.trackCount} episodes · ` : ""}${r.primaryGenreName ?? "no genre"} · ${r.feedUrl ?? "no feed listed"}`
  )
  return [`Podcasts for "${term}" (${rows.length}):`, "", ...lines].join("\n")
}

export async function searchApps(term: string, limit: number): Promise<string> {
  const url = `${BASE}/search?${new URLSearchParams({ term: term.trim(), entity: "software", limit: String(limit), country: "US" })}`
  const d = await getJson(url)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No apps for "${term}".`
  const lines = rows.map(
    (r, i) =>
      `${i + 1}. ${r.trackName ?? "(untitled)"} by ${r.artistName ?? "unknown"} — ${money(r.price)}\n   ★${r.averageUserRating ? Number(r.averageUserRating).toFixed(1) : "?"} (${r.userRatingCount ?? 0} ratings) · ${r.primaryGenreName ?? "no genre"} · ${r.formattedPrice ?? "free"}`
  )
  return [`Apps for "${term}" (${rows.length}):`, "", ...lines].join("\n")
}

export async function searchBooks(term: string, limit: number): Promise<string> {
  const url = `${BASE}/search?${new URLSearchParams({ term: term.trim(), entity: "ebook", limit: String(limit), country: "US" })}`
  const d = await getJson(url)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No ebooks for "${term}".`
  const lines = rows.map(
    (r, i) =>
      `${i + 1}. ${r.trackName ?? "(untitled)"} — ${r.artistName ?? "unknown author"}\n   ${money(r.price)} · ${r.genres?.join(", ") ?? "no genres"}`
  )
  return [`Ebooks for "${term}" (${rows.length}):`, "", ...lines].join("\n")
}
