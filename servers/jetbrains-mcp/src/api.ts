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

export async function searchPlugins(query: string, limit = 5): Promise<PluginHit[]> {
  const data = await getJson<Raw>(`/searchPlugins?query=${encodeURIComponent(query)}&orderBy=relevance`)
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
