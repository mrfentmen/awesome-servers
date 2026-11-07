/**
 * Cover Art Archive — Album cover art from the Cover Art Archive by MusicBrainz release id. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against coverartarchive.org.
 */
const API = "https://coverartarchive.org"

export class CoverArtArchiveError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "coverartarchive-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new CoverArtArchiveError(`Cover Art Archive returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof CoverArtArchiveError) throw e
    if ((e as Error).name === "AbortError") throw new CoverArtArchiveError("Cover Art Archive request timed out")
    throw new CoverArtArchiveError(`Cover Art Archive request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function releaseArtwork(releaseId: string): Promise<string> {
  const id = releaseId.trim()
  if (!/^[0-9a-fA-F-]{30,40}$/.test(id)) throw new CoverArtArchiveError("release id must be a MusicBrainz UUID")
  const body = await get<unknown>(`${API}/release/${encodeURIComponent(id)}`)
  const images = rows(at(body, "images"))
  if (images.length === 0) return `The Cover Art Archive has no images for release ${id}.`
  const lines = images.slice(0, 8).map((img, i) => {
    const front = val(at(img, "front")) === "true" ? " (front)" : ""
    return `${i + 1}.${front} ${val(at(img, "image"))}`
  })
  return [`Cover Art Archive release ${id} — ${images.length} images`, "", ...lines].join("\n")
}
