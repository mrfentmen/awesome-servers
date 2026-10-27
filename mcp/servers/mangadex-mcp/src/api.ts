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
