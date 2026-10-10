/**
 * Pinterest API v5 client. Requires PINTEREST_ACCESS_TOKEN.
 * Get one free at https://developers.pinterest.com/ (create an app).
 * Docs: https://developers.pinterest.com/docs/api/v5/
 */
const BASE = "https://api.pinterest.com/v5"

export class PinterestError extends Error {}

function token(): string {
  const t = process.env.PINTEREST_ACCESS_TOKEN
  if (!t) throw new PinterestError("Set PINTEREST_ACCESS_TOKEN first (free at developers.pinterest.com).")
  return t
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "pinterest-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${token()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new PinterestError("Pinterest rejected the token (401/403). Check PINTEREST_ACCESS_TOKEN.")
  if (res.status === 404) throw new PinterestError("Not found on Pinterest.")
  if (!res.ok) throw new PinterestError(`Pinterest error ${res.status}`)
  return (await res.json()) as T
}

export interface Account {
  username?: string
  profileImage?: string
  websiteUrl?: string
}

export async function myAccount(): Promise<Account> {
  const a = await getJson<Raw>("/user_account")
  return { username: a.username, profileImage: a.profile_image, websiteUrl: a.website_url }
}

export interface Board {
  id: string
  name?: string
  description?: string
  pinCount?: number
  url?: string
}

export async function listBoards(limit = 10): Promise<Board[]> {
  const data = await getJson<Raw>(`/boards?page_size=${Math.min(Math.max(limit, 1), 250)}`)
  const rows: Raw[] = Array.isArray(data.items) ? data.items : []
  return rows.slice(0, limit).map(toBoard)
}

const toBoard = (b: Raw): Board => ({
  id: String(b.id),
  name: b.name,
  description: b.description,
  pinCount: typeof b.pin_count === "number" ? b.pin_count : undefined,
  url: `https://www.pinterest.com/${b.owner?.username ?? ""}/${b.id}/`.replace(/\/\//g, "/").replace("https:/", "https://"),
});

export async function getBoard(id: string): Promise<Board> {
  return toBoard(await getJson<Raw>(`/boards/${encodeURIComponent(id.trim())}`))
}

export interface Pin {
  id: string
  title?: string
  description?: string
  link?: string
  image?: string
}

export async function boardPins(id: string, limit = 10): Promise<Pin[]> {
  const data = await getJson<Raw>(`/boards/${encodeURIComponent(id.trim())}/pins?page_size=${Math.min(Math.max(limit, 1), 250)}`)
  const rows: Raw[] = Array.isArray(data.items) ? data.items : []
  return rows.slice(0, limit).map(toPin)
}

export async function getPin(id: string): Promise<Pin> {
  return toPin(await getJson<Raw>(`/pins/${encodeURIComponent(id.trim())}`))
}

const toPin = (p: Raw): Pin => ({
  id: String(p.id),
  title: p.title,
  description: p.description,
  link: p.link,
  image: (p.media?.images?.["600x"] as Raw)?.url ?? (p.image_large_url as string | undefined),
});

export function formatBoard(b: Board, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${b.id}] ${b.name ?? "(unnamed)"}${b.pinCount !== undefined ? ` (${b.pinCount} pins)` : ""}${b.description ? `\n   ${b.description.slice(0, 140)}` : ""}`
}

export function formatPin(p: Pin, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}[${p.id}] ${p.title ?? "(untitled)"}`,
    p.description ? `${p.description.slice(0, 160)}` : "",
    p.link ? `Link: ${p.link}` : "",
    p.image ? `Image: ${p.image}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxH tools:
// The tools above all need a Pinterest token and read one account. Openverse is
// a keyless index of openly licensed media, so these two find imagery that can
// legally be pinned, with the licence attached to every result.

const OPENVERSE = "https://api.openverse.org/v1"
const OPENVERSE_UA = "pinterest-mcp/1.1 (https://github.com/mrfentmen/pinterest-mcp)"

const OPENVERSE_SOURCES = [
  "flickr", "wikimedia", "stocksnap", "rawpixel", "nappy", "smithsonian",
  "met", "sciencemuseum", "spacex", "nasa", "animaldiversity", "aucklandmuseum",
  "phylopic", "sciencemuseum", "floraon", "mccordmuseum", "iNaturalist",
]

interface OvResult {
  id?: string
  title?: string
  creator?: string
  creator_url?: string
  license?: string
  license_version?: string
  license_url?: string
  source?: string
  width?: number
  height?: number
  filesize?: number | null
  filetype?: string | null
  foreign_landing_url?: string
  url?: string
  thumbnail?: string
  attribution?: string
  tags?: Array<{ name?: string }>
  category?: string | null
  mature?: boolean
}

interface OvSearch {
  result_count?: number
  page_count?: number
  page_size?: number
  page?: number
  results?: OvResult[]
}

interface OvSource {
  source_name?: string
  display_name?: string
  source_url?: string
  media_count?: number
}

async function ovGet<T>(path: string): Promise<T> {
  const res = await fetch(`${OPENVERSE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": OPENVERSE_UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 400) throw new PinterestError("Openverse rejected the query. Check the search terms and filters.")
  if (res.status === 404) throw new PinterestError(`Openverse has no endpoint for ${path}.`)
  if (!res.ok) throw new PinterestError(`Openverse API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

const ovSize = (w?: number, h?: number): string =>
  typeof w === "number" && typeof h === "number" ? `${w}x${h}` : "dimensions not reported"

const ovPixelCount = (r: OvResult): number =>
  typeof r.width === "number" && typeof r.height === "number" ? r.width * r.height : 0

/**
 * Find openly licensed images for a board, with the licence each one carries,
 * so a pin can point at something that is actually allowed to be reused.
 */
export async function findLicensedImages(args: { query: string; limit?: number; source?: string; commercialOnly?: boolean }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new PinterestError("Give something to search for, e.g. 'mountain landscape'.")
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 8), 1), 20)
  const source = (args.source ?? "").trim().toLowerCase()
  if (source && !OPENVERSE_SOURCES.includes(source)) {
    throw new PinterestError(`source must be one of: ${OPENVERSE_SOURCES.slice(0, 12).join(", ")}...`)
  }

  const params = new URLSearchParams({ q, page_size: String(size) })
  if (source) params.set("source", source)
  if (args.commercialOnly) params.set("license_type", "commercial")
  const data = await ovGet<OvSearch>(`/images/?${params}`)
  const rows = Array.isArray(data.results) ? data.results : []
  if (!rows.length) throw new PinterestError(`Openverse found no openly licensed image for "${q}".`)

  const byLicense = new Map<string, number>()
  for (const row of rows) byLicense.set(row.license ?? "not reported", (byLicense.get(row.license ?? "not reported") ?? 0) + 1)

  return [
    `Openly licensed images for "${q}"`,
    `  ${data.result_count ?? rows.length} match(es) in the index, showing ${rows.length}${source ? ` from ${source}` : ""}${args.commercialOnly ? ", commercial-use licences only" : ""}`,
    "",
    ...rows.map((r, i) =>
      [
        `${String(i + 1).padStart(2)}. ${r.title ?? "(untitled)"}`,
        `    by ${r.creator ?? "creator not reported"}${r.source ? `, on ${r.source}` : ""}`,
        `    licence ${r.license ?? "not reported"}${r.license_version ? ` ${r.license_version}` : ""} | ${ovSize(r.width, r.height)} | ${typeof r.filesize === "number" ? `${Math.round(r.filesize / 1024)} KB` : "size not reported"}`,
        `    ${r.foreign_landing_url ?? "source page not reported"}`,
      ].join("\n")
    ),
    "",
    `Licences in this page: ${[...byLicense.entries()].map(([licence, n]) => `${licence} x${n}`).join(", ")}`,
    "Openverse (openverse.org) aggregates openly licensed media. Check each licence before republishing.",
  ].join("\n")
}

/**
 * The licence and attribution behind a single Openverse image, which is what a
 * repin has to carry to stay legal.
 */
export async function imageLicence(args: { id: string }): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new PinterestError("Give the Openverse image id (a UUID), not a Pinterest pin id.")
  }
  const data = await ovGet<OvResult & { url?: string }>(`/images/${encodeURIComponent(id)}/`)
  const tags = (data.tags ?? []).map((t) => t.name).filter((n): n is string => typeof n === "string")
  return [
    `Openverse image ${data.id ?? id}`,
    `  title: ${data.title ?? "not reported"}`,
    `  creator: ${data.creator ?? "not reported"}${data.creator_url ? ` (${data.creator_url})` : ""}`,
    `  licence: ${data.license ?? "not reported"}${data.license_version ? ` ${data.license_version}` : ""}`,
    `  licence terms: ${data.license_url ?? "not reported"}`,
    `  source: ${data.source ?? "not reported"}`,
    `  original page: ${data.foreign_landing_url ?? "not reported"}`,
    `  full file: ${data.url ?? "not reported"}`,
    `  dimensions: ${ovSize(data.width, data.height)}`,
    `  category: ${data.category ?? "not reported"} | flagged mature: ${data.mature === true ? "yes" : "no"}`,
    tags.length ? `  tags: ${tags.slice(0, 12).join(", ")}` : "  tags: none recorded",
    "",
    data.attribution ? `Attribution string Openverse builds: ${String(data.attribution).slice(0, 200)}` : "Openverse records no attribution string for this item.",
    "Licence text is Openverse's record, not legal advice.",
  ].join("\n")
}

/**
 * How the openly licensed image index is made up: which source holds how much,
 * which licences dominate, and the biggest images in the collection.
 */
export async function imageSources(args: { query: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new PinterestError("Give a search term to profile, e.g. 'architecture'.")
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 20), 1), 50)
  const data = await ovGet<OvSearch>(`/images/?q=${encodeURIComponent(q)}&page_size=${String(size)}`)
  const rows = Array.isArray(data.results) ? data.results : []
  if (!rows.length) throw new PinterestError(`Openverse found nothing for "${q}".`)

  const sources = new Map<string, number>()
  const licences = new Map<string, number>()
  for (const row of rows) {
    const name = row.source ?? "not reported"
    sources.set(name, (sources.get(name) ?? 0) + 1)
    const licence = row.license ?? "not reported"
    licences.set(licence, (licences.get(licence) ?? 0) + 1)
  }
  const ranked = [...sources.entries()].sort((a, b) => b[1] - a[1])
  const biggest = [...rows].sort((a, b) => ovPixelCount(b) - ovPixelCount(a)).slice(0, 3)

  let catalogue: OvSource[] = []
  try {
    catalogue = await ovGet<OvSource[]>("/images/stats/")
  } catch {
    catalogue = []
  }

  return [
    `Openverse image pool for "${q}"`,
    `  ${data.result_count ?? rows.length} index match(es); ${rows.length} sampled`,
    "",
    `Sources in the sample: ${ranked.map(([name, n]) => `${name} x${n}`).join(", ")}`,
    `Licences in the sample: ${[...licences.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => `${name} x${n}`).join(", ")}`,
    "",
    "Largest images in the sample:",
    ...biggest.map((r, i) => `  ${i + 1}. ${r.title ?? "(untitled)"} — ${ovSize(r.width, r.height)}, ${r.source ?? "source not reported"}`),
    "",
    catalogue.length ? "Whole index by source:" : "Whole index by source: not reported",
    ...catalogue
      .slice()
      .sort((a, b) => (b.media_count ?? 0) - (a.media_count ?? 0))
      .slice(0, 8)
      .map((c) => `  ${c.display_name ?? c.source_name ?? "unnamed"} — ${(c.media_count ?? 0).toLocaleString()} item(s)`),
    "Source: openverse.org aggregate index.",
  ].join("\n")
}
