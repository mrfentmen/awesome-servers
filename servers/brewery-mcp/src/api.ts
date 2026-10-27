const BASE = "https://api.openbrewerydb.org/v1"
const UA = "mrfentmen-brewery-mcp/1.0"

export class BreweryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BreweryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const clamp = (value: number | undefined, fallback: number, max = 50) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max)

const truncate = (value: string, max = 3800) =>
  value.length <= max ? value : `${value.slice(0, max)}\n… (truncated)`

interface Brewery {
  id?: string
  name?: string
  brewery_type?: string | null
  address_1?: string | null
  address_2?: string | null
  address_3?: string | null
  city?: string | null
  state_province?: string | null
  postal_code?: string | null
  country?: string | null
  phone?: string | null
  website_url?: string | null
  state?: string | null
  street?: string | null
}

async function request(path: string, params: Record<string, string>): Promise<string> {
  const query = new URLSearchParams(params).toString()
  const url = `${BASE}${path}${query ? `?${query}` : ""}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new BreweryError(`Network error: ${errorMessage(e)}`)
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new BreweryError(`Open Brewery DB returned ${res.status}: ${body}`)
  }
  return res.text()
}

async function getJson<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const text = await request(path, params)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new BreweryError("Open Brewery DB returned a non-JSON response")
  }
}

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""

/** address_1 and street hold the same value for many records, so drop repeats. */
const dedupe = (values: string[]): string[] => [...new Set(values.filter(Boolean))]

function format(b: Brewery, index: number): string {
  const street = dedupe([clean(b.address_1), clean(b.address_2), clean(b.street)]).join(", ")
  const place = dedupe([clean(b.city), clean(b.state_province ?? b.state), clean(b.postal_code), clean(b.country)]).join(", ")
  const contact = [clean(b.website_url), clean(b.phone)].filter(Boolean).join(" | ")
  const lines = [
    `${index + 1}. ${clean(b.name) || "Unnamed"} [${clean(b.brewery_type) || "unknown type"}]`,
  ]
  if (street) lines.push(`   ${street}`)
  if (place) lines.push(`   ${place}`)
  if (contact) lines.push(`   ${contact}`)
  lines.push(`   id ${clean(b.id)}`)
  return lines.join("\n")
}

const formatAll = (list: Brewery[], requested: number): string => {
  if (!list.length) return ""
  const shown = list.slice(0, requested)
  return truncate(
    `${list.length} brewer${list.length === 1 ? "y" : "ies"} returned (showing ${shown.length}):\n` +
      shown.map((b, i) => format(b, i)).join("\n")
  )
}

const SEARCH_FIELDS = ["name", "city", "state", "type", "country", "postal"] as const
const SORT_COLUMNS = ["name", "city", "state", "type"] as const

export function searchBreweries(query: string, by?: string, limit?: string): Promise<string> {
  const field = (by ?? "name").trim().toLowerCase()
  const allowed = SEARCH_FIELDS as readonly string[]
  const key = allowed.includes(field) ? `by_${field}` : "by_name"
  return getJson<Brewery[]>("/breweries", {
    [key]: query,
    per_page: String(clamp(Number(limit), 10, 50)),
  }).then((list) => formatAll(list, clamp(Number(limit), 10, 50)) || "No breweries matched.")
}

export function getBrewery(id: string): Promise<string> {
  return getJson<Brewery>(`/breweries/${encodeURIComponent(id)}`).then((b) =>
    b && b.id ? format(b, 0).replace(/^1\. /, "") : `No brewery with id ${id}.`
  )
}

export function randomBrewery(): Promise<string> {
  return getJson<Brewery[]>("/breweries/random", { size: "1" }).then(
    (list) => formatAll(list, 1) || "Open Brewery DB returned no random brewery."
  )
}

export function searchAllBreweries(query: string, limit?: number): Promise<string> {
  const count = clamp(limit, 10, 50)
  return getJson<Brewery[]>("/breweries/search", {
    query,
    per_page: String(count),
  }).then((list) => formatAll(list, count) || `No brewery matched "${query}".`)
}

export interface FindArgs {
  city?: string
  state?: string
  country?: string
  type?: string
  postal?: string
  sort?: string
  limit?: number
}

export function findBreweries(args: FindArgs): Promise<string> {
  const params: Record<string, string> = {}
  if (args.city) params.by_city = args.city
  if (args.state) params.by_state = args.state
  if (args.country) params.by_country = args.country
  if (args.type) params.by_type = args.type
  if (args.postal) params.by_postal = args.postal
  if (args.sort) {
    const [rawColumn, rawDirection] = args.sort.split(":")
    const column = (rawColumn ?? "").trim().toLowerCase()
    const direction = (rawDirection ?? "asc").trim().toLowerCase()
    const columns = SORT_COLUMNS as readonly string[]
    if (!columns.includes(column) || !["asc", "desc"].includes(direction)) {
      throw new BreweryError("sort must be one of name, city, state or type, with :asc or :desc")
    }
    params.sort = `${column}:${direction}`
  }

  const filters = Object.keys(params).filter((k) => k !== "sort")
  if (!filters.length) {
    throw new BreweryError(
      "Give at least one filter (city, state, country, type or postal). Use search_all_breweries for free-text search."
    )
  }

  const count = clamp(args.limit, 10, 50)
  params.per_page = String(count)
  return getJson<Brewery[]>("/breweries", params).then(
    (list) => formatAll(list, count) || "No breweries matched those filters."
  )
}

interface Meta {
  total?: number
  by_state?: Record<string, number>
  by_country?: Record<string, number>
  by_type?: Record<string, number>
}

const top = (counts: Record<string, number> | undefined, n: number): string =>
  Object.entries(counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, value]) => `${key} ${value.toLocaleString("en-US")}`)
    .join(", ")

export function breweryStats(): Promise<string> {
  return getJson<Meta>("/breweries/meta").then((meta) => {
    const total = meta.total ?? 0
    const blocks = [
      `Open Brewery DB holds ${total.toLocaleString("en-US")} breweries.`,
      `Top countries: ${top(meta.by_country, 10)}`,
      `Every type: ${top(meta.by_type, 20)}`,
      `Top states/regions: ${top(meta.by_state, 10)}`,
      "Use find_breweries to list breweries inside any of these places or types.",
    ]
    return truncate(blocks.join("\n"))
  })
}
// ---- batch-3 tools: autocomplete, random batch, id lookup (2026-09-27) ----
export function autocompleteBreweries(query: string, limit?: number): Promise<string> {
  const q = (query ?? "").trim()
  if (!q) throw new BreweryError("Provide a partial name to autocomplete, e.g. dog.")
  const count = clamp(limit, 10, 50)
  return getJson<Brewery[]>("/breweries/autocomplete", { query: q }).then(
    (list) => formatAll(list, count) || `Nothing matched "${q}".`
  )
}

export function randomBreweries(count?: number): Promise<string> {
  const n = clamp(count, 3, 10)
  return getJson<Brewery[]>("/breweries/random", { size: String(n) }).then(
    (list) => formatAll(list, n) || "Open Brewery DB returned no random breweries."
  )
}

export function breweriesByIds(ids: string, limit?: number): Promise<string> {
  const list = (ids ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
  if (!list.length) throw new BreweryError("Provide one or more brewery ids, comma separated (max 10).")
  const count = clamp(limit, list.length, 50)
  return getJson<Brewery[]>("/breweries", { by_ids: list.join(","), per_page: String(count) }).then(
    (found) => formatAll(found, count) || "No breweries matched those ids."
  )
}
