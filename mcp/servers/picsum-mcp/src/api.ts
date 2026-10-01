/**
 * Picsum.photos API client, keyless.
 * Docs: https://picsum.photos/
 * Image URLs are deterministic: https://picsum.photos/id/{id}/{w}/{h}
 */
const BASE = "https://picsum.photos"

export class PicsumError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "picsum-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) throw new PicsumError("No such photo.")
  if (!res.ok) throw new PicsumError(`Picsum error ${res.status}`)
  return (await res.json()) as T
}

export interface Photo {
  id: string
  author: string
  width?: number
  height?: number
  page?: string
}

export async function listPhotos(page = 1, limit = 5): Promise<Photo[]> {
  const rows = await getJson<Raw[]>(`/v2/list?page=${Math.max(page, 1)}&limit=${Math.min(Math.max(limit, 1), 100)}`)
  return rows.slice(0, limit).map(toPhoto)
}

export async function getPhoto(id: string): Promise<Photo> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new PicsumError(`Photo id must be numeric, got "${id}".`)
  return toPhoto(await getJson<Raw>(`/id/${clean}/info`))
}

function toPhoto(p: Raw): Photo {
  return {
    id: String(p.id),
    author: String(p.author ?? "?"),
    width: typeof p.width === "number" ? p.width : undefined,
    height: typeof p.height === "number" ? p.height : undefined,
    page: p.url,
  }
}

export function photoUrl(id: string, width = 800, height = 600, grayscale = false, blur = 0): string {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new PicsumError(`Photo id must be numeric, got "${id}".`)
  const w = Math.min(Math.max(width, 1), 5000)
  const h = Math.min(Math.max(height, 1), 5000)
  const q = new URLSearchParams()
  if (grayscale) q.set("grayscale", "")
  if (blur >= 1 && blur <= 10) q.set("blur", String(blur))
  const qs = q.toString() ? `?${q.toString()}` : ""
  return `https://picsum.photos/id/${clean}/${w}/${h}${qs}`
}

export function formatPhoto(p: Photo, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const dims = p.width && p.height ? ` (${p.width}x${p.height})` : ""
  return `${prefix}[${p.id}] by ${p.author}${dims}${p.page ? `\n   ${p.page}` : ""}`
}

// ---- muxC tools:

