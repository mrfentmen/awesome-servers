/**
 * DataCite — DOI metadata for datasets, software, preprints and other research
 * outputs. Keyless.
 *
 * Verified live: GET /dois?query=<q>&page[size]=<n> returns
 * `{data:[{attributes}], meta:{total}}`; GET /dois/<doi> returns one record.
 */
const API = "https://api.datacite.org/dois"

export class DataCiteError extends Error {}

interface Attributes {
  doi?: string
  titles?: Array<{ title?: string }>
  creators?: Array<{ name?: string }>
  publisher?: string | null
  publicationYear?: number
  types?: { resourceTypeGeneral?: string }
  url?: string
  citationCount?: number
  downloadCount?: number
  descriptions?: Array<{ description?: string; descriptionType?: string }>
}

interface OneBody {
  data?: { attributes?: Attributes }
}

interface ListBody {
  data?: Array<{ attributes?: Attributes }>
  meta?: { total?: number }
}

async function get<T>(url: string, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "datacite-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new DataCiteError("DataCite has no DOI with that name")
    if (!res.ok) throw new DataCiteError(`DataCite responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DataCiteError) throw e
    if ((e as Error).name === "AbortError") throw new DataCiteError("DataCite request timed out")
    throw new DataCiteError(`DataCite request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const title = (a: Attributes): string => a.titles?.[0]?.title?.trim() || "(untitled)"

const creators = (a: Attributes): string => {
  const names = (a.creators ?? []).map((c) => c.name).filter((n): n is string => typeof n === "string" && n !== "")
  if (names.length === 0) return "creators unknown"
  return names.length <= 3 ? names.join("; ") : `${names.slice(0, 3).join("; ")}; +${names.length - 3} more`
}

function meta(a: Attributes): string {
  return [creators(a), a.publisher ?? "no publisher", a.publicationYear ?? "no year", a.types?.resourceTypeGeneral ?? ""]
    .filter((p) => p !== "" && p !== null)
    .join(" · ")
}

export async function search(query: string, limit = 10): Promise<string> {
  const q = query.trim()
  if (q === "") throw new DataCiteError("query must not be empty")
  const size = clamp(limit, 1, 100)
  const params = new URLSearchParams({ query: q })
  params.set("page[size]", String(size))

  const body = await get<ListBody>(`${API}?${params.toString()}`)
  const rows = body.data ?? []
  const total = body.meta?.total ?? rows.length
  if (rows.length === 0) return `No DataCite DOIs match "${q}".`

  const lines = rows.flatMap((row, i) => {
    const a = row.attributes ?? {}
    return [`${i + 1}. ${title(a)}`, `   ${meta(a)}`, a.doi ? `   doi: ${a.doi}` : ""].filter((l) => l !== "")
  })

  return [`"${q}" — ${total} DOIs`, "", ...lines].join("\n")
}

export async function doi(input: string): Promise<string> {
  const value = input
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
  if (!/^10\.\d{4,9}\/\S+$/.test(value)) throw new DataCiteError(`"${input}" is not a DOI`)

  const body = await get<OneBody>(`${API}/${encodeURIComponent(value)}`)
  const a = body.data?.attributes
  if (!a) throw new DataCiteError(`DataCite has no record for ${value}`)

  const description = (a.descriptions ?? []).find((d) => d.descriptionType === "Abstract") ?? a.descriptions?.[0]

  return [
    title(a),
    "",
    `DOI: ${a.doi ?? value}`,
    `Creators: ${creators(a)}`,
    a.publisher ? `Publisher: ${a.publisher}` : "",
    a.publicationYear ? `Year: ${a.publicationYear}` : "",
    a.types?.resourceTypeGeneral ? `Type: ${a.types.resourceTypeGeneral}` : "",
    a.url ? `URL: ${a.url}` : "",
    a.citationCount !== undefined ? `Citations: ${a.citationCount}` : "",
    a.downloadCount !== undefined ? `Downloads: ${a.downloadCount}` : "",
    "",
    description?.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "(no description in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
