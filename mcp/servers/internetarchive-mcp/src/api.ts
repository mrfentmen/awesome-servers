/**
 * Internet Archive — the public archive of books, films, audio, software and
 * web collections. Keyless.
 *
 * Verified live: the advanced search endpoint answers Solr JSON
 * (`response.numFound`, `response.docs`), and `/metadata/<id>` returns the item
 * metadata under a `metadata` key alongside its file list.
 */
const ADV = "https://archive.org/advancedsearch.php"
const META = "https://archive.org/metadata/"
const SITE = "https://archive.org/details/"

export class ArchiveError extends Error {}

interface Doc {
  identifier?: string
  title?: string
  creator?: string | string[]
  date?: string
  mediatype?: string
  downloads?: number
}

interface SearchBody {
  response?: { numFound?: number; docs?: Doc[] }
}

interface ItemBody {
  metadata?: Record<string, unknown>
  files?: unknown[]
  is_collection?: boolean
}

const FIELDS = ["identifier", "title", "creator", "date", "mediatype", "downloads"]

async function getJson<T>(url: string, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "internetarchive-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new ArchiveError("the Internet Archive has no such item")
    if (!res.ok) throw new ArchiveError(`the Internet Archive responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ArchiveError) throw e
    if ((e as Error).name === "AbortError") throw new ArchiveError("the Internet Archive request timed out")
    throw new ArchiveError(`the Internet Archive request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "")

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "")

function cleanId(input: string): string {
  const v = input
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^(details|metadata)\//i, "")
    .replace(/\/$/, "")
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(v)) {
    throw new ArchiveError(`"${input}" is not an archive.org identifier`)
  }
  return v
}

export async function search(q: string, limit = 10, page = 1, mediatype?: string): Promise<string> {
  const term = q.trim()
  if (term === "") throw new ArchiveError("q must not be empty")
  const size = clamp(limit, 1, 100)
  const num = Number.isInteger(page) && page > 0 ? page : 1

  const query = mediatype ? `(${term}) AND mediatype:${mediatype.trim()}` : term
  const params = new URLSearchParams({ q: query, rows: String(size), page: String(num), output: "json" })
  for (const f of FIELDS) params.append("fl[]", f)

  const body = await getJson<SearchBody>(`${ADV}?${params.toString()}`)
  const total = body.response?.numFound ?? 0
  const docs = body.response?.docs ?? []
  if (total === 0) return `No Internet Archive items match "${term}".`
  if (docs.length === 0) return `"${term}" has ${total} items, but page ${num} is past the end.`

  const start = (num - 1) * size + 1
  const lines = docs.map((d, i) => {
    const meta = [
      d.mediatype ?? "unknown type",
      day(d.date) || "no date",
      first(d.creator) || "no creator",
      d.downloads !== undefined ? `${d.downloads} downloads` : "",
    ]
      .filter((p) => p !== "")
      .join(" · ")
    return `${start + i}. ${(d.title ?? "(untitled)").trim()}\n   ${meta}\n   id: ${d.identifier ?? "unknown"}`
  })

  return [`"${term}" — ${total} items, showing ${start}-${start + docs.length - 1}`, "", ...lines].join("\n")
}

export async function item(id: string): Promise<string> {
  const clean = cleanId(id)
  const body = await getJson<ItemBody>(`${META}${encodeURIComponent(clean)}`)
  const meta = body.metadata ?? {}
  if (Object.keys(meta).length === 0) throw new ArchiveError(`the Internet Archive has no item ${clean}`)

  const creator = meta.creator
  const description = typeof meta.description === "string" ? meta.description : ""

  return [
    String(meta.title ?? "(no title in the record)"),
    "",
    `Identifier: ${clean}`,
    meta.mediatype ? `Media type: ${String(meta.mediatype)}` : "",
    creator ? `Creator: ${Array.isArray(creator) ? creator.join("; ") : String(creator)}` : "",
    meta.date ? `Date: ${String(meta.date).slice(0, 10)}` : "",
    meta.publisher ? `Publisher: ${String(meta.publisher)}` : "",
    meta.licenseurl ? `Licence: ${String(meta.licenseurl)}` : "",
    body.files ? `Files: ${body.files.length}` : "",
    `Page: ${SITE}${clean}`,
    "",
    description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "(no description in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
