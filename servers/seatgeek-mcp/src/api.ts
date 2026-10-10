/**
 * SeatGeek API client. Needs SEATGEEK_CLIENT_ID
 * (free at https://seatgeek.com/account/develop).
 * Docs: https://platform.seatgeek.com/
 */
const BASE = "https://api.seatgeek.com/2"

export class SeatGeekError extends Error {}

function clientId(): string {
  const id = process.env.SEATGEEK_CLIENT_ID
  if (!id) throw new SeatGeekError("Set SEATGEEK_CLIENT_ID first (free at seatgeek.com/account/develop).")
  return id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...extra, client_id: clientId() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "seatgeek-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new SeatGeekError("SeatGeek refused (401/403). Check client ID and rate limits.")
  if (res.status === 404) throw new SeatGeekError("Not found.")
  if (!res.ok) throw new SeatGeekError(`SeatGeek error ${res.status}`)
  return (await res.json()) as T
}

export interface SgEvent {
  id: number
  title?: string
  date?: string
  venue?: string
  city?: string
  price?: string
  url?: string
}

export async function searchEvents(query: string, limit = 5): Promise<SgEvent[]> {
  if (!query.trim()) throw new SeatGeekError("Query is empty.")
  const data = await getJson<Raw>("/events", { q: query.trim(), per_page: String(Math.min(Math.max(limit, 1), 100)) })
  const rows: Raw[] = Array.isArray(data.events) ? data.events : []
  return rows.slice(0, limit).map(toEvent)
}

const toEvent = (e: Raw): SgEvent => ({
  id: Number(e.id),
  title: e.title ?? e.short_title,
  date: e.datetime_local ? String(e.datetime_local).slice(0, 16).replace("T", " ") : undefined,
  venue: e.venue?.name,
  city: [e.venue?.city, e.venue?.state].filter(Boolean).join(", ") || undefined,
  price: e.stats?.lowest_price !== undefined && e.stats?.lowest_price !== null
    ? `from $${e.stats.lowest_price}${e.stats?.highest_price ? ` to $${e.stats.highest_price}` : ""}`
    : undefined,
  url: e.url,
});

export async function recommendEvents(lat: number, lon: number, limit = 5): Promise<SgEvent[]> {
  if (!isFinite(lat) || lat < -90 || lat > 90) throw new SeatGeekError("Latitude must be -90..90.")
  if (!isFinite(lon) || lon < -180 || lon > 180) throw new SeatGeekError("Longitude must be -180..180.")
  const data = await getJson<Raw>("/recommendations", { lat: String(lat), lon: String(lon), per_page: String(Math.min(Math.max(limit, 1), 100)) })
  const recs: Raw[] = Array.isArray(data.recommendations) ? data.recommendations : []
  const out: SgEvent[] = []
  for (const r of recs) {
    const e: Raw = r.event ?? {}
    if (e.id === undefined) continue
    out.push(toEvent(e))
    if (out.length >= limit) break
  }
  return out
}

export function formatEvent(e: SgEvent, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const where = [e.venue, e.city].filter(Boolean).join(", ")
  return `${prefix}[${e.id}] ${e.title ?? "(untitled)"}${e.date ? ` — ${e.date}` : ""}${where ? `\n   ${where}` : ""}${e.price ? `\n   Tickets ${e.price}` : ""}${e.url ? `\n   ${e.url}` : ""}`
}

// ---- muxH tools:
// SeatGeek sells seats. Before a promoter can price a booking they need to know
// who the act is and how much of a recorded catalogue they can point at, and
// MusicBrainz publishes both without an account.

const MB = "https://musicbrainz.org/ws/2"
const SG_UA = "seatgeek-mcp/1.1 (https://github.com/mcfentmen/seatgeek-mcp; contact seatgeek-mcp@example.com)"

interface MbLife {
  begin?: string
  end?: string
  ended?: boolean
}

interface MbArtist {
  id?: string
  name?: string
  "sort-name"?: string
  disambiguation?: string
  country?: string
  type?: string
  gender?: string
  "life-span"?: MbLife
  area?: { name?: string }
  "begin-area"?: { name?: string }
  aliases?: Array<{ name?: string; locale?: string | null; type?: string; primary?: boolean | null }>
  tags?: Array<{ name?: string; count?: number }>
  relations?: Array<{ type?: string; direction?: string; begin?: string | null; end?: string | null; artist?: MbArtist; url?: { resource?: string; type?: string } }>
}

interface MbArtistSearch {
  count?: number
  artists?: Array<MbArtist & { score?: number }>
}

interface MbReleaseGroup {
  id?: string
  title?: string
  "primary-type"?: string
  "secondary-types"?: string[]
  "first-release-date"?: string
}

interface MbReleaseGroupSearch {
  count?: number
  "release-groups"?: MbReleaseGroup[]
}

let lastCall = 0
async function mbGet<T>(path: string): Promise<T> {
  // MusicBrainz asks for no more than one request a second, unauthenticated.
  const gap = 1050 - (Date.now() - lastCall)
  if (gap > 0) await new Promise((resolve) => setTimeout(resolve, gap))
  lastCall = Date.now()
  const res = await fetch(`${MB}${path}`, {
    headers: { Accept: "application/json", "User-Agent": SG_UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 400) throw new SeatGeekError(`MusicBrainz rejected the query.`)
  if (res.status === 404) throw new SeatGeekError("MusicBrainz has no record for that artist.")
  if (res.status === 503) throw new SeatGeekError("MusicBrainz is rate-limiting this host. Try again shortly.")
  if (!res.ok) throw new SeatGeekError(`MusicBrainz error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findArtist(input: string): Promise<{ artist: MbArtist; score?: number; exact: boolean }> {
  const name = (input ?? "").trim()
  if (!name) throw new SeatGeekError("Give an artist name or a MusicBrainz id.")
  if (MBID.test(name)) {
    const artist = await mbGet<MbArtist>(`/artist/${name}?inc=aliases&fmt=json`)
    return { artist, exact: true }
  }
  const data = await mbGet<MbArtistSearch>(`/artist?query=${encodeURIComponent(`artist:"${name}"`)}&fmt=json&limit=8`)
  const hits = data.artists ?? []
  if (!hits.length) throw new SeatGeekError(`MusicBrainz has no artist matching "${name}".`)
  const exact = hits.find((a) => (a.name ?? "").toLowerCase() === name.toLowerCase()) ?? hits[0]
  return { artist: exact, score: exact.score, exact: (exact.name ?? "").toLowerCase() === name.toLowerCase() }
}

/**
 * Who an act actually is, as the music database records it: canonical name and
 * the aliases a promoter has to search under, type, country of origin, active
 * span, and the membership and tribute relationships that explain the name.
 */
export async function artistBriefing(args: { artist: string; limit?: number }): Promise<string> {
  const { artist, score, exact } = await findArtist(args.artist)
  const size = Math.min(Math.max(Number(args.limit) || 12 || 12, 1), 30)

  const detail = await mbGet<MbArtist>(`/artist/${artist.id}?inc=aliases+artist-rels+url-rels&fmt=json`)
  const life = detail["life-span"] ?? {}
  const aliases = (detail.aliases ?? []).filter((a) => a.name).slice(0, 12)
  const relations = detail.relations ?? []
  const members = relations
    .filter((r) => r.type === "member of band" && r.artist)
    .map((r) => ({ name: String(r.artist?.name ?? "?"), begin: r.begin ?? null, end: r.end ?? null }))
  const tributes = relations.filter((r) => r.type === "tribute").length
  const previousNames = relations
    .filter((r) => r.type === "artist rename" && r.artist)
    .map((r) => `${String(r.artist?.name ?? "?")} (${r.begin ?? "?"})`)
  const links = relations
    .filter((r) => r.type === "other databases" && r.url?.resource)
    .map((r) => `${r.url?.type ?? "link"}: ${r.url?.resource}`)
    .slice(0, 5)
  const tagCounts = (detail.tags ?? []).filter((t) => t.name).slice(0, 10)

  return [
    `${detail.name ?? "unknown artist"} (MusicBrainz ${detail.id})`,
    `  ${detail.type ?? "type not recorded"}${detail.gender ? `, ${detail.gender}` : ""}${detail.disambiguation ? `, "${detail.disambiguation}"` : ""}`,
    `  country: ${detail.country ?? "not recorded"}${detail["begin-area"]?.name ? ` (from ${detail["begin-area"].name})` : ""}`,
    `  active: ${life.begin ?? "date not recorded"} to ${life.end ?? (life.ended === false ? "present" : "date not recorded")}${life.ended === false ? "" : " (ended)"}`,
    "",
    `  search score ${score ?? "not applicable"}${exact ? ", exact name match" : `, nearest match to "${args.artist}"`}`,
    aliases.length ? `  aliases (${aliases.length} shown): ${aliases.map((a) => a.name).join(" | ")}` : "  no aliases recorded",
    tagCounts.length ? `  community tags: ${tagCounts.map((t) => `${t.name}${t.count ? ` (${t.count})` : ""}`).join(" | ")}` : "  no community tags recorded",
    "",
    members.length
      ? `  members (${members.length} relationship(s), showing ${Math.min(members.length, size)}): ${members.slice(0, size).map((m) => m.name).join(", ")}`
      : "  no member relationships recorded, so this is probably a solo performer or the data is thin",
    previousNames.length ? `  previously known as: ${previousNames.join(", ")}` : "",
    tributes ? `  ${tributes} tribute artist relationship(s) point at this act` : "",
    links.length ? `  database links: ${links.join(" | ")}` : "",
    "",
    "A promoter's booking name rarely matches the canonical one, which is why the alias list matters: a search on SeatGeek and a search here will otherwise find different artists.",
    "Source: MusicBrainz, a public music database. Relationships are crowd-sourced and sometimes wrong.",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

/**
 * A performer's recorded catalogue as MusicBrainz counts it: how many release
 * groups, split by primary type and by decade, which is the closest thing to an
 * objective measure of how much of a back catalogue a booking can lean on.
 */
export async function artistCatalogue(args: { artist: string }): Promise<string> {
  const { artist } = await findArtist(args.artist)
  const data = await mbGet<MbReleaseGroupSearch>(
    `/release-group?artist=${artist.id}&fmt=json&limit=100&inc=artist-credits`
  )
  const groups = data["release-groups"] ?? []
  if (!groups.length) {
    return `${artist.name} has no release groups in MusicBrainz, so there is no recorded catalogue to summarise.`;
  }

  const byType = new Map<string, number>()
  const byDecade = new Map<number, number>()
  for (const group of groups) {
    const type = String(group["primary-type"] ?? "not reported")
    byType.set(type, (byType.get(type) ?? 0) + 1)
    const year = Number(String(group["first-release-date"] ?? "").slice(0, 4))
    if (Number.isFinite(year) && year > 0) {
      const decade = Math.floor(year / 10) * 10
      byDecade.set(decade, (byDecade.get(decade) ?? 0) + 1)
    }
  }
  const dated = groups.filter((g) => /^\d{4}/.test(String(g["first-release-date"] ?? "")))
  const years = dated.map((g) => Number(String(g["first-release-date"]).slice(0, 4)))
  const earliest = years.length ? Math.min(...years) : null
  const latest = years.length ? Math.max(...years) : null

  const albums = byType.get("Album") ?? 0
  const singles = (byType.get("Single") ?? 0)
  const undated = groups.length - dated.length

  return [
    `Recorded catalogue of ${artist.name} (MusicBrainz ${artist.id})`,
    `  ${data.count ?? groups.length} release group(s) in the database, ${groups.length} read`,
    albums ? `  ${albums} album(s)` : "",
    singles ? `  ${singles} single(s)` : "",
    earliest !== null && latest !== null ? `  spanning ${earliest} to ${latest}` : "",
    undated ? `  ${undated} release(s) carry no first-release date and are excluded from the decade chart` : "",
    "",
    "By primary type:",
    ...[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, n]) => `  ${type.padEnd(12)} ${String(n).padStart(4)}`),
    "",
    "By decade of first release:",
    ...[...byDecade.entries()].sort((a, b) => a[0] - b[0]).map(([decade, n]) => `  ${decade}s  ${String(n).padStart(4)}  ${"#".repeat(n)}`),
    "",
    "Most recent release groups:",
    ...groups
      .filter((g) => g["first-release-date"])
      .sort((a, b) => String(b["first-release-date"]).localeCompare(String(a["first-release-date"])))
      .slice(0, 8)
      .map((g) => `  ${String(g["first-release-date"]).slice(0, 10)}  ${String(g.title ?? "untitled").slice(0, 50).padEnd(50)} ${g["primary-type"] ?? "type not reported"}`),
    "",
    "A release group is one work, not one physical release, so a single album counts once however many times it was pressed.",
    "Source: MusicBrainz. The release-group list is read one hundred at a time, so a catalogue larger than that is only partly shown here.",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
