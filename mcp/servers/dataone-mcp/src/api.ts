/**
 * DataONE — the shared index of environmental and earth science data from many
 * repositories (NCEI, PANGAEA, LTER, DRYAD and others). Keyless.
 *
 * Everything goes through one Solr endpoint, `cn/v2/query/solr/`, which supports
 * paging (`rows`, `start`), field selection (`fl`) and facets (`facet=true`).
 * Field selection matters: without `fl` each row carries the full indexed text
 * and a two-row page weighs over 100 KB.
 *
 * Sorting is not offered: `sort=datePublished desc` is rejected with HTTP 400,
 * so results stay in relevance order.
 */
const API = "https://cn.dataone.org/cn/v2/query/solr/"
const SITE = "https://cn.dataone.org"

export class DataoneError extends Error {}

interface DataoneDoc {
  id?: string
  title?: string
  author?: string
  abstract?: string
  datePublished?: string
  formatId?: string
  formatType?: string
  datasource?: string
  size?: number
  dataUrl?: string
  licenseName?: string | string[]
  keywords?: string | string[]
  publisher?: string
  resourceMap?: string
}

interface SolrResponse {
  response?: { numFound?: number; start?: number; docs?: DataoneDoc[] }
  facet_counts?: { facet_fields?: Record<string, Array<string | number>> }
}

/** Only the fields the tools print — keeps responses small. */
const FIELDS = [
  "id",
  "title",
  "author",
  "datePublished",
  "formatId",
  "formatType",
  "datasource",
  "size",
  "dataUrl",
  "licenseName",
  "keywords",
  "publisher",
  "abstract",
].join(",")

const FACET_FIELDS = ["formatType", "datasource", "keywords"] as const

async function query(params: URLSearchParams, timeoutMs = 30000): Promise<SolrResponse> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "dataone-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new DataoneError(`DataONE responded ${res.status}`)
    return (await res.json()) as SolrResponse
  } catch (e) {
    if (e instanceof DataoneError) throw e
    if ((e as Error).name === "AbortError") throw new DataoneError("DataONE request timed out")
    throw new DataoneError(`DataONE request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/* --------------------------------------------------------------- helpers */

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const day = (d: DataoneDoc): string => (d.datePublished ?? "").slice(0, 10) || "date unknown"

/** "urn:node:NCEI" -> "NCEI" */
const nodeOf = (s: string | undefined): string => (s ?? "").replace(/^urn:node:/i, "")

/** "science-on-schema.org/Dataset;ld+json" -> "Dataset" */
function shortFormat(formatId: string | undefined): string {
  const v = (formatId ?? "").split(";")[0]
  const tail = v.slice(v.lastIndexOf("/") + 1)
  return tail === "" ? "unknown format" : tail
}

function sizeOf(bytes: number | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const listOf = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v.filter((x) => x !== "") : v === undefined || v === "" ? [] : [v]

function cleanId(input: string): string {
  const v = input
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^(cn\/v2\/resolve|resolve|object)\//i, "")
  const decoded = (() => {
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  })()
  if (!/^[a-z0-9][a-z0-9._:/-]{2,200}$/i.test(decoded)) {
    throw new DataoneError(`"${input}" is not a DataONE identifier`)
  }
  return decoded
}

/** Solr needs quotes escaped inside a quoted phrase. */
const soqlValue = (v: string): string => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

/* ----------------------------------------------------------------- tools */

export interface SearchOptions {
  q?: string
  limit?: number
  page?: number
}

export async function search(opts: SearchOptions): Promise<string> {
  const q = (opts.q ?? "").trim() || "*:*"
  const size = clamp(opts.limit ?? 10, 1, 100)
  const num = Number.isInteger(opts.page) && (opts.page ?? 0) > 0 ? (opts.page as number) : 1

  const params = new URLSearchParams({
    q,
    wt: "json",
    rows: String(size),
    start: String((num - 1) * size),
    fl: FIELDS,
  })
  const data = await query(params)
  const total = data.response?.numFound ?? 0
  const docs = data.response?.docs ?? []
  if (total === 0) return `No DataONE records match "${q}".`
  if (docs.length === 0) return `"${q}" has ${total} records, but page ${num} is past the end.`

  const start = (num - 1) * size + 1
  const lines = docs.map((d, i) => {
    const meta = [
      d.author ?? "no author listed",
      day(d),
      nodeOf(d.datasource),
      shortFormat(d.formatId),
      sizeOf(d.size),
    ]
      .filter((p) => p !== "")
      .join(" · ")
    return `${start + i}. ${(d.title ?? "(untitled)").trim()}\n   ${meta}\n   id: ${d.id ?? "unknown"}`
  })

  return [`"${q}" — ${total} records, showing ${start}-${start + docs.length - 1}`, "", ...lines].join("\n")
}

export async function record(id: string): Promise<string> {
  const clean = cleanId(id)
  const params = new URLSearchParams({ q: `id:"${soqlValue(clean)}"`, wt: "json", rows: "1", fl: FIELDS })
  const data = await query(params)
  const d = data.response?.docs?.[0]
  if (!d) throw new DataoneError(`DataONE has no record with id ${clean}`)

  const licences = listOf(d.licenseName)
  const keywords = listOf(d.keywords)
  const url = d.dataUrl ?? `${SITE}/cn/v2/resolve/${encodeURIComponent(String(d.id ?? clean))}`

  return [
    (d.title ?? "(no title in the record)").trim(),
    "",
    `Author: ${d.author ?? "none listed"}`,
    `Published: ${day(d)}`,
    `Format: ${d.formatId ?? "unknown"}`,
    `Data source: ${nodeOf(d.datasource) || "unknown"}`,
    d.size !== undefined ? `Size: ${sizeOf(d.size)} (${d.size} bytes)` : "",
    d.publisher ? `Publisher: ${d.publisher}` : "",
    licences.length > 0 ? `Licence: ${licences.join(", ")}` : "",
    keywords.length > 0 ? `Keywords: ${keywords.join(", ")}` : "",
    `Identifier: ${d.id ?? clean}`,
    `Data: ${url}`,
    d.resourceMap ? `Metadata: ${d.resourceMap}` : "",
    "",
    (d.abstract ?? "").replace(/\s+/g, " ").trim() || "(no abstract in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

export async function facets(q: string, top = 8): Promise<string> {
  const term = q.trim() || "*:*"
  const size = clamp(top, 1, 50)
  const params = new URLSearchParams({
    q: term,
    wt: "json",
    rows: "0",
    facet: "true",
    "facet.limit": String(size),
    "facet.mincount": "1",
  })
  for (const field of FACET_FIELDS) params.append("facet.field", field)

  const data = await query(params)
  const total = data.response?.numFound ?? 0
  if (total === 0) return `No DataONE records match "${term}".`

  const labels: Record<string, string> = {
    formatType: "Format type",
    datasource: "Data sources",
    keywords: "Keywords",
  }
  const fields = data.facet_counts?.facet_fields ?? {}
  const blocks: string[] = [`Facets for "${term}" — ${total} records`]

  for (const field of FACET_FIELDS) {
    const flat = fields[field] ?? []
    const pairs: Array<[string, number]> = []
    for (let i = 0; i < flat.length; i += 2) {
      const name = String(flat[i] ?? "")
      const count = Number(flat[i + 1] ?? 0)
      if (name !== "" && count > 0) pairs.push([name, count])
    }
    if (pairs.length === 0) continue
    blocks.push("", `${labels[field]}:`)
    for (const [name, count] of pairs) {
      blocks.push(`   ${String(count).padStart(8)}  ${name}`)
    }
  }

  if (blocks.length === 1) return `${blocks[0]}\n\nDataONE returned no facet counts for that query.`
  return blocks.join("\n")
}
