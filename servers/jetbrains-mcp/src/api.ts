/**
 * JetBrains Marketplace API client, keyless.
 * Search is public; plugin pages are public.
 */
const BASE = "https://plugins.jetbrains.com/api"

export class JetBrainsError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "mrfentmen-jetbrains-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new JetBrainsError("Not found on JetBrains Marketplace.")
  if (!res.ok) throw new JetBrainsError(`Marketplace error ${res.status}`)
  return (await res.json()) as T
}

export interface PluginHit {
  id: number
  xmlId: string
  name: string
  preview?: string
  downloads?: number
  rating?: number
}

/** Sort orders the Marketplace search accepts. */
export const MARKETPLACE_ORDERS = ['relevance', 'downloads', 'rating', 'name', 'updated'] as const

export async function searchPlugins(query: string, limit = 5, orderBy = 'relevance'): Promise<PluginHit[]> {
  const order = (MARKETPLACE_ORDERS as readonly string[]).includes(orderBy) ? orderBy : 'relevance'
  const data = await getJson<Raw>(`/searchPlugins?search=${encodeURIComponent(query)}&orderBy=${order}&max=${limit}`)
  const rows: Raw[] = Array.isArray(data.plugins) ? data.plugins : []
  return rows.slice(0, limit).map((p) => ({
    id: Number(p.id),
    xmlId: String(p.xmlId ?? p.id),
    name: String(p.name ?? "?"),
    preview: p.preview ? String(p.preview).replace(/<[^>]+>/g, "").slice(0, 140) : undefined,
    downloads: typeof p.downloads === "number" ? p.downloads : undefined,
    rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : undefined,
  }))
}

export interface PluginDetails extends PluginHit {
  vendor?: string
  link?: string
}

/** Top of the Marketplace charts: an empty search ordered by downloads or rating. */
export async function topPlugins(orderBy: 'downloads' | 'rating', limit = 10): Promise<PluginHit[]> {
  return searchPlugins('', limit, orderBy)
}

export interface PluginVersion {
  version: string
  date?: string
  link?: string
  downloads?: number
}

/** Recent releases of one plugin, newest first. */
export async function pluginVersions(id: string, limit = 5): Promise<PluginVersion[]> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`)
  const size = Math.min(Math.max(limit, 1), 20)
  const rows = await getJson<Raw[]>(`/plugins/${clean}/updates?size=${size}`)
  const list: Raw[] = Array.isArray(rows) ? rows : []
  return list.slice(0, size).map((r) => ({
    version: String(r.version ?? '?'),
    date: r.cdate ? new Date(Number(r.cdate)).toISOString().slice(0, 10) : undefined,
    link: r.link ? `https://plugins.jetbrains.com${r.link}` : undefined,
    downloads: typeof r.downloads === 'number' ? r.downloads : undefined,
  }))
}

export async function getPlugin(id: string): Promise<PluginDetails> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`)
  const p = await getJson<Raw>(`/plugins/${clean}`)
  return {
    id: Number(p.id ?? clean),
    xmlId: String(p.xmlId ?? clean),
    name: String(p.name ?? "?"),
    preview: p.preview ? String(p.preview).replace(/<[^>]+>/g, "").slice(0, 300) : undefined,
    downloads: typeof p.downloads === "number" ? p.downloads : undefined,
    rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : undefined,
    vendor: p.vendor?.name ? String(p.vendor.name) : undefined,
    link: `https://plugins.jetbrains.com/plugin/${p.id ?? clean}`,
  }
}

export function formatHit(p: PluginHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const meta = [
    p.downloads !== undefined ? `${p.downloads.toLocaleString()} downloads` : "",
    p.rating !== undefined ? `${p.rating}★` : "",
  ].filter(Boolean).join(" · ")
  return `${prefix}[${p.id}] ${p.name}${meta ? ` (${meta})` : ""}${p.preview ? `\n   ${p.preview}` : ""}`
}

export interface PluginReview {
  id: string
  rating?: number
  date?: string
  comment: string
}

/** Recent written reviews for one plugin, newest first. */
export async function pluginReviews(id: string, limit = 5): Promise<PluginReview[]> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`)
  const size = Math.min(Math.max(limit, 1), 20)
  const rows = await getJson<Raw[]>(`/plugins/${clean}/comments?size=${size}`)
  const list: Raw[] = Array.isArray(rows) ? rows : []
  return list.slice(0, size).map((r) => ({
    id: String(r.id ?? "?"),
    rating: typeof r.rating === "number" ? r.rating : undefined,
    date: r.cdate ? new Date(Number(r.cdate)).toISOString().slice(0, 10) : undefined,
    comment: String(r.comment ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&#x27;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{2,}/g, "\n")
      .trim()
      .slice(0, 600),
  }))
}

export interface PluginRating {
  total: number
  meanRating?: number
  votes: Array<{ stars: number; count: number; share: number }>
}

/** Review score distribution: how many people gave each star rating. */
export async function pluginRatings(id: string): Promise<PluginRating> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`)
  const data = await getJson<Raw>(`/plugins/${clean}/rating`)
  const rawVotes = (data.votes ?? {}) as Raw
  const total = Object.values(rawVotes).reduce<number>((sum, value) => sum + (Number(value) || 0), 0)
  const votes = [5, 4, 3, 2, 1].map((stars) => {
    const count = Number(rawVotes[stars] ?? rawVotes[String(stars)] ?? 0) || 0
    return { stars, count, share: total ? Math.round((count / total) * 1000) / 10 : 0 }
  })
  return {
    total,
    meanRating: typeof data.meanRating === "number" ? Math.round(data.meanRating * 100) / 100 : undefined,
    votes,
  }
}

export function formatReview(review: PluginReview, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const stars = review.rating !== undefined ? `${review.rating}★` : "unrated"
  const when = review.date ? ` | ${review.date}` : ""
  return `${prefix}${stars}${when}\n   ${review.comment || "(no written comment)"}`
}

export function formatRating(rating: PluginRating): string {
  const lines = rating.votes.map(
    (row) => `  ${row.stars}★: ${row.count} (${row.share}%)`
  )
  return [
    `Reviews: ${rating.total}${rating.meanRating !== undefined ? ` | average ${rating.meanRating}★` : ""}`,
    ...lines,
  ].join("\n")
}

export function formatPlugin(p: PluginDetails): string {
  const lines = [
    `[${p.id}] ${p.name} (${p.xmlId})`,
    p.vendor ? `Vendor: ${p.vendor}` : "",
    p.downloads !== undefined ? `Downloads: ${p.downloads.toLocaleString()}` : "",
    p.rating !== undefined ? `Rating: ${p.rating}★` : "",
    p.preview ? `${p.preview}` : "",
    p.link ? `${p.link}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
