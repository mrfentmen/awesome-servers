/**
 * Wayback Machine client. Keyless.
 *  - CDX API lists snapshot history for a URL.
 *  - /wayback/available finds the nearest snapshot.
 *  - /web/{timestamp}id_/{url} serves the archived page content.
 */
const CDX = "https://web.archive.org/cdx/search/cdx"
const AVAILABLE = "https://archive.org/wayback/available"

export class WaybackError extends Error {}

export interface Snapshot {
  timestamp: string
  original: string
  statusCode: string
  mimeType: string
  length: string
  url: string
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "wayback-mcp/1.0", Accept: "application/json,text/plain,text/html" },
  })
  if (!res.ok) throw new WaybackError(`Wayback error ${res.status} for ${url.slice(0, 100)}`)
  return res.text()
}

export async function getSnapshots(url: string, limit = 10): Promise<Snapshot[]> {
  const q = `${CDX}?url=${encodeURIComponent(url)}&output=json&fl=timestamp,original,statuscode,mimetype,length&filter=statuscode:200&limit=${limit}`
  const text = await getText(q)
  const rows: string[][] = JSON.parse(text)
  if (rows.length <= 1) return []
  const [, ...data] = rows
  return data.map((r) => ({
    timestamp: r[0] ?? "",
    original: r[1] ?? url,
    statusCode: r[2] ?? "",
    mimeType: r[3] ?? "",
    length: r[4] ?? "",
    url: `https://web.archive.org/web/${r[0]}id_/${r[1] ?? url}`,
  }))
}

export async function getAvailability(url: string): Promise<Snapshot | null> {
  const text = await getText(`${AVAILABLE}?url=${encodeURIComponent(url)}`)
  const d = JSON.parse(text) as { archived_snapshots?: { closest?: { url?: string; timestamp?: string; status?: string } } }
  const closest = d.archived_snapshots?.closest
  if (!closest?.url) return null
  return {
    timestamp: closest.timestamp ?? "",
    original: url,
    statusCode: closest.status ?? "",
    mimeType: "",
    length: "",
    url: closest.url,
  }
}

export async function getSnapshotText(
  timestamp: string,
  originalUrl: string,
  maxChars = 15000
): Promise<string> {
  const target = `https://web.archive.org/web/${timestamp}id_/${originalUrl}`
  const raw = await getText(target)
  const plain = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
  return plain.slice(0, maxChars)
}

export function fmtTimestamp(ts: string): string {
  if (ts.length < 12) return ts
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)} UTC`
}

export function formatSnapshot(s: Snapshot, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${fmtTimestamp(s.timestamp)}`
  const lines = [
    head,
    `Status ${s.statusCode || "?"}${s.mimeType ? ` · ${s.mimeType}` : ""}${s.length ? ` · ${s.length} bytes` : ""}`,
    s.url,
  ].filter(Boolean)
  return lines.join("\n")
}
