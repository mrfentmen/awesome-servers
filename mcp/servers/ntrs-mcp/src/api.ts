/**
 * NASA NTRS — the public Technical Reports Server API. Keyless, no signup, and
 * rate-limited to 500 requests per window per the `x-ratelimit-limit` header.
 *
 * The search endpoint returns full citation objects next to `aggregations`
 * (Elasticsearch facets), so the facet tool is a thin reader over the same call.
 * Sort parameters are accepted by the server but ignored — the result order is
 * unchanged whatever you send — so this client offers no sort option rather
 * than pretending one works.
 */
const API = "https://ntrs.nasa.gov/api/citations"
const SITE = "https://ntrs.nasa.gov"

export class NtrsError extends Error {}

interface AuthorAffiliation {
  meta?: { author?: { name?: string } }
}

interface DownloadLinks {
  original?: string
  pdf?: string
  fulltext?: string
}

interface Download {
  name?: string
  mimetype?: string
  type?: string
  links?: DownloadLinks
}

interface Related {
  id?: number | string
  type?: string
  title?: string
}

interface SourceIdentifier {
  type?: string
  number?: string
  descriptor?: string
}

interface Citation {
  id?: number | string
  title?: string
  abstract?: string
  distributionDate?: string
  stiType?: string
  stiTypeDetails?: string
  distribution?: string
  disseminated?: string
  keywords?: string[]
  subjectCategories?: string[]
  center?: { code?: string; name?: string }
  authorAffiliations?: AuthorAffiliation[]
  downloads?: Download[]
  downloadsAvailable?: boolean
  related?: Related[]
  sourceIdentifiers?: SourceIdentifier[]
  onlyAbstract?: boolean
}

interface Bucket {
  key?: string | number
  key_as_string?: string
  doc_count?: number
}

interface SearchResponse {
  stats?: { total?: number }
  results?: Citation[]
  aggregations?: Record<string, { buckets?: Bucket[] } | undefined>
}

async function getJson(url: string, timeoutMs = 30000): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "ntrs-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new NtrsError("NTRS has no record at that address")
    if (!res.ok) throw new NtrsError(`NTRS responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof NtrsError) throw e
    if ((e as Error).name === "AbortError") throw new NtrsError("NTRS request timed out")
    throw new NtrsError(`NTRS request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/* --------------------------------------------------------------- readers */

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const decode = (s: string): string =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

function authorNames(rec: Citation): string[] {
  return (rec.authorAffiliations ?? [])
    .map((a) => (a?.meta?.author?.name ?? "").trim())
    .filter((n) => n !== "")
}

const dateOf = (rec: Citation): string => (rec.distributionDate ?? "").slice(0, 10) || "date unknown"

const absolute = (path: string): string => (/^https?:\/\//i.test(path) ? path : `${SITE}${path}`)

function cleanId(input: string): string {
  const v = input
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^citations\//i, "")
    .replace(/\/$/, "")
  if (!/^\d{6,20}$/.test(v)) {
    throw new NtrsError(`"${input}" is not an NTRS id — expected something like 20230002992`)
  }
  return v
}

function searchParams(query: string, limit: number, page: number, center?: string, stiType?: string): URLSearchParams {
  const q = query.trim()
  if (q === "") throw new NtrsError('q must not be empty — NTRS rejects blank searches, so pass a word or phrase')
  const params = new URLSearchParams({
    q,
    "page.size": String(clamp(limit, 1, 100)),
    "page.number": String(Number.isInteger(page) && page > 0 ? page : 1),
  })
  if (center && center.trim() !== "") params.set("center", center.trim().toUpperCase())
  if (stiType && stiType.trim() !== "") params.set("stiType", stiType.trim().toUpperCase())
  return params
}

/* ----------------------------------------------------------------- tools */

export async function search(query: string, limit = 10, page = 1, center?: string, stiType?: string): Promise<string> {
  const params = searchParams(query, limit, page, center, stiType)
  const num = Number(params.get("page.number"))
  const size = Number(params.get("page.size"))
  const data = (await getJson(`${API}/search?${params.toString()}`)) as SearchResponse | null
  const total = data?.stats?.total ?? 0
  const rows = data?.results ?? []
  const q = query.trim()

  if (total === 0) return `No NTRS records match "${q}".`
  if (rows.length === 0) return `"${q}" has ${total} records, but page ${num} is past the end.`

  const start = (num - 1) * size + 1
  return [
    `"${q}" — ${total} records, showing ${start}-${start + rows.length - 1}`,
    "",
    ...rows.map((r, i) => {
      const authors = authorNames(r)
      const shown = authors.length > 3 ? `${authors.slice(0, 3).join(", ")} +${authors.length - 3} more` : authors.join(", ")
      const meta = [
        shown || "no authors listed",
        dateOf(r),
        r.stiType ?? "type unknown",
        r.center?.code ?? "",
        r.downloadsAvailable ? "file available" : "metadata only",
      ]
        .filter((p) => p !== "")
        .join(" · ")
      return `${start + i}. [${String(r.id ?? "no id")}] ${(r.title ?? "(untitled)").trim()}\n   ${meta}`
    }),
  ].join("\n")
}

export async function record(id: string): Promise<string> {
  const clean = cleanId(id)
  const rec = (await getJson(`${API}/${clean}`)) as Citation | null
  if (!rec || typeof rec !== "object") throw new NtrsError(`NTRS has no record ${clean}`)

  const authors = authorNames(rec)
  const shown = authors.length > 8 ? `${authors.slice(0, 8).join(", ")} +${authors.length - 8} more` : authors.join(", ")

  const identifiers = Array.from(
    new Set(
      (rec.sourceIdentifiers ?? [])
        .map((s) => {
          const value = (s.number ?? s.descriptor ?? "").trim()
          if (value === "") return ""
          return s.type ? `${s.type} ${value}` : value
        })
        .filter((s) => s !== "")
    )
  )

  const files = (rec.downloads ?? [])
    .map((d) => {
      const url = d.links?.pdf ?? d.links?.original ?? d.links?.fulltext ?? ""
      if (url === "") return ""
      return `   - ${d.name || "file"}${d.mimetype ? ` (${d.mimetype})` : ""}: ${absolute(url)}`
    })
    .filter((f) => f !== "")

  const related = (rec.related ?? [])
    .filter((r) => r && r.id !== undefined)
    .map((r) => `   - [${String(r.id)}] ${r.type ?? "RELATED"} · ${(r.title ?? "(untitled)").trim()}`)

  const abstract = decode(rec.abstract ?? "")

  return [
    (rec.title ?? "(no title in the record)").trim(),
    "",
    `Authors: ${shown || "none listed"}`,
    rec.center?.name ? `Center: ${rec.center.name}${rec.center.code ? ` (${rec.center.code})` : ""}` : "",
    rec.stiType ? `Type: ${rec.stiType}${rec.stiTypeDetails ? ` — ${rec.stiTypeDetails}` : ""}` : "",
    `Released: ${dateOf(rec)}`,
    `Distribution: ${rec.distribution ?? "unknown"}${rec.disseminated ? ` · ${rec.disseminated}` : ""}`,
    rec.keywords && rec.keywords.length > 0 ? `Keywords: ${rec.keywords.join(", ")}` : "",
    rec.subjectCategories && rec.subjectCategories.length > 0 ? `Categories: ${rec.subjectCategories.join(", ")}` : "",
    `NTRS ID: ${clean}`,
    `Page: ${SITE}/citations/${clean}`,
    identifiers.length > 0 ? `Identifiers: ${identifiers.join(" · ")}` : "",
    files.length > 0 ? `Files:\n${files.join("\n")}` : "Files: none released (metadata only)",
    related.length > 0 ? `Related:\n${related.join("\n")}` : "",
    "",
    abstract || "(no abstract in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

const FACETS: Array<{ key: string; label: string }> = [
  { key: "center", label: "Centers" },
  { key: "stiType", label: "Document types" },
  { key: "subjectCategory", label: "Subject categories" },
  { key: "keyword", label: "Keywords" },
  { key: "published", label: "Publication year" },
  { key: "author", label: "Authors" },
  { key: "organization", label: "Organizations" },
]

export async function facets(query: string, top = 8, center?: string, stiType?: string): Promise<string> {
  const params = searchParams(query, 1, 1, center, stiType)
  const data = (await getJson(`${API}/search?${params.toString()}`)) as SearchResponse | null
  const total = data?.stats?.total ?? 0
  const q = query.trim()
  if (total === 0) return `No NTRS records match "${q}".`

  const size = clamp(top, 1, 50)
  const blocks: string[] = [`Facets for "${q}" — ${total} records`]

  for (const facet of FACETS) {
    const buckets = (data?.aggregations?.[facet.key]?.buckets ?? []).slice(0, size)
    if (buckets.length === 0) continue
    blocks.push("", `${facet.label}:`)
    for (const b of buckets) {
      const label = b.key_as_string ?? (b.key === undefined ? "unknown" : String(b.key))
      blocks.push(`   ${String(b.doc_count ?? 0).padStart(7)}  ${label}`)
    }
  }

  if (blocks.length === 1) return `${blocks[0]}\n\nNTRS returned no facet counts for that query.`
  return blocks.join("\n")
}
