/**
 * Open Brewery DB — keyless public API client.
 */
const BASE = "https://api.openbrewerydb.org/v1"
const SOURCE = "Open Brewery DB"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "brewery-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

const TYPES = ["micro", "nano", "regional", "brewpub", "large", "planning", "bar", "contract", "proprietor", "closed"]

function checkId(value: string): string {
  const v = clean(value).toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)) {
    throw new SourceError(`"${value}" is not a valid brewery id (a UUID)`)
  }
  return v
}

function typeCheck(value: unknown): string {
  const v = clean(value).toLowerCase()
  if (!TYPES.includes(v)) throw new SourceError(`brewery type must be one of: ${TYPES.join(", ")}`)
  return v
}

function where(r: any): string {
  return [clean(r?.city), clean(r?.state_province || r?.state), clean(r?.country)].filter(Boolean).join(", ")
}

function one(r: any): string {
  return [
    `${clean(r?.name)}${r?.brewery_type ? ` (${clean(r.brewery_type)})` : ""}`,
    `  ${where(r)}${r?.address_1 ? ` · ${clean(r.address_1)}` : ""}`,
    r?.website_url ? `  ${clean(r.website_url)}` : "",
  ].filter(Boolean).join("\n")
}

export async function searchBreweries(a: { query: string; limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 50)
  const rows = await getJson(
    `/breweries/search?query=${encodeURIComponent(query)}&per_page=${limit}`,
    "application/json",
    30000
  )
  if (!Array.isArray(rows) || !rows.length) throw new SourceError(`Open Brewery DB has no brewery matching "${query}"`)
  return [
    `${rows.length} brewery(s) matching "${query}":`,
    "",
    ...rows.map((r, i) => `${String(i + 1).padStart(3)}. ${one(r)}`),
  ].join("\n")
}

export async function listBreweries(a: { city?: string; state?: string; type?: string; limit?: number; page?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const page = Math.floor(a.page ?? 1)
  if (!Number.isInteger(page) || page < 1 || page > 100) throw new SourceError("page must be between 1 and 100")
  const params: string[] = []
  if (a.city) params.push(`by_city=${encodeURIComponent(clean(a.city))}`)
  if (a.state) params.push(`by_state=${encodeURIComponent(clean(a.state))}`)
  if (a.type) params.push(`by_type=${typeCheck(a.type)}`)
  params.push(`per_page=${limit}`, `page=${page}`)
  const rows = await getJson(`/breweries?${params.join("&")}`, "application/json", 30000)
  if (!Array.isArray(rows) || !rows.length) throw new SourceError("Open Brewery DB returned no breweries for that filter")
  const filters = [
    a.city ? `city "${clean(a.city)}"` : "",
    a.state ? `state "${clean(a.state)}"` : "",
    a.type ? `type ${typeCheck(a.type)}` : "",
  ].filter(Boolean)
  const filterText = filters.length ? filters.join(", ") : "no filter (whole catalogue)"
  return [
    `${rows.length} brewery(s) listed for ${filterText} (page ${page}):`,
    "",
    ...rows.map((r, i) => `${String(i + 1).padStart(3)}. ${one(r)}`),
  ].join("\n")
}

export async function breweryDetail(a: { id: string }): Promise<string> {
  const id = checkId(a.id)
  let r: any
  try {
    r = await getJson(`/breweries/${id}`, "application/json", 30000)
  } catch (e) {
    if (e instanceof SourceError && / 404$/.test(e.message)) throw new SourceError(`Open Brewery DB has no brewery with id ${id}`)
    throw e
  }
  if (!r || !r.id) throw new SourceError(`Open Brewery DB has no brewery with id ${id}`)
  return [
    `${clean(r.name)}`,
    "",
    ...[
      bullet("type", r.brewery_type),
      bullet("address", [clean(r.address_1), clean(r.address_2), clean(r.address_3)].filter(Boolean).join(", ")),
      bullet("city", r.city),
      bullet("state", r.state_province || r.state),
      bullet("postal code", r.postal_code),
      bullet("country", r.country),
      bullet("coordinates", r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : ""),
      bullet("phone", r.phone),
      bullet("website", r.website_url),
      bullet("id", r.id),
    ].filter(Boolean),
  ].join("\n")
}
