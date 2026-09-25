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
    headers: { "User-Agent": "jetbrains-mcp/1.0", Accept: "application/json" },
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
