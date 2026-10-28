/**
 * OurAirports — keyless public API client.
 */
const BASE = "https://davidmegginson.github.io/ourairports-data"
const SOURCE = "OurAirports"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "ourairports-mcp", accept },
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

type Airport = Record<string, string>

let cache: Promise<{ airports: Airport[]; countries: Map<string, string> }> | null = null

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"') { quoted = true; continue }
    if (ch === ",") { row.push(field); field = ""; continue }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue }
    if (ch === "\r") continue
    field += ch
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

function load(): Promise<{ airports: Airport[]; countries: Map<string, string> }> {
  if (!cache) {
    cache = (async () => {
      const [aRes, cRes] = await Promise.all([
        request("/airports.csv", "text/csv", 60000),
        request("/countries.csv", "text/csv", 30000),
      ])
      const toObjects = (text: string): Airport[] => {
        const rows = parseCsv(text)
        const head = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim())
        return rows.slice(1).filter((r) => r.length === head.length).map((r) => {
          const o: Airport = {}
          head.forEach((h, i) => { o[h] = r[i] })
          return o
        })
      }
      const airports = toObjects(await aRes.text())
      const countries = new Map(toObjects(await cRes.text()).map((c) => [c.code, c.name]))
      return { airports, countries }
    })()
  }
  return cache
}

function codeOf(a: Airport): string {
  return [a.iata_code, a.icao_code, a.ident].filter(Boolean).join(" / ")
}

function describe(a: Airport, countries: Map<string, string>): string {
  return [
    `${a.name} (${codeOf(a)})`,
    `  ${a.municipality || "unknown city"}, ${countries.get(a.iso_country) ?? a.iso_country} · ${a.type.replace(/_/g, " ")}`,
    `  ${a.latitude_deg}, ${a.longitude_deg}${a.elevation_ft ? ` · ${a.elevation_ft} ft` : ""}`,
  ].join("\n")
}

export async function lookupAirport(a: { code: string }): Promise<string> {
  const code = a.code.trim().toUpperCase()
  const { airports, countries } = await load()
  const hits = airports.filter((x) => [x.iata_code, x.icao_code, x.ident, x.gps_code].some((v) => v?.toUpperCase() === code))
  if (!hits.length) return `No airport has code ${code}.`
  return [`${hits.length} airport${hits.length === 1 ? "" : "s"} with code ${code}:`, ...hits.slice(0, 5).map((x) => describe(x, countries))].join("\n")
}

export async function searchAirports(a: { query: string; limit: number; country?: string }): Promise<string> {
  const q = a.query.trim().toLowerCase()
  if (q.length < 2) throw new SourceError("search text must be at least 2 characters")
  const { airports, countries } = await load()
  const want = a.country?.toUpperCase()
  const hits = airports.filter((x) => {
    if (want && x.iso_country !== want) return false
    if (x.type === "closed") return false
    return [x.name, x.municipality, x.iata_code, x.icao_code, x.ident].some((v) => v?.toLowerCase().includes(q))
  }).sort((x, y) => {
    const rank = (v: Airport): number => (v.iata_code ? 0 : v.icao_code ? 1 : 2)
    return rank(x) - rank(y) || Number(y.scheduled_service === "yes") - Number(x.scheduled_service === "yes")
  })
  if (!hits.length) return `No airports match "${a.query}"${want ? ` in ${want}` : ""}.`
  return [`${hits.length.toLocaleString("en-US")} airports match "${a.query}" (showing ${Math.min(a.limit, hits.length)}):`, ...hits.slice(0, a.limit).map((x) => describe(x, countries))].join("\n")
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function airportsNear(a: { latitude: number; longitude: number; radiusKm: number; limit: number }): Promise<string> {
  const { airports, countries } = await load()
  const near = airports
    .map((x) => ({ x, d: distanceKm(a.latitude, a.longitude, Number(x.latitude_deg), Number(x.longitude_deg)) }))
    .filter((r) => Number.isFinite(r.d) && r.d <= a.radiusKm && r.x.type !== "closed")
    .sort((p, q) => p.d - q.d)
  if (!near.length) return `No airports within ${a.radiusKm} km.`
  return [`${near.length} airports within ${a.radiusKm} km (showing ${Math.min(a.limit, near.length)}):`, ...near.slice(0, a.limit).map((r) => `${r.d.toFixed(1)} km - ${describe(r.x, countries)}`)].join("\n")
}

async function csvObjects(path: string): Promise<Airport[]> {
  const res = await request(path, "text/csv", 90000)
  const rows = parseCsv(await res.text())
  if (!rows.length) return []
  const head = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim())
  return rows.slice(1).filter((r) => r.length === head.length).map((r) => {
    const o: Airport = {}
    head.forEach((h, i) => { o[h] = r[i] })
    return o
  })
}

async function findAirport(code: string): Promise<{ airport: Airport; countries: Map<string, string> }> {
  const wanted = code.trim().toUpperCase()
  if (wanted.length < 3) throw new Error("airport code must be at least 3 characters")
  const { airports, countries } = await load()
  const airport = airports.find((a) => [a.ident, a.iata_code, a.icao_code].some((c) => c && c.toUpperCase() === wanted))
  if (!airport) throw new Error(`No airport with code ${wanted}`)
  return { airport, countries }
}

export async function airportRunways(a: { code: string; limit: number }): Promise<string> {
  const { airport } = await findAirport(a.code)
  const rows = (await csvObjects("/runways.csv")).filter((r) => r.airport_ident === airport.ident).slice(0, a.limit)
  if (!rows.length) return `OurAirports lists no runways for ${airport.ident}.`
  return section(`${airport.name} · ${rows.length} runway(s)`, rows.map((r, i) =>
    `${i + 1}. ${r.le_ident} / ${r.he_ident} · ${r.length_ft} ft x ${r.width_ft} ft · ${r.surface} · lit ${r.lighted === "1" ? "yes" : "no"}`))
}

export async function airportFrequencies(a: { code: string; limit: number }): Promise<string> {
  const { airport } = await findAirport(a.code)
  const rows = (await csvObjects("/airport-frequencies.csv")).filter((r) => r.airport_ident === airport.ident).slice(0, a.limit)
  if (!rows.length) return `OurAirports lists no radio frequencies for ${airport.ident}.`
  return section(`${airport.name} · ${rows.length} frequency record(s)`, rows.map((r, i) =>
    `${i + 1}. ${r.description || r.type} · ${r.frequency_mhz} MHz${r.type ? ` · ${r.type}` : ""}`))
}

export async function airportStats(a: { country?: string }): Promise<string> {
  const { airports, countries } = await load()
  const wanted = a.country ? a.country.trim().toUpperCase() : ""
  const rows = wanted ? airports.filter((x) => x.iso_country === wanted) : airports
  if (!rows.length) return `OurAirports has no airports for ${wanted}.`
  const counts = new Map<string, number>()
  for (const x of rows) counts.set(x.type || "unknown", (counts.get(x.type || "unknown") ?? 0) + 1)
  const label = wanted ? countries.get(wanted) ?? wanted : "the world"
  return section(`${rows.length} airport(s) in ${label}`, [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`))
}
