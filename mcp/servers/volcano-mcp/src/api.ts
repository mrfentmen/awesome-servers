/**
 * Smithsonian Volcanoes — keyless public API client.
 */
const BASE = "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows"
const SOURCE = "Smithsonian Volcanoes"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "volcano-mcp", accept },
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

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
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

const WFS = "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes&outputFormat=application/json&maxFeatures=1400"

type Volcano = Record<string, unknown>
let cache: { at: number; rows: Volcano[] } | undefined

async function volcanoes(): Promise<Volcano[]> {
  if (cache && Date.now() - cache.at < 3600_000) return cache.rows
  const d = await getJson(WFS)
  const rows: Volcano[] = Array.isArray(d?.features)
    ? d.features.map((f: any) => f?.properties ?? {}).filter((p: any) => p && p.Volcano_Name)
    : []
  if (!rows.length) throw new SourceError("the Global Volcanism Program returned no volcano features")
  cache = { at: Date.now(), rows }
  return rows
}

function text(v: unknown): string {
  return clean(v)
}

function match(row: Volcano, needle: string): boolean {
  const haystack = [row.Volcano_Name, row.Country, row.Region, row.Subregion, row.Primary_Volcano_Type, row.Tectonic_Setting]
    .map((x) => text(x).toLowerCase())
    .join(" | ")
  return haystack.includes(needle)
}

function summaryLine(row: Volcano): string {
  const year = row.Last_Eruption_Year
  const when = typeof year === "number" && year !== 0 ? (year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`) : "unknown"
  return `- ${text(row.Volcano_Name)} (${text(row.Country) || "country unknown"}) · last eruption ${when} · ${text(row.Primary_Volcano_Type) || "type unknown"}`
}

export async function searchVolcanoes(a: { query: string; limit?: number }): Promise<string> {
  const q = clean(a.query).toLowerCase()
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const rows = await volcanoes()
  const hits = rows.filter((r) => match(r, q))
  if (!hits.length) return `The Global Volcanism Program lists no Holocene volcano matching "${clean(a.query)}" among its ${rows.length} entries.`
  return [
    `${hits.length} of ${rows.length} Holocene volcanoes match "${clean(a.query)}", showing ${Math.min(limit, hits.length)}:`,
    "",
    ...hits.slice(0, limit).map(summaryLine),
  ].join("\n")
}

export async function volcanoDetail(a: { name: string }): Promise<string> {
  const q = clean(a.name).toLowerCase()
  if (q.length < 3) throw new SourceError("name must be at least 3 characters")
  const rows = await volcanoes()
  const exact = rows.find((r) => text(r.Volcano_Name).toLowerCase() === q)
  const partial = exact ?? rows.find((r) => text(r.Volcano_Name).toLowerCase().includes(q))
  if (!partial) {
    const near = rows.filter((r) => text(r.Volcano_Name).toLowerCase().startsWith(q.slice(0, 3))).slice(0, 5)
    return near.length
      ? `No volcano exactly matches "${clean(a.name)}". Closest names: ${near.map((r) => text(r.Volcano_Name)).join(", ")}`
      : `The Global Volcanism Program lists no Holocene volcano called "${clean(a.name)}".`
  }
  const year = partial.Last_Eruption_Year
  const when = typeof year === "number" && year !== 0 ? (year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`) : "no eruption recorded in the Holocene list"
  const lat = Number(partial.Latitude)
  const lon = Number(partial.Longitude)
  return [
    `${text(partial.Volcano_Name)} (GVP number ${text(partial.Volcano_Number)})`,
    `Location: ${[text(partial.Country), text(partial.Subregion), text(partial.Region)].filter(Boolean).join(" > ") || "not stated"}`,
    Number.isFinite(lat) && Number.isFinite(lon) ? `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)} · elevation ${text(partial.Elevation) || "?"} m` : "",
    `Type: ${text(partial.Primary_Volcano_Type) || "unknown"}${text(partial.Volcanic_Landform) ? ` · landform ${text(partial.Volcanic_Landform)}` : ""}`,
    `Setting: ${text(partial.Tectonic_Setting) || "unknown"} · last eruption ${when}`,
    text(partial.Major_Rock_Type) ? `Major rock type: ${text(partial.Major_Rock_Type)}` : "",
    text(partial.Geological_Summary) ? `Summary: ${text(partial.Geological_Summary).slice(0, 1400)}` : "",
    text(partial.Primary_Photo_Link) ? `Photo: ${text(partial.Primary_Photo_Link)}` : "",
    `GVP: https://volcano.si.edu/volcano.cfm?vn=${text(partial.Volcano_Number)}`,
  ].filter(Boolean).join("\n")
}
