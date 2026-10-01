/**
 * VNDB API v2 client.
 * Docs: https://api.vndb.org/kana
 * POST JSON to https://api.vndb.org/kana/<collection> — the collection
 * (vn / character / release / ...) is part of the URL path. A
 * descriptive User-Agent is required. Public API — no auth needed.
 */

const ENDPOINT = "https://api.vndb.org/kana"

export class VndbApiError extends Error {}

interface Query {
  filters?: unknown
  fields: string
  sort?: string
  reverse?: boolean
  results?: number
  page?: number
}

interface ApiResult<T> {
  count: number
  more: boolean
  results: T[]
}

async function post<T>(collection: string, body: Query): Promise<ApiResult<T>> {
  const res = await fetch(`${ENDPOINT}/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "vndb-mcp/1.0 (https://github.com/mrfentmen/vndb-mcp)",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new VndbApiError(
      `VNDB API error ${res.status}: ${(await res.text()).slice(0, 300)}`
    )
  }
  return (await res.json()) as ApiResult<T>
}

// ---------------------------------------------------------------------------
// Types (subset of VNDB's schema)
// ---------------------------------------------------------------------------

export interface VN {
  id: string
  title?: string
  alttitle?: string | null
  titles?: { lang: string; title: string; latin?: string | null }[]
  released?: string | null
  rating?: number
  votecount?: number
  popularity?: number
  length?: number | null
  devstatus?: number
  description?: string | null
  image?: { url?: string } | null
  developers?: { id?: string; name?: string }[]
  tags?: { id?: string; name?: string }[]
  platforms?: string[]
}

export interface Character {
  id: string
  name?: string
  original?: string | null
  gender?: string[]
  birthday?: number[]
  height?: number | null
  description?: string | null
  traits?: { id?: string; name?: string }[]
  vns?: { id?: string; title?: string }[]
}

export interface Release {
  id: string
  title?: string
  released?: string | null
  catalog?: string | null
  languages?: { lang?: string; title?: string }[]
  platforms?: string[]
  media?: { medium?: string; qty?: number }[]
  vns?: { id?: string; title?: string }[]
  producers?: { id?: string; name?: string }[]
}

const VN_FIELDS =
  "id, title, alttitle, titles.lang, titles.title, released, rating, votecount, " +
  "popularity, length, devstatus, description, " +
  "image.url, developers.name, tags.name, platforms"

const CHAR_FIELDS =
  "id, name, original, gender, birthday, height, description, " +
  "traits.name, vns.id, vns.title"

const RELEASE_FIELDS =
  "id, title, released, catalog, languages.lang, languages.title, platforms, " +
  "media.medium, media.qty, vns.id, vns.title, producers.name"

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function searchVns(
  query: string,
  results = 8,
  sort: "rating" | "popularity" | "released" | "title" = "rating"
): Promise<VN[]> {
  const data = await post<VN>("vn", {
    filters: ["search", "=", query],
    fields: VN_FIELDS,
    sort,
    reverse: sort !== "title",
    results,
  })
  return data.results
}

export async function getVn(id: string): Promise<VN | null> {
  const data = await post<VN>("vn", {
    filters: ["id", "=", id],
    fields: VN_FIELDS,
    results: 1,
  })
  return data.results[0] ?? null
}

export async function searchCharacters(
  query: string,
  results = 8
): Promise<Character[]> {
  const data = await post<Character>("character", {
    filters: ["search", "=", query],
    fields: CHAR_FIELDS,
    sort: "id",
    results,
  })
  return data.results
}

export async function getReleases(vnId: string): Promise<Release[]> {
  const data = await post<Release>("release", {
    filters: ["vn", "=", ["id", "=", vnId]],
    fields: RELEASE_FIELDS,
    sort: "released",
    reverse: true,
    results: 25,
  })
  return data.results
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const LENGTH: Record<number, string> = {
  1: "very short (<10h)",
  2: "short (10-30h)",
  3: "medium (30-50h)",
  4: "long (50-100h)",
  5: "very long (>100h)",
}

export function formatVn(v: VN): string {
  const title = v.title ?? v.alttitle ?? v.id
  const devs = v.developers?.length
    ? ` by ${v.developers.map((d) => d.name).join(", ")}`
    : ""
  const rating = v.rating ? ` ★${v.rating.toFixed(2)} (${v.votecount} votes)` : " unrated"
  const lines = [
    `[${v.id}] ${title}${devs}`,
    `Released: ${v.released ?? "?"} | ${LENGTH[v.length ?? 0] ?? "?"}${rating}`,
  ]
  if (v.platforms?.length) lines.push(`Platforms: ${v.platforms.join(", ")}`)
  if (v.tags?.length) {
    lines.push(`Tags: ${v.tags.slice(0, 8).map((t) => t.name).join(", ")}`)
  }
  if (v.description) lines.push(`\n${strip(v.description).slice(0, 700)}`)
  return lines.join("\n")
}

export function formatCharacter(c: Character): string {
  const bio = [
    c.gender?.length ? `Gender: ${c.gender.join("/")}` : "",
    c.birthday?.length === 2 ? `Birthday: ${c.birthday[0]}/${c.birthday[1]}` : "",
    c.height ? `Height: ${c.height}cm` : "",
  ]
    .filter(Boolean)
    .join(" | ")
  const lines = [`[${c.id}] ${c.name ?? "?"}${c.original ? ` (${c.original})` : ""}`]
  if (bio) lines.push(bio)
  if (c.traits?.length) lines.push(`Traits: ${c.traits.map((t) => t.name).join(", ")}`)
  if (c.vns?.length) lines.push(`Appears in: ${c.vns.map((v) => v.title ?? v.id).join(", ")}`)
  if (c.description) lines.push(`\n${strip(c.description).slice(0, 600)}`)
  return lines.join("\n")
}

export function formatRelease(r: Release): string {
  const langs = r.languages?.map((l) => l.lang?.toUpperCase() ?? "?").join("/") ?? "?"
  const media =
    r.media?.map((m) => `${m.qty ?? ""}${m.medium ?? ""}`.trim()).join(" + ") ?? "?"
  return (
    `[${r.id}] ${r.title ?? "?"} (${r.released ?? "?"})` +
    `\nCatalog: ${r.catalog ?? "?"} | Lang: ${langs} | Media: ${media}` +
    (r.producers?.length ? ` | by ${r.producers.map((p) => p.name).join(", ")}` : "")
  )
}

function strip(s: string): string {
  return s
    .replace(/\[.*?\]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// ---- muxC tools:

const VN_UA = "mrfentmen-vndb-mcp/1.0 (https://github.com/mrfentmen)"

async function vndbPost(collection: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://api.vndb.org/kana/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": VN_UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`VNDB API error ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return await res.json()
}

/** Producers and studios, the staff-side collection the visual novel tools never return. */
export async function producerSearch(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "").trim()
  const limit = Math.max(1, Math.min(args.limit ?? 10, 100))
  // VNDB's filter grammar needs ["search","=",q] with an empty string meaning "all".
  const d = await vndbPost("producer", {
    filters: ["search", "=", query],
    fields: "id,name,original,type",
    results: limit,
    page: 1,
    sort: "id",
  })
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `VNDB has no producer matching "${query}".`
  return `VNDB producers matching "${query}" (${d.count ?? rows.length} total, ${rows.length} shown):\n` +
    rows.map((p, i) => `${i + 1}. ${p.name} (${p.original && p.original !== p.name ? `${p.original}, ` : ""}id ${p.id})\n   type: ${p.type ?? "not reported"}`).join("\n")
}

/** Staff and their aliases, which is how you find who is credited on a visual novel. */
export async function staffSearch(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "").trim()
  const limit = Math.max(1, Math.min(args.limit ?? 10, 100))
  const d = await vndbPost("staff", {
    filters: ["search", "=", query],
    fields: "id,name,original",
    results: limit,
    page: 1,
    sort: "id",
  })
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `VNDB has no staff member matching "${query}".`
  return `VNDB staff matching "${query}" (${d.count ?? rows.length} total, ${rows.length} shown):\n` +
    rows.map((s, i) => `${i + 1}. ${s.name} (${s.original && s.original !== s.name ? `${s.original}, ` : ""}id ${s.id})\n   original name: ${s.original ?? "none recorded"}`).join("\n")
}
