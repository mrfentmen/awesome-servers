/**
 * Zenodo — research records from CERN's open repository. Keyless.
 *
 * Verified live: GET /api/records?size=&q= returns
 * `{hits:{total, hits:[{id, doi, metadata:{title, creators, publication_date,
 * resource_type, description}}]}}`; GET /api/records/<id> returns one record.
 */
const API = "https://zenodo.org/api/records"

export class ZenodoError extends Error {}

interface Creator {
  name?: string
  affiliation?: string
}

interface Metadata {
  title?: string
  creators?: Creator[]
  publication_date?: string
  doi?: string
  resource_type?: { type?: string; subtype?: string }
  description?: string
  keywords?: string[]
  access_right?: string
}

interface Record {
  id?: number
  doi?: string
  metadata?: Metadata
  files?: Array<{ key?: string; size?: number }>
  stats?: { downloads?: number; unique_views?: number }
  links?: { self_html?: string; doi?: string }
}

interface SearchBody {
  hits?: { total?: number; hits?: Record[] }
}

async function get<T>(url: string, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "zenodo-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new ZenodoError("Zenodo has no record with that id")
    if (!res.ok) throw new ZenodoError(`Zenodo responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ZenodoError) throw e
    if ((e as Error).name === "AbortError") throw new ZenodoError("Zenodo request timed out")
    throw new ZenodoError(`Zenodo request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

/**
 * Zenodo does not index version DOIs for search, so a DOI is resolved through
 * the DOI handle system to its landing page, which carries the record id.
 */
async function resolveDoi(doi: string): Promise<number | undefined> {
  try {
    const res = await fetch(`https://doi.org/api/handles/${doi}`, {
      headers: { accept: "application/json", "user-agent": "zenodo-mcp" },
    })
    if (!res.ok) return undefined
    const body = (await res.json()) as { values?: Array<{ data?: { value?: string } }> }
    for (const v of body.values ?? []) {
      const match = /records?\/(\d+)/.exec(v.data?.value ?? "")
      if (match) return Number(match[1])
    }
  } catch {
    // A failed handle lookup just means falling back to the concept-DOI search.
    return undefined
  }
  return undefined
}

const title = (r: Record): string => r.metadata?.title?.trim() || "(untitled)"

function creators(r: Record): string {
  const names = (r.metadata?.creators ?? []).map((c) => c.name).filter((n): n is string => typeof n === "string" && n !== "")
  if (names.length === 0) return "creators unknown"
  return names.length <= 3 ? names.join("; ") : `${names.slice(0, 3).join("; ")}; +${names.length - 3} more`
}

const kind = (r: Record): string => {
  const t = r.metadata?.resource_type
  if (!t) return ""
  return [t.type, t.subtype].filter((v) => typeof v === "string" && v !== "").join("/")
}

const plain = (html: string | undefined): string => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new ZenodoError("query must not be empty")

  const params = new URLSearchParams({ q, size: String(clamp(limit, 1, 100)), sort: "mostrecent" })
  const body = await get<SearchBody>(`${API}?${params.toString()}`)
  const rows = body.hits?.hits ?? []
  const total = body.hits?.total ?? rows.length
  if (rows.length === 0) return `No Zenodo records match "${q}".`

  const lines = rows.flatMap((r, i) => {
    const meta = [creators(r), r.metadata?.publication_date ?? "no date", kind(r)].filter((p) => p !== "").join(" · ")
    return [`${i + 1}. ${title(r)}`, `   ${meta}`, r.doi ? `   doi: ${r.doi}` : ""].filter((l) => l !== "")
  })

  return [`"${q}" — ${total} records`, "", ...lines].join("\n")
}

export async function record(input: string): Promise<string> {
  const value = input
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^https?:\/\/zenodo\.org\/records?\//i, "")
    .replace(/\/$/, "")
  if (value === "") throw new ZenodoError("id must not be empty")

  const isDoi = /^10\.\d{4,9}\/\S+$/.test(value)
  let r: Record | undefined

  if (isDoi) {
    const id = await resolveDoi(value)
    if (id !== undefined) {
      r = await get<Record>(`${API}/${id}`)
    } else {
      const body = await get<SearchBody>(`${API}?q=${encodeURIComponent(`conceptdoi:"${value}"`)}&size=1`)
      r = body.hits?.hits?.[0]
    }
  } else {
    if (!/^\d+$/.test(value)) throw new ZenodoError(`"${input}" is neither a Zenodo record id nor a DOI`)
    r = await get<Record>(`${API}/${value}`)
  }

  if (!r) throw new ZenodoError(`Zenodo has no record for ${input}`)

  const files = r.files ?? []
  return [
    title(r),
    "",
    `Record: ${r.id ?? value}`,
    r.doi ? `DOI: ${r.doi}` : "",
    `Creators: ${creators(r)}`,
    r.metadata?.publication_date ? `Published: ${r.metadata.publication_date}` : "",
    kind(r) ? `Type: ${kind(r)}` : "",
    r.metadata?.access_right ? `Access: ${r.metadata.access_right}` : "",
    files.length > 0 ? `Files: ${files.length}` : "Files: none",
    r.stats?.downloads !== undefined ? `Downloads: ${r.stats.downloads}` : "",
    r.links?.self_html ? `URL: ${r.links.self_html}` : "",
    "",
    plain(r.metadata?.description) || "(no description in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
