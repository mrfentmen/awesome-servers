/**
 * MangaDex API v5 client (public, no auth).
 * Docs: https://api.mangadex.org/docs/
 * Be polite: default rate limits apply (5 req/s per IP).
 */

const BASE = "https://api.mangadex.org"

export class MangaDexError extends Error {}

interface ApiResponse<T> {
  result: "ok"
  data: T[]
  total?: number
  limit?: number
  offset?: number
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "mangadex-mcp/1.0" },
  })
  if (!res.ok) {
    throw new MangaDexError(`MangaDex API error ${res.status}: ${res.statusText}`)
  }
  return (await res.json()) as ApiResponse<T>
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TagAttr {
  name: Record<string, string>
  group: string
}

export interface Manga {
  id: string
  title: string
  altTitles: string[]
  year?: number | null
  status?: string | null
  description?: string
  tags: string[]
  authors: string[]
  rating?: number
  followers?: number
}

export interface Chapter {
  id: string
  title?: string
  chapter?: string | null
  volume?: string | null
  lang: string
  pages: number
  publishedAt?: string
  groupNames: string[]
  externalUrl?: string | null
}

export interface Author {
  id: string
  name: string
  biography?: string
  twitter?: string
  website?: string
}

interface MangaAttr {
  title: Record<string, string>
  altTitles: Record<string, string>[]
  description: Record<string, string>
  year?: number | null
  status?: string | null
  tags: { id: string; attributes: TagAttr }[]
  rating?: number
  followers?: number
  links?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

function pickLocalized(map: Record<string, string> | undefined, prefer = "en"): string | undefined {
  if (!map) return undefined
  return map[prefer] ?? map["ja"] ?? map["ja-ro"] ?? Object.values(map)[0]
}

function mangaTitle(attrs: MangaAttr): string {
  return (
    pickLocalized(attrs.title) ??
    attrs.altTitles
      .map((t) => pickLocalized(t))
      .find((t): t is string => !!t) ??
    "Untitled"
  )
}

export async function searchManga(
  title: string,
  limit = 8,
  lang = "en"
): Promise<Manga[]> {
  const url = `/manga?title=${encodeURIComponent(title)}&limit=${limit}&includes[]=author&includes[]=cover_art`
  const res = await get<{ id: string; attributes: MangaAttr; relationships: { id: string; type: string; attributes?: { name?: string } }[] }>(url)
  return res.data.map((m) => {
    const authors = m.relationships
      .filter((r) => r.type === "author")
      .map((r) => r.attributes?.name ?? r.id)
    return {
      id: m.id,
      title: mangaTitle(m.attributes),
      altTitles: m.attributes.altTitles
        .map((t) => pickLocalized(t))
        .filter((t): t is string => !!t)
        .slice(0, 3),
      year: m.attributes.year,
      status: m.attributes.status,
      description: pickLocalized(m.attributes.description),
      tags: m.attributes.tags.map((t) => pickLocalized(t.attributes.name) ?? t.id),
      authors,
      rating: m.attributes.rating,
      followers: m.attributes.followers,
    }
  })
}

export async function getManga(id: string): Promise<Manga | null> {
  const url = `/manga/${id}?includes[]=author&includes[]=cover_art`
  const res = await get<{ id: string; attributes: MangaAttr; relationships: { id: string; type: string; attributes?: { name?: string } }[] }>(url)
  const m = res.data[0]
  if (!m) return null
  const authors = m.relationships
    .filter((r) => r.type === "author")
    .map((r) => r.attributes?.name ?? r.id)
  return {
    id: m.id,
    title: mangaTitle(m.attributes),
    altTitles: m.attributes.altTitles
      .map((t) => pickLocalized(t))
      .filter((t): t is string => !!t)
      .slice(0, 3),
    year: m.attributes.year,
    status: m.attributes.status,
    description: pickLocalized(m.attributes.description),
    tags: m.attributes.tags.map((t) => pickLocalized(t.attributes.name) ?? t.id),
    authors,
    rating: m.attributes.rating,
    followers: m.attributes.followers,
  }
}

export async function getChapters(
  mangaId: string,
  lang = "en",
  limit = 20,
  ascending = true
): Promise<Chapter[]> {
  const dir = ascending ? "asc" : "desc"
  const url =
    `/manga/${mangaId}/feed?translatedLanguage[]=${lang}&limit=${limit}` +
    `&order[chapter]=${dir}&order[volume]=${dir}&includes[]=scanlation_group`
  const res = await get<{
    id: string
    attributes: {
      title?: string | null
      chapter?: string | null
      volume?: string | null
      translatedLanguage: string
      pages: number
      publishAt?: string
      externalUrl?: string | null
    }
    relationships: { id: string; type: string; attributes?: { name?: string } }[]
  }>(url)
  return res.data.map((c) => ({
    id: c.id,
    title: c.attributes.title ?? undefined,
    chapter: c.attributes.chapter,
    volume: c.attributes.volume,
    lang: c.attributes.translatedLanguage,
    pages: c.attributes.pages,
    publishedAt: c.attributes.publishAt,
    groupNames: c.relationships
      .filter((r) => r.type === "scanlation_group")
      .map((r) => r.attributes?.name ?? r.id),
    externalUrl: c.attributes.externalUrl,
  }))
}

export async function searchAuthor(name: string, limit = 5): Promise<Author[]> {
  const url = `/author?name=${encodeURIComponent(name)}&limit=${limit}`
  const res = await get<{
    id: string
    attributes: {
      name: string
      biography?: Record<string, string>
      twitter?: string | null
      website?: string | null
    }
  }>(url)
  return res.data.map((a) => ({
    id: a.id,
    name: a.attributes.name,
    biography: pickLocalized(a.attributes.biography),
    twitter: a.attributes.twitter ?? undefined,
    website: a.attributes.website ?? undefined,
  }))
}

export async function getTags(): Promise<{ name: string; group: string }[]> {
  const url = "/manga/tag"
  const res = await get<{ id: string; attributes: TagAttr }>(url)
  return res.data.map((t) => ({
    name: pickLocalized(t.attributes.name) ?? t.id,
    group: t.attributes.group,
  }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatManga(m: Manga): string {
  const lines = [
    `[${m.id}] ${m.title}` +
      (m.authors.length ? ` by ${m.authors.join(", ")}` : ""),
    `${m.status ?? "?"} | ${m.year ?? "?"} | ⭐ ${m.rating?.toFixed(2) ?? "?"} | ${m.followers ?? 0} followers`,
  ]
  if (m.tags.length) lines.push(`Tags: ${m.tags.slice(0, 8).join(", ")}`)
  if (m.altTitles.length) lines.push(`Also known as: ${m.altTitles.join(", ")}`)
  if (m.description) lines.push(`\n${m.description.slice(0, 500)}`)
  return lines.join("\n")
}

export function formatChapter(c: Chapter): string {
  const num = c.chapter ? `ch.${c.chapter}` : "oneshot"
  const vol = c.volume ? ` vol.${c.volume}` : ""
  const grp = c.groupNames.length ? ` [${c.groupNames.join(", ")}]` : ""
  const title = c.title ? ` — ${c.title}` : ""
  const when = c.publishedAt ? ` (${c.publishedAt.slice(0, 10)})` : ""
  const ext = c.externalUrl ? ` [external: ${c.externalUrl}]` : ""
  return `${num}${vol}${title}${grp}${when} — ${c.pages}p${ext} — id ${c.id}`
}

// ---- muxB tools:

interface MangaStatistics {
  rating?: { average?: number; bayesian?: number; distribution?: Record<string, number> }
  follows?: number
  comments?: { threadId?: number; repliesCount?: number }
  unavailableChaptersCount?: number
}

// the statistics route answers { result, statistics }, not the collection shape
// every other MangaDex route uses, so it needs its own fetch
async function getStatistics(path: string): Promise<{ statistics?: Record<string, MangaStatistics> }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "mangadex-mcp/1.0" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new MangaDexError(`MangaDex API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as { statistics?: Record<string, MangaStatistics> }
}

export async function mangaStatistics(id: string): Promise<string> {
  const key = (id ?? "").trim()
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new MangaDexError("Provide a MangaDex manga UUID, e.g. from search_manga.")
  const res = await getStatistics(`/statistics/manga/${key}`)
  const s = res.statistics?.[key]
  if (!s) return `MangaDex has no statistics recorded for ${key}.`
  const dist: Record<string, number> = s.rating?.distribution ?? {}
  const total = Object.values(dist).reduce<number>((sum, n) => sum + Number(n ?? 0), 0)
  const spread = Object.entries(dist)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 3)
    .map(([score, n]) => `${score} stars: ${n}`)
  return [
    `MangaDex statistics for ${key}`,
    `Average rating: ${s.rating?.average !== undefined ? s.rating.average.toFixed(3) : "not reported"} | bayesian rating: ${s.rating?.bayesian !== undefined ? s.rating.bayesian.toFixed(3) : "not reported"}`,
    `Rating votes: ${total || "not reported"}${spread.length ? ` | most common: ${spread.join(", ")}` : ""}`,
    `Follows: ${s.follows !== undefined ? Number(s.follows).toLocaleString() : "not reported"}`,
    `Comment thread ${s.comments?.threadId ?? "not reported"} with ${s.comments?.repliesCount ?? "not reported"} replies`,
    `Unavailable chapters: ${s.unavailableChaptersCount !== undefined ? Number(s.unavailableChaptersCount).toLocaleString() : "not reported"}`,
  ].join("\n")
}

export interface MangaByTagArgs {
  tag: string
  limit?: number
}

export async function mangaByTag(args: MangaByTagArgs): Promise<string> {
  const wanted = (args.tag ?? "").trim().toLowerCase()
  if (!wanted) throw new MangaDexError("Provide a tag name, e.g. \"isekai\".")
  const limit = Math.max(1, Math.min(args.limit ?? 8, 20))
  const tags = await get<{ id: string; attributes: TagAttr }>("/manga/tag")
  const hit = tags.data
    .map((t) => ({ id: t.id, name: pickLocalized(t.attributes.name) ?? t.id, group: t.attributes.group }))
    .filter((t) => t.name.toLowerCase() === wanted)
  if (!hit.length) {
    const near = tags.data
      .map((t) => pickLocalized(t.attributes.name) ?? "")
      .filter((n) => n.toLowerCase().includes(wanted))
      .slice(0, 8)
    return near.length
      ? `MangaDex has no tag exactly named "${args.tag}". Close matches: ${near.join(", ")}.`
      : `MangaDex has no tag matching "${args.tag}".`
  }
  const tag = hit[0]
  const res = await get<{
    total?: number
    id: string
    attributes: MangaAttr
    relationships: { id: string; type: string; attributes?: { name?: string } }[]
  }>(`/manga?includedTags[]=${tag.id}&limit=${limit}&order[followedCount]=desc&includes[]=author`)
  const rows = res.data.map((m) => {
    const authors = m.relationships.filter((r) => r.type === "author").map((r) => r.attributes?.name ?? r.id)
    return {
      id: m.id,
      title: mangaTitle(m.attributes),
      year: m.attributes.year,
      status: m.attributes.status,
      authors,
    }
  })
  if (!rows.length) return `No MangaDex manga carry the tag "${tag.name}".`
  return `Most-followed manga tagged "${tag.name}" (${tag.group}) - ${res.total ?? "an unknown number"} tagged in total, ${rows.length} shown:\n` +
    rows
      .map((m, i) => `${i + 1}. [${m.id}] ${m.title} | ${m.status ?? "?"} | ${m.year ?? "?"} | ${m.authors.join(", ") || "author not reported"}`)
      .join("\n")
}
