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
