/**
 * Met Museum client. The Metropolitan Museum of Art open collection API,
 * keyless. Over 500,000 objects with images.
 */
const BASE = "https://collectionapi.metmuseum.org/public/collection/v1"

export class MetError extends Error {}

export interface ArtObject {
  objectID: number
  title?: string
  artistDisplayName?: string
  artistDisplayBio?: string
  objectDate?: string
  medium?: string
  department?: string
  culture?: string
  classification?: string
  primaryImage?: string
  objectURL?: string
  dimensions?: string
  accessionYear?: string
  isPublicDomain?: boolean
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "metmuseum-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new MetError(`Met API error ${res.status}`)
  return (await res.json()) as T
}

export async function searchObjects(query: string, limit = 5): Promise<ArtObject[]> {
  const s = await getJson<{ total?: number; objectIDs?: number[] | null }>(
    `/objects?hasImages=true&q=${encodeURIComponent(query)}`,
  )
  const ids = (s.objectIDs ?? []).slice(0, limit)
  const out: ArtObject[] = []
  for (const id of ids) {
    try {
      out.push(await getJson<ArtObject>(`/objects/${id}`))
    } catch {
      // skip any object that fails to load
    }
  }
  return out
}

export async function getObject(id: number): Promise<ArtObject | null> {
  try {
    return await getJson<ArtObject>(`/objects/${id}`)
  } catch (e) {
    if (e instanceof MetError && String(e).includes("404")) return null
    throw e
  }
}

export async function getDepartments(): Promise<{ departmentId: number; displayName: string }[]> {
  const d = await getJson<{ departments: { departmentId: number; displayName: string }[] }>("/departments")
  return d.departments ?? []
}

export function formatObject(o: ArtObject): string {
  const lines = [
    `[${o.objectID}] ${o.title ?? "(untitled)"}`,
    o.artistDisplayName ? `Artist: ${o.artistDisplayName}${o.artistDisplayBio ? ` (${o.artistDisplayBio})` : ""}` : "",
    o.objectDate ? `Date: ${o.objectDate}` : "",
    o.medium ? `Medium: ${o.medium}` : "",
    [o.department, o.culture, o.classification].filter(Boolean).join(" | "),
    o.dimensions ? `Dimensions: ${o.dimensions}` : "",
    o.accessionYear ? `Accession year: ${o.accessionYear}` : "",
    o.isPublicDomain != null ? (o.isPublicDomain ? "Public domain" : "Image rights reserved") : "",
    o.primaryImage || o.objectURL,
  ].filter(Boolean)
  return lines.join("\n")
}
