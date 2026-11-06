/**
 * OSTI — the US Department of Energy's Office of Scientific and Technical
 * Information. Keyless, no signup, one public JSON API.
 *
 * Two endpoint behaviours worth knowing, both verified against the live service:
 *  - `GET /records` answers an array of records; the match count only comes back
 *    in the `x-total-count` response header.
 *  - `GET /records/<id>` also answers an array (usually one item). Unknown ids
 *    fall through to the website and return HTML with status 200, so the content
 *    type is checked before parsing.
 *
 * There is no sort and no facet endpoint: `sort=`, `order=` and `sort=-field`
 * all return the same order as an unsorted request, and `/api/v1/facets` and
 * `/api/v1/records/facets` both 404. Neither is offered rather than faked.
 */
const API = "https://www.osti.gov/api/v1"
const SITE = "https://www.osti.gov"

export class OstiError extends Error {}

interface OstiLink {
  rel?: string
  href?: string
}

interface OstiRecord {
  osti_id?: string | number
  title?: string
  authors?: string[]
  description?: string
  publication_date?: string
  product_type?: string
  article_type?: string
  research_orgs?: string[]
  sponsor_orgs?: string[]
  subjects?: string[]
  links?: OstiLink[]
  doi?: string
  availability?: string
  format?: string
  journal_name?: string
  journal_volume?: string
  journal_issue?: string
  publisher?: string
  report_number?: string
  language?: string
  country_publication?: string
  relation?: string
  other_identifiers?: string[]
}

interface Envelope {
  total: number
  rows: OstiRecord[]
}

async function request(url: string, timeoutMs = 30000): Promise<Envelope> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "osti-mcp", accept: "application/json" },
    })
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok) throw new OstiError(`OSTI responded ${res.status}`)
    if (!type.toLowerCase().includes("json")) {
      throw new OstiError("OSTI has no public record at that address")
    }
    const body: unknown = await res.json()
    const rows = Array.isArray(body) ? (body as OstiRecord[]) : []
    const header = res.headers.get("x-total-count")
    const parsed = header === null ? Number.NaN : Number(header)
    return { total: Number.isFinite(parsed) ? parsed : rows.length, rows }
  } catch (e) {
    if (e instanceof OstiError) throw e
    if ((e as Error).name === "AbortError") throw new OstiError("OSTI request timed out")
    throw new OstiError(`OSTI request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/* --------------------------------------------------------------- helpers */

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const decode = (s: string): string =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

/** Authors arrive as "Last, First [Lab (ABBR), City, ST (United States)] (ORCID:...)". */
const authorName = (raw: string): string =>
  raw
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\(ORCID:[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()

/** "Lawrence Livermore National Laboratory (LLNL), Livermore, CA" -> "LLNL". */
function shortOrg(org: string): string {
  const m = /\(([A-Za-z0-9-]{2,12})\)/.exec(org)
  if (m) return m[1]
  return org.replace(/,.*$/, "").trim()
}

const day = (r: OstiRecord): string => (r.publication_date ?? "").slice(0, 10) || "date unknown"

function cleanId(input: string): string {
  const v = input
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^(pages\/biblio|biblio|servlets\/purl)\//i, "")
    .replace(/\/$/, "")
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,39}$/.test(v)) {
    throw new OstiError(`"${input}" is not an OSTI id — expected something like 3376901`)
  }
  return v
}

/** OSTI accepts a bare year or MM/DD/YYYY; a bare YYYY-MM-DD returns HTTP 500. */
function ostiDate(input: string, label: string): string {
  const v = input.trim()
  if (/^\d{4}$/.test(v)) return v
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v
  throw new OstiError(`${label} must be a year like 2020 or a date like 2020-06-01`)
}

const fulltextLink = (r: OstiRecord): string => (r.links ?? []).find((l) => l.rel === "fulltext")?.href ?? ""

/* ----------------------------------------------------------------- tools */

export interface SearchOptions {
  q?: string
  limit?: number
  page?: number
  title?: string
  author?: string
  subject?: string
  productType?: string
  researchOrg?: string
  sponsorOrg?: string
  dateStart?: string
  dateEnd?: string
}

export async function search(opts: SearchOptions): Promise<string> {
  const q = (opts.q ?? "").trim()
  const filters = {
    title: opts.title?.trim(),
    author: opts.author?.trim(),
    subject: opts.subject?.trim(),
    product_type: opts.productType?.trim(),
    research_org: opts.researchOrg?.trim(),
    sponsor_org: opts.sponsorOrg?.trim(),
  }
  const hasFilter = Object.values(filters).some((v) => v !== undefined && v !== "")
  if (q === "" && !hasFilter) {
    throw new OstiError("give a search term (q) or at least one filter")
  }

  const size = clamp(opts.limit ?? 10, 1, 100)
  const num = Number.isInteger(opts.page) && (opts.page ?? 0) > 0 ? (opts.page as number) : 1
  const params = new URLSearchParams({ q: q === "" ? "*" : q, rows: String(size), page: String(num) })
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, value)
  }
  if (opts.dateStart) params.set("publication_date_start", ostiDate(opts.dateStart, "dateStart"))
  if (opts.dateEnd) params.set("publication_date_end", ostiDate(opts.dateEnd, "dateEnd"))

  const { total, rows } = await request(`${API}/records?${params.toString()}`)
  const label = q === "" ? "all records" : `"${q}"`
  if (total === 0) return `No OSTI records match ${label}.`
  if (rows.length === 0) return `${label} has ${total} records, but page ${num} is past the end.`

  const start = (num - 1) * size + 1
  const lines = rows.map((r, i) => {
    const authors = (r.authors ?? []).map(authorName).filter((a) => a !== "")
    const shown =
      authors.length === 0
        ? "no authors listed"
        : authors.length > 3
          ? `${authors.slice(0, 3).join("; ")} +${authors.length - 3} more`
          : authors.join("; ")
    const org = (r.research_orgs ?? [])[0]
    const meta = [
      shown,
      day(r),
      r.product_type ?? "type unknown",
      org ? shortOrg(org) : "",
      fulltextLink(r) !== "" ? "fulltext" : "no fulltext",
      r.doi ? `doi:${r.doi}` : "",
    ]
      .filter((p) => p !== "")
      .join(" · ")
    return `${start + i}. [${String(r.osti_id ?? "no id")}] ${(r.title ?? "(untitled)").trim()}\n   ${meta}`
  })

  return [`${label} — ${total} records, showing ${start}-${start + rows.length - 1}`, "", ...lines].join("\n")
}

export async function record(id: string): Promise<string> {
  const clean = cleanId(id)
  const { rows } = await request(`${API}/records/${encodeURIComponent(clean)}`)
  const r = rows[0]
  if (!r) throw new OstiError(`OSTI has no public record with id ${clean}`)

  const authors = (r.authors ?? []).map(authorName).filter((a) => a !== "")
  const shown = authors.length > 8 ? `${authors.slice(0, 8).join("; ")} +${authors.length - 8} more` : authors.join("; ")

  const journal = [
    r.journal_name,
    r.journal_volume ? `vol ${r.journal_volume}` : "",
    r.journal_issue ? `issue ${r.journal_issue}` : "",
    r.format,
  ]
    .filter((p) => p !== undefined && p !== "")
    .join(" · ")

  const links = (r.links ?? [])
    .filter((l) => l.href)
    .map((l) => `   - ${l.rel ?? "link"}: ${l.href}`)

  const identifiers = Array.from(
    new Set([...(r.other_identifiers ?? []), r.report_number ?? "", r.relation ?? ""].map((s) => s.trim()).filter((s) => s !== ""))
  )

  return [
    (r.title ?? "(no title in the record)").trim(),
    "",
    `Authors: ${shown || "none listed"}`,
    r.product_type ? `Type: ${r.product_type}${r.article_type ? ` — ${r.article_type}` : ""}` : "",
    `Published: ${day(r)}`,
    r.doi ? `DOI: ${r.doi}` : "",
    journal ? `Journal: ${journal}` : "",
    r.publisher ? `Publisher: ${r.publisher}` : "",
    r.research_orgs && r.research_orgs.length > 0 ? `Research orgs: ${r.research_orgs.join("; ")}` : "",
    r.sponsor_orgs && r.sponsor_orgs.length > 0 ? `Sponsors: ${r.sponsor_orgs.join("; ")}` : "",
    identifiers.length > 0 ? `Identifiers: ${identifiers.join(" · ")}` : "",
    r.subjects && r.subjects.length > 0 ? `Subjects: ${r.subjects.join(", ")}` : "",
    r.availability ? `Availability: ${r.availability}` : "",
    `OSTI ID: ${String(r.osti_id ?? clean)}`,
    `Page: ${SITE}/biblio/${String(r.osti_id ?? clean)}`,
    links.length > 0 ? `Links:\n${links.join("\n")}` : "Links: none listed",
    "",
    decode(r.description ?? "") || "(no description in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
