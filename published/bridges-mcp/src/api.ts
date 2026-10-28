/**
 * NY State DOT and NYC DOT — keyless public API client.
 */
const BASE = "https://data.ny.gov"
const SOURCE = "NY DOT"
const UA = "bridges-mcp"

export class SourceError extends Error {}

async function request(path: string, init?: RequestInit, timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
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

export async function getJson(path: string, init?: RequestInit): Promise<any> {
  const res = await request(path, init)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, init?: RequestInit): Promise<string> {
  const res = await request(path, init)
  return await res.text()
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

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

const NY = "https://data.ny.gov/resource/wpyb-cjy8.json"
const NYC = "https://data.cityofnewyork.us/resource/4yue-vjfc.json"

function nyLine(r: any, i: number): string {
  return `${i + 1}. BIN ${clean(r.bin)} · ${clean(r.feature_carried)} over ${clean(r.feature_crossed)} · ${clean(r.county)} · built ${clean(r.year_built_or_replaced)} · ${r.poor_status === "Y" ? "POOR" : "ok"}`
}

function nycLine(r: any, i: number): string {
  return `${i + 1}. BIN ${clean(r.bin)} · ${clean(r.feature_carried)} over ${clean(r.feature_crossed)} · ${clean(r.boro)} · rating ${clean(r.current_rating)} (${clean(r.verbal_rating)})`
}

export async function ny_bridges(a: { county?: string, poorOnly?: boolean, limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 50)
  const filters: string[] = []
  if (a.county) filters.push(`county='${clean(a.county)}'`)
  if (a.poorOnly) filters.push("poor_status='Y'")
  const where = filters.length ? `&$where=${encodeURIComponent(filters.join(" AND "))}` : ""
  const d = await getJson(`${NY}?$limit=${limit}${where}&$order=date_of_last_inspection DESC`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No bridges match those filters.`
  return section(`${rows.length} NY bridge(s)`, rows.map(nyLine))
}

export async function ny_bridge_by_bin(a: { bin: string }): Promise<string> {
  const bin = clean(a.bin)
  if (!/^[0-9A-Z]{6,8}$/.test(bin)) throw new SourceError("bin looks invalid")
  const d = await getJson(`${NY}?$limit=1&$where=${encodeURIComponent(`bin='${bin}'`)}`)
  const r = Array.isArray(d) ? d[0] : null
  if (!r) throw new SourceError(`No NY bridge with BIN ${bin}`)
  return section(`BIN ${clean(r.bin)}`, [
    bullet("Carries", r.feature_carried),
    bullet("Crosses", r.feature_crossed),
    bullet("Location", r.location),
    bullet("County", r.county),
    bullet("Owner", r.owner),
    bullet("Built", r.year_built_or_replaced),
    bullet("Last inspection", r.date_of_last_inspection),
    bullet("Poor status", r.poor_status === "Y" ? "yes" : "no"),
    bullet("Region", r.region),
  ])
}

export async function ny_bridge_summary(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 62)
  const select = encodeURIComponent("county,count(*) AS bridges,sum(case(poor_status='Y',1,true,0)) AS poor")
  const d = await getJson(`${NY}?$select=${select}&$group=county&$order=bridges DESC&$limit=${limit}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) throw new SourceError("No bridge summary returned")
  return section(`${rows.length} county/counties by bridge count`, rows.map((r, i) => `${i + 1}. ${clean(r.county)}: ${clean(r.bridges)} bridges, ${clean(r.poor)} poor`))
}

export async function nyc_bridges(a: { borough?: string, belowRating?: number, limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 50)
  const filters: string[] = []
  if (a.borough) filters.push(`boro='${clean(a.borough).toUpperCase()}'`)
  if (a.belowRating !== undefined) filters.push(`current_rating < ${a.belowRating}`)
  const where = filters.length ? `&$where=${encodeURIComponent(filters.join(" AND "))}` : ""
  const d = await getJson(`${NYC}?$limit=${limit}${where}&$order=current_rating`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No NYC bridges match those filters.`
  return section(`${rows.length} NYC bridge(s)`, rows.map(nycLine))
}

export async function nyc_bridge_by_bin(a: { bin: string }): Promise<string> {
  const bin = clean(a.bin)
  const d = await getJson(`${NYC}?$limit=1&$where=${encodeURIComponent(`bin='${bin}'`)}`)
  const r = Array.isArray(d) ? d[0] : null
  if (!r) throw new SourceError(`No NYC bridge with BIN ${bin}`)
  return section(`BIN ${clean(r.bin)} · ${clean(r.feature_carried)}`, [
    bullet("Crosses", r.feature_crossed),
    bullet("Borough", r.boro),
    bullet("Type", r.bridge_type),
    bullet("Spans", r.spans),
    bullet("Current rating", r.current_rating),
    bullet("Verbal rating", r.verbal_rating),
    bullet("General recommendation", r.general_recommendation),
    bullet("Last inspection", r.inspection_date),
    bullet("Deck area (sq ft)", r.deck_area_sq_ft),
    bullet("Replacement cost", r.replacement_cost),
    bullet("Coordinates", `${r.x_coord_lat}, ${r.y_coord_lon}`),
  ])
}
