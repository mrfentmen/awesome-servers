/**
 * International Space Station tracking, keyless.
 * Position/velocity comes from wheretheiss.at; the crew list from open-notify.org.
 */

export class IssError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IssError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-iss-mcp/1.0"
const ISS_ID = 25544
const EARTH_RADIUS_KM = 6371.0088

export interface IssPosition {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  visibility: string
  footprint: number
  timestamp: number
}

async function fetchJson<T>(url: string, timeoutMs = 20000): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    throw new IssError(`Could not reach the tracking service: ${errorMessage(e)}`)
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new IssError(`Tracking service returned HTTP ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

interface WhereTheIss {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  visibility: string
  footprint: number
  timestamp: number
}

function toPosition(r: WhereTheIss): IssPosition {
  return {
    latitude: r.latitude,
    longitude: r.longitude,
    altitude: r.altitude,
    velocity: r.velocity,
    visibility: r.visibility,
    footprint: r.footprint,
    timestamp: r.timestamp,
  }
}

export async function position(): Promise<IssPosition> {
  const raw = await fetchJson<WhereTheIss>(`https://api.wheretheiss.at/v1/satellites/${ISS_ID}`)
  return toPosition(raw)
}

export async function positionsAt(timestamps: number[]): Promise<IssPosition[]> {
  const stamps = timestamps.slice(0, 10).map((t) => Math.round(t)).join(",")
  const raw = await fetchJson<WhereTheIss[]>(
    `https://api.wheretheiss.at/v1/satellites/${ISS_ID}/positions?timestamps=${stamps}`
  )
  return raw.map(toPosition)
}

export interface Crew {
  name: string
  craft: string
}

export async function crew(): Promise<Crew[]> {
  // open-notify serves plain HTTP only; HTTPS handshakes fail there.
  const raw = await fetchJson<{ people: Crew[]; number: number }>(
    "http://api.open-notify.org/astros.json"
  )
  if (!Array.isArray(raw.people)) throw new IssError("The crew list was unavailable.")
  return raw.people
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1))
  return (Math.atan2(y, x) * 180) / Math.PI
}

export function compass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(((deg + 360) % 360) / 45) % 8]
}

function requireCoord(lat: string | number, lon: string | number): { lat: number; lon: number } {
  const la = Number(lat)
  const lo = Number(lon)
  if (!Number.isFinite(la) || la < -90 || la > 90) {
    throw new IssError(`Latitude must be between -90 and 90, got "${lat}".`)
  }
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) {
    throw new IssError(`Longitude must be between -180 and 180, got "${lon}".`)
  }
  return { lat: la, lon: lo }
}

export function formatPosition(p: IssPosition): string {
  return [
    `ISS position at ${new Date(p.timestamp * 1000).toISOString()}`,
    `  latitude    ${p.latitude.toFixed(4)}`,
    `  longitude   ${p.longitude.toFixed(4)}`,
    `  altitude    ${p.altitude.toFixed(1)} km`,
    `  velocity    ${p.velocity.toFixed(0)} km/h`,
    `  visibility  ${p.visibility}`,
    `  footprint   ${p.footprint.toFixed(0)} km wide`,
  ].join("\n")
}

export async function distanceFrom(lat: string, lon: string): Promise<string> {
  const { lat: la, lon: lo } = requireCoord(lat, lon)
  const p = await position()
  const km = distanceKm(la, lo, p.latitude, p.longitude)
  const deg = bearing(la, lo, p.latitude, p.longitude)
  const overhead = km <= p.footprint / 2
  return [
    `Distance from ${la.toFixed(3)}, ${lo.toFixed(3)} to the ISS:`,
    "",
    `  ground distance  ${km.toFixed(0)} km`,
    `  direction        ${compass(deg)} (${((deg + 360) % 360).toFixed(0)} degrees)`,
    `  ISS is        ${overhead ? "overhead now - the station is above your horizon" : "not above the horizon at this point"}`,
    "",
    formatPosition(p),
  ].join("\n")
}

export async function groundSpeed(): Promise<string> {
  const first = await position()
  const [later] = await positionsAt([first.timestamp + 60])
  if (!later) throw new IssError("The tracker returned no follow-up position.")
  const travelled = distanceKm(first.latitude, first.longitude, later.latitude, later.longitude)
  const heading = bearing(first.latitude, first.longitude, later.latitude, later.longitude)
  const reported = (first.velocity + later.velocity) / 2
  return [
    "ISS ground track over 60 seconds:",
    "",
    `  moved            ${travelled.toFixed(1)} km`,
    `  average speed    ${(travelled * 60).toFixed(0)} km/h along the ground`,
    `  reported speed   ${reported.toFixed(0)} km/h in orbit (faster than the ground track)`,
    `  heading          ${compass(heading)} (${((heading + 360) % 360).toFixed(0)} degrees)`,
    "",
    `  from  ${first.latitude.toFixed(4)}, ${first.longitude.toFixed(4)}`,
    `  to    ${later.latitude.toFixed(4)}, ${later.longitude.toFixed(4)}`,
  ].join("\n")
}

export async function passes(lat: string, lon: string, minutes: number): Promise<string> {
  const { lat: la, lon: lo } = requireCoord(lat, lon)
  const horizon = 20
  const span = Math.min(Math.max(Math.round(minutes) || 90, 10), 120)
  const now = Math.floor(Date.now() / 1000)
  const step = 120
  const offsets: number[] = []
  for (let t = 0; t <= span * 60; t += step * 10) offsets.push(now + t)
  const samples: Array<{ at: number; km: number }> = []
  for (const batch of chunk(offsets, 10)) {
    const points = await positionsAt(batch)
    for (let i = 0; i < points.length; i += 1) {
      const at = batch[i]
      samples.push({ at, km: distanceKm(la, lo, points[i].latitude, points[i].longitude) })
    }
  }
  const windows: Array<{ start: number; end: number; min: number }> = []
  let current: { start: number; end: number; min: number } | null = null
  for (const s of samples) {
    if (s.km <= horizon) {
      if (!current) current = { start: s.at, end: s.at, min: s.km }
      else {
        current.end = s.at
        current.min = Math.min(current.min, s.km)
      }
    } else if (current) {
      windows.push(current)
      current = null
    }
  }
  if (current) windows.push(current)
  const head = `Overhead passes within ${horizon} km of ${la.toFixed(3)}, ${lo.toFixed(3)} over the next ${span} minutes:`
  if (windows.length === 0) {
    return `${head}\n\nNo pass found. Try a longer window (up to 120 minutes).`
  }
  const lines = windows.map(
    (w) =>
      `  ${new Date(w.start * 1000).toISOString().slice(11, 19)} UTC  closest approach ${w.min.toFixed(0)} km`
  )
  return `${head}\n\n${lines.join("\n")}\n\nSampled every 10 minutes; each line is one overhead window.`
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

export async function overheadNow(lat: string, lon: string, radiusKm: number): Promise<string> {
  const { lat: la, lon: lo } = requireCoord(lat, lon)
  const radius = Math.min(Math.max(radiusKm || 1000, 50), 5000)
  const p = await position()
  const km = distanceKm(la, lo, p.latitude, p.longitude)
  const overhead = km <= radius
  return [
    overhead
      ? `Yes - the ISS is ${km.toFixed(0)} km away, inside your ${radius} km window.`
      : `No - the ISS is ${km.toFixed(0)} km away, outside your ${radius} km window.`,
    "",
    `  ISS at   ${p.latitude.toFixed(3)}, ${p.longitude.toFixed(3)}`,
    `  ${overhead ? "Look up" : "Direction"}   ${compass(bearing(la, lo, p.latitude, p.longitude))}`,
    `  altitude ${p.altitude.toFixed(0)} km (${p.visibility})`,
  ].join("\n")
}

export async function orbitSummary(): Promise<string> {
  const p = await position()
  const radius = EARTH_RADIUS_KM + p.altitude
  const periodMin = (2 * Math.PI * radius) / (p.velocity / 60)
  const orbitsPerDay = (24 * 60) / periodMin
  return [
    "ISS orbit summary",
    "",
    `  altitude        ${p.altitude.toFixed(1)} km`,
    `  orbital speed   ${p.velocity.toFixed(0)} km/h`,
    `  orbital period  ${periodMin.toFixed(1)} minutes`,
    `  orbits per day  ${orbitsPerDay.toFixed(1)}`,
    `  visible width   ${p.footprint.toFixed(0)} km`,
    `  current grid    ${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)} (${p.visibility})`,
  ].join("\n")
}

export function formatCrew(people: Crew[]): string {
  if (people.length === 0) return "The crew list is empty right now."
  const crafts = new Map<string, string[]>()
  for (const p of people) {
    const list = crafts.get(p.craft) ?? []
    list.push(p.name)
    crafts.set(p.craft, list)
  }
  const sections = [...crafts.entries()].map(
    ([craft, names]) => `  ${craft} (${names.length})\n${names.map((n) => `    ${n}`).join("\n")}`
  )
  return `${people.length} people in space:\n\n${sections.join("\n\n")}`
}
