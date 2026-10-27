/**
 * Cleveland Museum of Art Open Access API. Keyless, CC0 images.
 * Docs: https://openaccess-api.clevelandart.org
 */
const BASE = "https://openaccess-api.clevelandart.org/api"

export class ClevelandError extends Error {}

async function getJson(url: string, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "cleveland-art-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new ClevelandError("The Cleveland Museum of Art has no record for that id")
    if (!res.ok) throw new ClevelandError(`Cleveland Open Access responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof ClevelandError) throw e
    if ((e as Error).name === "AbortError") throw new ClevelandError("Cleveland Open Access request timed out")
    if (e instanceof SyntaxError) throw new ClevelandError("Cleveland Open Access returned malformed JSON")
    throw new ClevelandError(`Cleveland Open Access request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

interface Artwork {
  id: number
  accession_number?: string
  title?: string
  creation_date?: string
  culture?: string[]
  technique?: string
  department?: string
  type?: string
  url?: string
  images?: { web?: { url?: string }; print?: { url?: string } }
  creators?: { description?: string; role?: string }[]
  did_you_know?: string
}

const artists = (a: Artwork): string =>
  (a.creators ?? []).map((c) => c.description).filter(Boolean).join("; ") || "artist unknown"

function line(a: Artwork, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  return [
    `${prefix}${a.title ?? "(untitled)"} — ${artists(a)}`,
    `   ${a.creation_date ?? "date unknown"} · ${a.type ?? "type unknown"} · ${a.department ?? "department unknown"}`,
    `   id ${a.id}${a.accession_number ? ` · ${a.accession_number}` : ""}`,
  ].join("\n")
}

function list(title: string, d: any, limit: number): string {
  const rows: Artwork[] = d?.data ?? []
  if (rows.length === 0) return `${title} — nothing found.`
  return [
    `${title} (showing ${Math.min(limit, rows.length)} of ${Number(d?.info?.total ?? rows.length).toLocaleString("en-US")}):`,
    "",
    ...rows.slice(0, limit).map((a, i) => line(a, i)),
  ].join("\n")
}

export async function searchArtworks(query: string, limit: number, onlyImages = false): Promise<string> {
  const q = query.trim()
  if (q.length < 2) throw new ClevelandError("Search term must be at least 2 characters")
  const img = onlyImages ? "&has_image=1" : ""
  const d = await getJson(`${BASE}/artworks/?q=${encodeURIComponent(q)}&limit=${limit}${img}`)
  return list(`Artworks matching "${query}"`, d, limit)
}

export async function artworkDetail(id: number): Promise<string> {
  const d = await getJson(`${BASE}/artworks/${id}`)
  const a: Artwork = d?.data
  if (!a) throw new ClevelandError(`No artwork with id ${id}`)
  const img = a.images?.web?.url ?? a.images?.print?.url
  return [
    `${a.title ?? "(untitled)"} — ${artists(a)}`,
    `${a.creation_date ?? "date unknown"}${a.culture?.length ? ` · ${a.culture.join(", ")}` : ""}`,
    `Type: ${a.type ?? "?"} · Department: ${a.department ?? "?"}`,
    a.technique ? `Technique: ${a.technique}` : "",
    a.accession_number ? `Accession: ${a.accession_number}` : "",
    a.did_you_know ? `\n${String(a.did_you_know).replace(/\s+/g, " ")}` : "",
    "",
    img ? `Image (CC0): ${img}` : "No open-access image for this work.",
    a.url ? `Record: ${a.url}` : "",
  ]
    .filter((x) => x !== "")
    .join("\n")
}

/**
 * There is no departments endpoint; the department filter takes the display
 * name and this server passes it straight through.
 */
export async function byDepartment(department: string, limit: number): Promise<string> {
  const name = department.trim()
  if (name.length < 3) throw new ClevelandError("Department name must be at least 3 characters")
  const d = await getJson(`${BASE}/artworks/?department=${encodeURIComponent(name)}&limit=${limit}`)
  const total = Number(d?.info?.total ?? 0)
  if (total === 0) {
    throw new ClevelandError(
      `No works in a department called "${department}". Try an exact name such as "Chinese Art", "Prints", "Photography", "Textiles" or "Modern European Painting and Sculpture".`
    )
  }
  return list(`Artworks in ${name}`, d, limit)
}

export async function highlights(limit: number): Promise<string> {
  const d = await getJson(`${BASE}/artworks/?cc0=1&has_image=1&limit=${limit}&skip=${Math.floor(Math.random() * 200)}`)
  return list("CC0 highlights with images", d, limit)
}

export async function byCreator(name: string, limit: number): Promise<string> {
  const q = name.trim()
  const d = await getJson(`${BASE}/artworks/?q=${encodeURIComponent(q)}&has_image=1&limit=${limit}`)
  const rows: Artwork[] = d?.data ?? []
  const needle = q.toLowerCase()
  const matching = rows.filter((a) => (a.creators ?? []).some((c) => String(c.description ?? "").toLowerCase().includes(needle)))
  if (matching.length === 0) return `No works in Cleveland's collection list "${name}" as creator.`
  return [
    `Works by ${name} in the Cleveland collection (${matching.length} shown):`,
    "",
    ...matching.map((a, i) => line(a, i)),
  ].join("\n")
}
