/**
 * Navidrome (Subsonic API) client. Points at any instance via NAVIDROME_URL
 * (default http://localhost:4533). Auth with NAVIDROME_USER + NAVIDROME_PASSWORD
 * (converted to Subsonic token+salt, never sent in clear).
 * Docs: https://www.navidrome.org/docs/usage/subsonic/
 */
import { createHash, randomBytes } from "node:crypto"

const BASE = (process.env.NAVIDROME_URL ?? "http://localhost:4533").replace(/\/+$/, "")
const CLIENT = "navidrome-mcp"
const API_VERSION = "1.16.1"

export class NavidromeError extends Error {}

function authParams(): URLSearchParams {
  const user = process.env.NAVIDROME_USER
  const pass = process.env.NAVIDROME_PASSWORD
  if (!user || !pass) throw new NavidromeError("Set NAVIDROME_USER and NAVIDROME_PASSWORD.")
  const salt = randomBytes(8).toString("hex")
  const token = createHash("md5").update(pass + salt).digest("hex")
  return new URLSearchParams({ u: user, t: token, s: salt, v: API_VERSION, c: CLIENT, f: "json" })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function subsonic<T>(endpoint: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = authParams()
  for (const [k, v] of Object.entries(extra)) qs.set(k, v)
  let res: Response
  try {
    res = await fetch(`${BASE}/rest/${endpoint}?${qs}`, {
      headers: { "User-Agent": CLIENT, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new NavidromeError(`Navidrome at ${BASE} is unreachable. Set NAVIDROME_URL.`)
  }
  if (res.status === 401 || res.status === 403) throw new NavidromeError("Navidrome refused (401/403). Check user/password.")
  if (!res.ok) throw new NavidromeError(`Navidrome error ${res.status}`)
  const data = (await res.json()) as Raw
  const inner = data["subsonic-response"] ?? {}
  if (inner.status !== "ok") {
    const err = (inner.error ?? {}) as Raw
    throw new NavidromeError(`Navidrome: ${err.message ?? "request failed"}`)
  }
  return inner as T
}

export async function ping(): Promise<string> {
  await subsonic<Raw>("ping.view")
  return `Navidrome at ${BASE} answers.`
}

export interface Artist {
  id: string
  name: string
  albums?: number
}

export async function listArtists(): Promise<Artist[]> {
  const data = await subsonic<Raw>("getIndexes.view", {})
  const groups: Raw[] = Array.isArray(data.indexes?.index) ? data.indexes.index : []
  const out: Artist[] = []
  for (const g of groups) {
    const arts: Raw[] = Array.isArray(g.artist) ? g.artist : []
    for (const a of arts.slice(0, 100)) {
      out.push({ id: String(a.id), name: String(a.name ?? "?"), albumCount: Number(a.albumCount ?? 0) } as Artist)
      if (out.length >= 50) return out
    }
  }
  return out
}

export interface Album {
  id: string
  name: string
  artist?: string
  year?: number
  songs?: number
}

export async function searchLibrary(query: string, limit = 10): Promise<{ artists: Artist[]; albums: Album[] }> {
  if (!query.trim()) throw new NavidromeError("Query is empty.")
  const data = await subsonic<Raw>("search3.view", { query: query.trim(), artistCount: String(limit), albumCount: String(limit), songCount: "0" })
  const res: Raw = data.searchResult3 ?? {}
  const artists: Raw[] = Array.isArray(res.artist) ? res.artist : []
  const albums: Raw[] = Array.isArray(res.album) ? res.album : []
  return {
    artists: artists.slice(0, limit).map((a) => ({ id: String(a.id), name: String(a.name ?? "?") })),
    albums: albums.slice(0, limit).map((a) => ({
      id: String(a.id),
      name: String(a.name ?? a.title ?? "?"),
      artist: a.artist,
      year: a.year,
      songs: a.songCount,
    })),
  }
}

export function streamUrl(songId: string): string {
  const qs = authParams()
  return `${BASE}/rest/stream.view?id=${encodeURIComponent(songId)}&${qs}`
}

export function formatAlbum(a: Album, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${a.id}] ${a.name}${a.artist ? ` — ${a.artist}` : ""}${a.year ? ` (${a.year})` : ""}${a.songs !== undefined ? ` [${a.songs} songs]` : ""}`
}
