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

/**
 * archive.org answers one CDX query at a time comfortably. Firing several at
 * once — which is what happens when a client calls two tools in the same
 * moment, because the MCP server handles requests concurrently — gets them
 * throttled or slow, so each CDX call waits for the one before it.
 */
let cdxQueue: Promise<unknown> = Promise.resolve()
function cdxOnce<T>(work: () => Promise<T>): Promise<T> {
  const next = cdxQueue.then(work, work)
  cdxQueue = next.then(
    () => undefined,
    () => undefined
  )
  return next
}

/** CDX answers with JSON, but on a miss it can reply with an empty body or plain text. */
async function cdx(query: string, timeoutMs = 45000): Promise<string[][]> {
  const text = (await cdxOnce(() => getText(`${CDX}?${query}`, timeoutMs))).trim()
  if (!text) return []
  let rows: unknown
  try {
    rows = JSON.parse(text)
  } catch {
    if (/^\s*</.test(text)) {
      throw new WaybackError(
        `The Internet Archive could not answer that CDX query (it replied with HTML, usually a gateway timeout). Narrow the request with a date range or try again.`
      )
    }
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
// ---- batch-5 tools: status history, capture gaps, snapshot diff, broken pages (2026-09-27) ----

const monthOf = (ts: string) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}`

/**
 * One row per archived month with the status code recorded then. A page that
 * started redirecting or returning 404 keeps its old 200 captures, so the month
 * list is the only place that change is visible.
 */
export async function statusHistory(url: string, limit = 24): Promise<string> {
  const target = (url ?? "").trim()
  if (!target) throw new WaybackError("Provide a URL, e.g. 'example.com'.")
  const capped = Math.min(Math.max(Math.trunc(limit) || 24, 1), 120)
  // limit=-N asks CDX for the newest N rows, which is the end of the history that matters.
  const rows = await cdx(
    `url=${encodeURIComponent(target)}&output=json&fl=timestamp,statuscode&collapse=timestamp:6&limit=-${capped}`
  )
  if (!rows.length) return `No archived snapshots of ${target}.`
  const ordered = [...rows].sort((a, b) => String(b[0] ?? "").localeCompare(String(a[0] ?? "")))
  const tally = new Map<string, number>()
  for (const row of rows) {
    const code = (row[1] ?? "").trim() || "-"
    tally.set(code, (tally.get(code) ?? 0) + 1)
  }
  const codes = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => `${code} (${n} month(s))`)
  const broken = rows.filter((row) => /^[45]/.test((row[1] ?? "").trim())).length
  return [
    `Archived status history for ${target} — newest ${ordered.length} month(s) with a capture:`,
    ...ordered.map((row) => `  ${monthOf(row[0] ?? "")} — ${(row[1] ?? "").trim() || "-"}`),
    "",
    `Status codes seen: ${codes.join(", ")}`,
    broken
      ? `${broken} of these months were archived with a 4xx/5xx status, so the page was already broken then.`
      : "Every month shown archived cleanly.",
    `A "-" code means the crawler stored the capture without an HTTP status.`,
  ].join("\n")
}

/**
 * Coverage of the archive for one URL: which months inside the captured span
 * have no capture at all, and the longest run of them. This is how a research
 * or compliance question gets answered honestly: not "is it archived" but
 * "how much of the period is actually missing".
 */
export async function captureGaps(url: string, since?: string): Promise<string> {
  const target = (url ?? "").trim()
  if (!target) throw new WaybackError("Provide a URL, e.g. 'example.com'.")
  const encoded = encodeURIComponent(target)
  const thisYear = new Date().getUTCFullYear()

  // Where the history starts comes from one cheap query. Asking CDX to collapse
  // the whole history in a single request is the query archive.org answers with
  // a gateway timeout, so the coverage is read one year at a time instead.
  const firstRows = await cdx(`url=${encoded}&output=json&fl=timestamp&limit=1`)
  if (!firstRows.length) return `Nothing archived for ${target}.`
  const firstCapture = String(firstRows[0]?.[0] ?? "")
  const firstYear = Number(firstCapture.slice(0, 4)) || thisYear
  const wanted = /^\d{4}$/.test(String(since ?? "").trim()) ? Number(String(since).trim()) : NaN
  const startYear = Math.max(Number.isFinite(wanted) ? wanted : firstYear, thisYear - 9)
  const years: number[] = []
  for (let year = startYear; year <= thisYear; year += 1) years.push(year)

  const seen = new Set<string>()
  const unanswered: number[] = []
  for (const year of years) {
    try {
      const rows = await cdx(
        `url=${encoded}&output=json&fl=timestamp&collapse=timestamp:6&limit=100&from=${year}0101&to=${year}1231`
      )
      for (const row of rows) {
        const month = monthOf(row[0] ?? "")
        if (/^\d{4}-\d{2}$/.test(month)) seen.add(month)
      }
    } catch {
      unanswered.push(year)
    }
  }
  if (!seen.size && unanswered.length === years.length) {
    throw new WaybackError(
      `The Internet Archive did not answer any of the ${years.length} yearly CDX queries for ${target}. It is probably busy — try again.`
    )
  }
  const months = [...seen].sort()
  if (!months.length) {
    return `No captures of ${target} between ${startYear} and ${thisYear}. The first capture on record is ${firstCapture || "unknown"}.`
  }
  const first = months[0]
  const last = months[months.length - 1]
  const span: string[] = []
  let [year, month] = first.split("-").map(Number)
  const [lastYear, lastMonth] = last.split("-").map(Number)
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    span.push(`${year}-${String(month).padStart(2, "0")}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  const missing = span.filter((m) => !seen.has(m))
  let run: string[] = []
  let longest: string[] = []
  for (const m of span) {
    if (seen.has(m)) {
      run = []
      continue
    }
    run = [...run, m]
    if (run.length > longest.length) longest = run
  }
  const percent = span.length ? Math.round((seen.size / span.length) * 100) : 0
  return [
    `Archive coverage for ${target}`,
    `  Window checked: ${years[0]}-01 to ${thisYear}-12, read one year at a time (10 years per call at most)`,
    `  First capture on record: ${firstCapture || "unknown"}`,
    `  Captured months: ${seen.size} of ${span.length} between ${first} and ${last}`,
    `  Coverage: ${percent}%`,
    unanswered.length ? `  Years archive.org did not answer: ${unanswered.join(", ")} — they are counted as gaps here, so rerun if that matters` : "",
    `  Months with no capture: ${missing.length}`,
    longest.length
      ? `  Longest gap: ${longest[0]} to ${longest[longest.length - 1]} (${longest.length} month(s))`
      : "  No gaps: every month in the span has at least one capture.",
    missing.length
      ? `\nMonths missing: ${missing.slice(0, 40).join(", ")}${missing.length > 40 ? `, and ${missing.length - 40} more` : ""}`
      : "",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

const words = (text: string): string[] => {
  const found = text.toLowerCase().match(/[a-z][a-z0-9'’-]{3,}/g) ?? []
  return [...new Set(found)]
}

/**
 * What actually changed between the same page in two different years: the
 * wording that appeared and the wording that vanished. compare_years prints the
 * two pages; this reports the difference between them.
 */
export async function snapshotDiff(args: {
  url: string
  yearA: string
  yearB: string
  maxChars?: number
}): Promise<string> {
  const target = (args.url ?? "").trim()
  if (!target) throw new WaybackError("Provide a URL, e.g. 'example.com'.")
  const yearA = String(args.yearA ?? "").trim()
  const yearB = String(args.yearB ?? "").trim()
  for (const [label, year] of [["yearA", yearA], ["yearB", yearB]] as const) {
    if (!/^\d{4}$/.test(year)) throw new WaybackError(`Provide ${label} as a four digit year, e.g. 2015.`)
  }
  if (yearA === yearB) throw new WaybackError("Give two different years to compare.")
  const maxChars = Math.min(Math.max(Math.trunc(args.maxChars ?? 12000) || 12000, 1000), 50000)

  // The year's first 200 capture is found with one bounded CDX query rather
  // than getSnapshots, so this call can wait longer than the default and is not
  // competing with other CDX traffic for a short timeout.
  const read = async (year: string): Promise<{ text: string; timestamp: string } | null> => {
    const rows = await cdx(
      `url=${encodeURIComponent(target)}&output=json&fl=timestamp,original&filter=statuscode:200&limit=1&from=${year}0101&to=${year}1231`,
      60000
    )
    const timestamp = String(rows[0]?.[0] ?? "")
    if (!timestamp) return null
    const original = String(rows[0]?.[1] ?? target)
    const text = await getSnapshotText(timestamp, original, maxChars)
    return { text, timestamp }
  }

  const a = await read(yearA)
  const b = await read(yearB)
  if (!a && !b) return `Nothing archived for ${target} in ${yearA} or ${yearB}.`
  if (!a) return `Nothing archived for ${target} in ${yearA}, so there is nothing to diff against ${yearB} (which has a ${b?.timestamp ? fmtTimestamp(b.timestamp) : "?"} capture).`
  if (!b) return `Nothing archived for ${target} in ${yearB}, so there is nothing to diff against ${yearA} (which has a ${fmtTimestamp(a.timestamp)} capture).`

  const before = words(a.text)
  const after = words(b.text)
  const beforeSet = new Set(before)
  const afterSet = new Set(after)
  const added = after.filter((w) => !beforeSet.has(w))
  const removed = before.filter((w) => !afterSet.has(w))
  const shared = after.filter((w) => beforeSet.has(w)).length
  const overlap = after.length ? Math.round((shared / after.length) * 100) : 0

  const sample = (list: string[]) =>
    list.length ? list.slice(0, 25).join(", ") + (list.length > 25 ? `, and ${list.length - 25} more` : "") : "—"

  return [
    `Diff of ${target} between ${yearA} and ${yearB}`,
    `  ${yearA}: ${fmtTimestamp(a.timestamp)} capture, ${a.text.length} chars, ${before.length} distinct words`,
    `  ${yearB}: ${fmtTimestamp(b.timestamp)} capture, ${b.text.length} chars, ${after.length} distinct words`,
    `  Wording kept: ${shared} of ${after.length} words (${overlap}% of ${yearB} still present in ${yearA})`,
    "",
    `Words only in ${yearB} (${added.length}): ${sample(added)}`,
    "",
    `Words only in ${yearA} (${removed.length}): ${sample(removed)}`,
    "",
    "Words are compared after stripping markup and lowercasing, so this is a wording diff, not a byte diff.",
  ].join("\n")
}

/**
 * Captures that came back as something other than 200 across a whole domain:
 * redirects and dead pages. Link-rot checks and site audits start here.
 */
export async function brokenPages(url: string, limit = 15): Promise<string> {
  const target = (url ?? "").trim()
  if (!target) throw new WaybackError("Provide a domain, e.g. 'example.com'.")
  const capped = Math.min(Math.max(Math.trunc(limit) || 15, 1), 50)
  const rows = await cdx(
    `url=${encodeURIComponent(target)}&matchType=domain&output=json&fl=timestamp,original,statuscode&filter=!statuscode:200&limit=${capped}`
  )
  const unique = [...new Map(rows.map((row) => [`${row[0]}|${row[1]}`, row])).values()]
  if (!unique.length) {
    return `Every archived capture of ${target} came back 200 — no redirects or error captures in the archive.`
  }
  return [
    `Archived captures of ${target} that were not HTTP 200 (${unique.length} shown):`,
    ...unique.map((row) => {
      const code = (row[2] ?? "").trim() || "-"
      const kind = /^3/.test(code) ? "redirect" : /^[45]/.test(code) ? "broken" : "no status"
      return `  ${fmtTimestamp(row[0] ?? "")} — ${code} (${kind})\n     ${row[1] ?? target}`
    }),
    "",
    `These are the archived copies, not the live site: a 404 here means the crawler captured that page broken, which is what link rot looks like over time.`,
  ].join("\n")
}
