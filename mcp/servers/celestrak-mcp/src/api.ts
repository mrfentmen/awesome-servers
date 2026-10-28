/**
 * CelesTrak — keyless public API client.
 */
const BASE = "https://celestrak.org"
const SOURCE = "CelesTrak"
const UA = "celestrak-mcp"

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

export async function satellites_by_group(a: { group: string, limit?: number }): Promise<string> {
  const GROUPS = ["stations","active","weather","gps-ops","glo-ops","galileo","beidou","sbas","starlink","oneweb","iridium","science","geo","molniya","debris","last-30-days","visual"]
  const group = clean(a.group).toLowerCase()
  if (!GROUPS.includes(group)) throw new SourceError(`group must be one of: ${GROUPS.join(", ")}`)
  const limit = clampLimit(a.limit, 20, 100)
  const d = await getJson(`/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=json`)
  const list: any[] = Array.isArray(d) ? d : []
  if (!list.length) throw new SourceError(`CelesTrak returned no satellites for group ${group}`)
  return section(`${list.length} satellite(s) in ${group}`, list.slice(0, limit).map((s, i) => `${i + 1}. ${clean(s.OBJECT_NAME)} · NORAD ${clean(s.NORAD_CAT_ID)} · inc ${clean(s.INCLINATION)}° · period ${clean(s.MEAN_MOTION)} rev/day`))
}

export async function satellite_by_catnr(a: { catnr: number }): Promise<string> {
  if (!Number.isInteger(a.catnr) || a.catnr < 1) throw new SourceError("catnr must be a positive integer")
  const d = await getJson(`/NORAD/elements/gp.php?CATNR=${a.catnr}&FORMAT=json`)
  const s = Array.isArray(d) ? d[0] : undefined
  if (!s) throw new SourceError(`CelesTrak has no satellite ${a.catnr}`)
  return section(`${clean(s.OBJECT_NAME)} (NORAD ${clean(s.NORAD_CAT_ID)})`, [
    bullet("International id", s.OBJECT_ID),
    bullet("Epoch", s.EPOCH),
    bullet("Inclination", clean(s.INCLINATION) + "°"),
    bullet("Eccentricity", s.ECCENTRICITY),
    bullet("Mean motion", clean(s.MEAN_MOTION) + " rev/day"),
    bullet("Period", clean((24 / Number(s.MEAN_MOTION)).toFixed(2)) + " h"),
  ])
}

export async function satellite_by_name(a: { name: string }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const d = await getJson(`/NORAD/elements/gp.php?NAME=${encodeURIComponent(name)}&FORMAT=json`)
  const list: any[] = Array.isArray(d) ? d : []
  if (!list.length) return `CelesTrak has no satellite matching "${name}".`
  return section(`${list.length} satellite(s) match "${name}"`, list.slice(0, 15).map((s, i) => `${i + 1}. ${clean(s.OBJECT_NAME)} · NORAD ${clean(s.NORAD_CAT_ID)} · ${clean(s.EPOCH)}`))
}

export async function satcat_by_catnr(a: { catnr: number }): Promise<string> {
  if (!Number.isInteger(a.catnr) || a.catnr < 1) throw new SourceError("catnr must be a positive integer")
  const d = await getJson(`/satcat/records.php?CATNR=${a.catnr}&FORMAT=json`)
  const s = Array.isArray(d) ? d[0] : undefined
  if (!s) throw new SourceError(`CelesTrak catalogue has no entry ${a.catnr}`)
  return section(`${clean(s.OBJECT_NAME)} (${clean(s.OBJECT_ID)})`, [
    bullet("Owner", s.OWNER),
    bullet("Type", s.OBJECT_TYPE),
    bullet("Launched", `${clean(s.LAUNCH_DATE)} from ${clean(s.LAUNCH_SITE)}`),
    bullet("Decayed", s.DECAY_DATE || "still in orbit"),
    bullet("Orbit", `${clean(s.ORBIT_CENTER)} · ${clean(s.ORBIT_TYPE)} · period ${clean(s.PERIOD)} min`),
    bullet("Apogee / perigee", `${clean(s.APOGEE)} / ${clean(s.PERIGEE)} km`),
    bullet("Radar cross-section", clean(s.RCS) + " m²"),
  ])
}

export async function groups(a: Record<string, never>): Promise<string> {
  const GROUPS = ["stations","active","weather","gps-ops","glo-ops","galileo","beidou","sbas","starlink","oneweb","iridium","science","geo","molniya","debris","last-30-days","visual"]
  return section("CelesTrak groups", GROUPS.map((g, i) => `${i + 1}. ${g}`))
}
