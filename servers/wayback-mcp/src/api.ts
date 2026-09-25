/**
 * Wayback Machine client. Keyless.
 *  - CDX API lists snapshot history for a URL.
 *  - /wayback/available finds the nearest snapshot.
 *  - /web/{timestamp}id_/{url} serves the archived page content.
 */
const CDX = "https://web.archive.org/cdx/search/cdx"
const AVAILABLE = "https://archive.org/wayback/available"
const UA = "mrfentmen-wayback-mcp/1.0 (https://github.com/mrfentmen)"

export class WaybackError extends Error {}

export interface Snapshot {
  timestamp: string
  original: string
  statusCode: string
  mimeType: string
  length: string
  url: string
}

async function getText(url: string, timeoutMs = 45000): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json,text/plain,text/html" },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    // archive.org can be slow under load; surface that as a clear message.
    throw new WaybackError(`Internet Archive did not respond in ${timeoutMs / 1000}s. It may be busy — try again.`)
  }
  if (res.status === 404) throw new WaybackError(`Not found (404) for ${url.slice(0, 100)}`)
  if (res.status === 503 || res.status === 429) {
    throw new WaybackError(`Internet Archive is temporarily unavailable (HTTP ${res.status}). Try again shortly.`)
  }
  if (!res.ok) throw new WaybackError(`Wayback error ${res.status} for ${url.slice(0, 100)}`)
  return res.text()
}

/** CDX answers with JSON, but on a miss it can reply with an empty body or plain text. */
async function cdx(query: string, timeoutMs = 25000): Promise<string[][]> {
  const text = (await getText(`${CDX}?${query}`, timeoutMs)).trim()
  if (!text) return []
  let rows: unknown
  try {
    rows = JSON.parse(text)
  } catch {
    throw new WaybackError(`Unexpected CDX response: ${text.slice(0, 200)}`)
  }
  if (!Array.isArray(rows) || rows.length <= 1) return []
  return (rows.slice(1) as string[][]).filter((r) => Array.isArray(r))
}

const snapshotUrl = (ts: string, original: string) => `https://web.archive.org/web/${ts}id_/${original}`

export async function getSnapshots(
  url: string,
  args: { limit?: number; from?: string; to?: string } = {}
): Promise<Snapshot[]> {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50)
  const parts = [
    `url=${encodeURIComponent(url)}`,
    "output=json",
    "fl=timestamp,original,statuscode,mimetype,length",
    "filter=statuscode:200",
    `limit=${limit}`,
  ]
  if (args.from) parts.push(`from=${encodeURIComponent(args.from)}`)
  if (args.to) parts.push(`to=${encodeURIComponent(args.to)}`)
  const rows = await cdx(parts.join("&"))
  return rows.map((r) => ({
    timestamp: r[0] ?? "",
    original: r[1] ?? url,
    statusCode: r[2] ?? "",
    mimeType: r[3] ?? "",
    length: r[4] ?? "",
    url: snapshotUrl(r[0] ?? "", r[1] ?? url),
  }))
}

/** Widest view: every host under a domain, not just the exact URL. */
export async function domainSnapshots(domain: string, limit = 20): Promise<Snapshot[]> {
  const capped = Math.min(Math.max(Number(limit) || 20, 1), 50)
  const rows = await cdx(
    `url=${encodeURIComponent(domain)}&matchType=domain&output=json&fl=timestamp,original,statuscode,mimetype,length&filter=statuscode:200&limit=${capped}`
  )
  return rows.map((r) => ({
    timestamp: r[0] ?? "",
    original: r[1] ?? domain,
    statusCode: r[2] ?? "",
    mimeType: r[3] ?? "",
    length: r[4] ?? "",
    url: snapshotUrl(r[0] ?? "", r[1] ?? domain),
  }))
}

export interface SiteHistory {
  first: string
  last: string
  total: number
  byYear: Array<{ year: string; count: number }>
}

/**
 * First/last capture plus a per-year breakdown.
 *
 * Three cheap CDX calls rather than one exhaustive scan: collapsing the whole
 * capture history takes tens of seconds and sometimes times out, while
 * limit=1 / limit=-1 / collapse=timestamp:4 all come back in a few seconds.
 */
export async function siteHistory(url: string, years = 15): Promise<SiteHistory> {
  const base = `url=${encodeURIComponent(url)}&output=json&fl=timestamp`
  // Sequential on purpose: firing these three CDX queries concurrently gets the
  // requests throttled with 503s, and a single failure must not lose the rest.
  const run = async (query: string): Promise<string[][]> => {
    try {
      return await cdx(query)
    } catch (e) {
      failures.push(e)
      return []
    }
  }
  const failures: unknown[] = []
  const firstRows = await run(`${base}&limit=1`)
  const lastRows = await run(`${base}&limit=-1`)
  const perYear = await run(`${base}&collapse=timestamp:4`)
  if (failures.length === 3) {
    const reason = failures[0]
    throw reason instanceof Error ? reason : new WaybackError("CDX lookup failed")
  }
  const first = firstRows[0]?.[0] ?? ""
  const last = lastRows[0]?.[0] ?? ""
  const byYear = perYear
    .map((r) => r[0] ?? "")
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, Math.min(Math.max(years, 1), 40))
    .map((ts) => ({ year: ts.slice(0, 4), count: 1 }))
  if (!first && !last) return { first: "", last: "", total: 0, byYear: [] }
  return { first, last, total: byYear.length, byYear }
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
  const raw = await getText(snapshotUrl(timestamp, originalUrl))
  const plain = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
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
    `${s.original}`,
    `Status ${s.statusCode || "?"}${s.mimeType ? ` · ${s.mimeType}` : ""}${s.length ? ` · ${s.length} bytes` : ""}`,
    s.url,
  ].filter(Boolean)
  return lines.join("\n")
}
