const BASE = "https://api.openverse.org/v1"
const UA = "mrfentmen-openverse-mcp/1.0 (https://github.com/mrfentmen)"
export class OpenverseError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new OpenverseError("Openverse rate limit hit, wait and retry")
  if (!res.ok) throw new OpenverseError(`Openverse error ${res.status}`)
  return (await res.json()) as T
}

export async function searchImages(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new OpenverseError("Provide search terms")
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any>(`${BASE}/images/?q=${encodeURIComponent(q)}&page_size=${limit}`)
  const results = d?.results ?? []
  if (!results.length) return "No images found"
  return results.map((img: any, i: number) => {
    const title = (img?.title ?? "Untitled").slice(0, 80)
    const license = img?.license ?? "n/a"
    const url = img?.url ?? img?.thumbnail ?? img?.foreign_landing_url ?? ""
    return `${i + 1}. ${title}\n   License: ${license}${img?.creator ? ` | by ${img.creator}` : ""}\n   ${url}`
  }).join("\n\n")
}

// ---- muxA tools:
// The existing tool searches images. These add the index of every source with
// its live item count, a full audio search with the filters this API really
// applies, and one record in full with the attribution wording and the optional
// related items.
//
// Facts this pack is built on, each checked live against api.openverse.org:
//   * /images/ and /audio/ share one page shape: result_count, page_count,
//     page_size, page, results, and result_count never exceeds 240, so 240 is a
//     paging ceiling and not a total.
//   * page_size may not exceed 20 without a key. Asking for 50 answers HTTP 401
//     with "page_size may not exceed 20 for anonymous requests", so the ceiling
//     is applied here and the reason is printed when a larger value is trimmed.
//   * source, category, license and license_type are all validated by the API:
//     an unknown value answers HTTP 400 with the allowed values, verified with
//     source=boguszz, category=boguszz, license=bogus and license_type=bogus.
//   * genres, creator and mature are accepted and then IGNORED. q=jazz with
//     genres=classical, with genres=boguszz and with no genres all returned the
//     identical five ids, creator=boguszzzz returned the unfiltered results, and
//     mature=true and mature=false agree with each other, so none of the three
//     is offered as a filter.
//   * an unknown record id answers HTTP 404 with an HTML page, not JSON, so the
//     body is read as text and only parsed when it looks like JSON.
//   * /images/<id>/related/ and /audio/<id>/related/ are fixed at 10 items a
//     page and ignore page_size entirely.
//   * the anonymous quota is 20 requests a minute and 200 a day, reported in the
//     x-ratelimit-limit-anon_burst and x-ratelimit-limit-anon_sustained headers.
interface OpenverseSourceStat {
  source_name?: string
  display_name?: string
  source_url?: string
  media_count?: number
}

interface OpenversePage {
  result_count?: number
  page_count?: number
  page_size?: number
  page?: number
  results?: Array<Record<string, unknown>>
}

type OpenverseMedia = "images" | "audio"

const OPENVERSE_PAGE_MAX = 20
// Every query tried, from cat images to jazz audio, reported exactly 240, and
// page_count was always 240 divided by page_size.
const OPENVERSE_RESULT_CAP = 240

function ovText(value: unknown, fallback = "not reported"): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback
}

function ovCount(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "not reported"
}

function ovBytes(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "size not reported"
  const units = ["B", "KB", "MB", "GB"]
  let n = value
  let unit = 0
  while (n >= 1024 && unit < units.length - 1) {
    n /= 1024
    unit += 1
  }
  return `${n.toFixed(unit > 0 && n < 10 ? 1 : 0)} ${units[unit]}`
}

// Audio durations arrive in milliseconds, verified as 202000 for a three minute
// track, so they are shown as minutes and seconds rather than a raw number.
function ovDuration(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "length not reported"
  const total = Math.round(value / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

// The page size ceiling is 20 without a key, and exceeding it is an HTTP 401
// rather than a trim, so the value is clamped here instead of failing the call.
function ovPageSize(asked: number | undefined, fallback: number): { size: number; note: string } {
  const wanted = Number.isFinite(asked) ? Math.trunc(asked as number) : fallback
  const clamped = Math.min(Math.max(wanted, 1), OPENVERSE_PAGE_MAX)
  return {
    size: clamped,
    note: wanted > OPENVERSE_PAGE_MAX ? ` (asked for ${wanted}, capped at ${OPENVERSE_PAGE_MAX} for anonymous callers)` : "",
  }
}

function ovLicence(row: Record<string, unknown>): string {
  const licence = ovText(row.license, "licence not reported")
  const version = typeof row.license_version === "string" ? row.license_version : ""
  return version ? `${licence} ${version}` : licence
}

function ovNames(value: unknown, limit = 8): string {
  if (!Array.isArray(value) || !value.length) return ""
  const names = value.map((tag) => (tag && typeof tag === "object" ? String((tag as { name?: unknown }).name ?? "") : String(tag))).filter(Boolean)
  // The same tag arrives more than once on some records, verified as
  // cat, cat, glass, one on a flickr image, so repeats are dropped.
  return [...new Set(names)].slice(0, limit).join(", ")
}

// Counts the anonymous tier allows, read from the response itself, so a caller
// hitting the ceiling can see where the ceiling is.
function ovQuota(headers: Headers): string {
  const burst = headers.get("x-ratelimit-available-anon_burst")
  const sustained = headers.get("x-ratelimit-available-anon_sustained")
  if (burst === null && sustained === null) return "anonymous quota: 20 requests a minute, 200 a day"
  const parts: string[] = []
  if (burst !== null) parts.push(`${burst} of 20 left this minute`)
  if (sustained !== null) parts.push(`${sustained} of 200 left today`)
  return `anonymous quota: ${parts.join(", ")}`
}

// Openverse packs a refusal into detail as an object of field to message list,
// verified as {"detail":{"license":["License 'bogus' does not exist."]}}, while
// other endpoints use a plain string there, so both shapes are read.
function ovReason(body: unknown): string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return ""
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === "string") return detail
  if (!detail || typeof detail !== "object") return ""
  const parts: string[] = []
  for (const [field, value] of Object.entries(detail as Record<string, unknown>)) {
    const messages = (Array.isArray(value) ? value : [value]).map((item) => String(item)).filter(Boolean)
    if (messages.length) parts.push(`${field}: ${messages.join(" ")}`)
  }
  return parts.join("; ")
}

// Openverse answers a bad id with an HTML error page and a refused request with
// a JSON detail field, so the body is read as text first and only parsed when it
// looks like JSON. The existing get() would throw a parse error on the HTML.
async function ovFetch(path: string): Promise<{ status: number; headers: Headers; body: unknown; html: boolean }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  const raw = await res.text()
  let body: unknown = null
  let html = false
  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    html = /^\s*<(!doctype|html)/i.test(raw)
  }
  return { status: res.status, headers: res.headers, body, html }
}

function ovFailure(status: number, body: unknown, html: boolean, quota: string): OpenverseError {
  if (status === 429) {
    return new OpenverseError(
      html
        ? `Openverse refused the request with a bot challenge (HTTP 429), which usually means the shared anonymous quota is spent. ${quota}`
        : `Openverse rate limit reached (HTTP 429). ${quota}`
    )
  }
  const reason = ovReason(body)
  if (reason) return new OpenverseError(`Openverse refused the request: ${reason}`)
  return new OpenverseError(`Openverse API error HTTP ${status}${html ? " with an HTML error page instead of JSON" : ""}`)
}

function ovRow(row: Record<string, unknown>, media: OpenverseMedia): string {
  const lines = [
    `${ovText(row.title, "(untitled)").slice(0, 120)} - ${ovText(row.creator, "creator not reported")} (${ovText(row.source, "source not reported")}, ${ovLicence(row)})`,
    `   ${ovText(row.url, "file url not reported")}`,
  ]
  const facts = [`id ${ovText(row.id, "?")}`]
  if (media === "audio") facts.push(ovDuration(row.duration))
  else if (typeof row.width === "number" && typeof row.height === "number") facts.push(`${row.width}x${row.height}`)
  if (typeof row.filesize === "number") facts.push(ovBytes(row.filesize))
  lines.push(`   ${facts.join(" | ")}`)
  const names = media === "audio" ? ovNames(row.genres) || ovNames(row.tags) : ovNames(row.tags)
  if (names) lines.push(`   ${media === "audio" ? "Genres" : "Tags"}: ${names}`)
  return lines.join("\n")
}

export async function sourceIndex(args: { mediaType?: string; match?: string }): Promise<string> {
  const kind = (args.mediaType ?? "").trim().toLowerCase()
  if (kind && kind !== "images" && kind !== "audio") {
    throw new OpenverseError(`Unknown media type "${args.mediaType}". Use images or audio.`)
  }
  const wanted: OpenverseMedia[] = kind ? [kind as OpenverseMedia] : ["images", "audio"]
  const match = (args.match ?? "").trim().toLowerCase()

  const lines: string[] = ["Openverse sources, with the item count each one contributes right now.", ""]
  let quota = ""
  let grandTotal = 0
  let read = 0
  const failures: OpenverseError[] = []
  for (const media of wanted) {
    const res = await ovFetch(`/${media}/stats/`)
    if (!quota) quota = ovQuota(res.headers)
    if (res.status !== 200 || !Array.isArray(res.body)) {
      const failure = ovFailure(res.status, res.body, res.html, quota)
      failures.push(failure)
      lines.push(`${media}: could not be read. ${failure.message}`)
      continue
    }
    read += 1
    const rows = (res.body as OpenverseSourceStat[])
      .filter((row) => !match || `${row.source_name ?? ""} ${row.display_name ?? ""}`.toLowerCase().includes(match))
      .sort((a, b) => (b.media_count ?? 0) - (a.media_count ?? 0))
    const total = rows.reduce((sum, row) => sum + (row.media_count ?? 0), 0)
    grandTotal += total
    lines.push(`${media}: ${rows.length} source${rows.length === 1 ? "" : "s"}${match ? ` matching "${args.match}"` : ""}, ${ovCount(total)} items`)
    for (const row of rows) {
      lines.push(`  ${ovText(row.source_name, "?")} - ${ovCount(row.media_count)} items - ${ovText(row.display_name, "display name not reported")}`)
    }
    lines.push("")
  }
  // With every source list unreadable the reply would otherwise look like an
  // empty index, so the failure is raised rather than printed as zero items.
  if (read === 0) throw failures[0] ?? new OpenverseError("Openverse answered no source list")
  lines.push(`All told ${ovCount(grandTotal)} items across ${wanted.length === 1 ? "that type" : "images and audio"}.`)
  lines.push("Pass a source_name from this list as the source filter on search_audio. Openverse rejects a name that is not in the list rather than ignoring it.")
  lines.push(quota)
  lines.push(`Openverse reports at most ${OPENVERSE_RESULT_CAP} matches for a search regardless of how many really exist, so the match count on a search is a paging ceiling, while the counts here come from the source index and are exact.`)
  return lines.join("\n")
}

