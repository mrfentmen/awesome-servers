/**
 * GBFS bike-share feeds — keyless public API client.
 */
const BASE = "https://gbfs.citibikenyc.com"
const SOURCE = "GBFS"
const UA = "gbfs-mcp"

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

const SYSTEMS: Record<string, string> = {
  nyc: "https://gbfs.citibikenyc.com/gbfs/en",
  chicago: "https://gbfs.divvybikes.com/gbfs/en",
  sf: "https://gbfs.baywheels.com/gbfs/en",
  boston: "https://gbfs.bluebikes.com/gbfs/en",
  montreal: "https://gbfs.velobixi.com/gbfs/en",
}

function feed(city: string, name: string): string {
  const key = clean(city).toLowerCase()
  const base = SYSTEMS[key]
  if (!base) throw new SourceError(`Unknown city "${city}". Known: ${Object.keys(SYSTEMS).join(", ")}`)
  return `${base}/${name}.json`
}

function stations(d: any): any[] {
  const list = d?.data?.stations
  return Array.isArray(list) ? list : []
}

export async function systems(a: Record<string, never>): Promise<string> {
  return section("Supported bike-share systems", Object.keys(SYSTEMS).map((k, i) => `${i + 1}. ${k} · ${SYSTEMS[k]}`))
}

export async function station_status(a: { city?: string, search?: string, limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(feed(a.city ?? "nyc", "station_status"))
  const list = stations(d)
  if (!list.length) throw new SourceError(`No station status for ${a.city}`)
  const q = a.search ? clean(a.search).toLowerCase() : ""
  const info = q ? stations(await getJson(feed(a.city ?? "nyc", "station_information"))) : []
  const names = new Map<string, string>(info.map((s: any) => [clean(s.station_id), clean(s.name)]))
  const rows = list
    .map((s: any) => ({ id: clean(s.station_id), bikes: Number(s.num_bikes_available ?? 0), ebikes: Number(s.num_ebikes_available ?? 0), docks: Number(s.num_docks_available ?? 0), name: names.get(clean(s.station_id)) ?? (clean(s.name) || clean(s.station_id)) }))
    .filter((s) => !q || s.name.toLowerCase().includes(q))
  if (!rows.length) return `No stations matching "${a.search}" in ${a.city}.`
  return section(`${rows.length} station(s) in ${a.city}`, rows.slice(0, limit).map((s, i) => `${i + 1}. ${s.name} · ${s.bikes} bikes (${s.ebikes} e-bikes) · ${s.docks} docks free`))
}

export async function station_info(a: { city?: string, search?: string, limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(feed(a.city ?? "nyc", "station_information"))
  const list = stations(d)
  if (!list.length) throw new SourceError(`No station information for ${a.city}`)
  const q = a.search ? clean(a.search).toLowerCase() : ""
  const rows = list.filter((s: any) => !q || clean(s.name).toLowerCase().includes(q))
  if (!rows.length) return `No stations matching "${a.search}" in ${a.city}.`
  return section(`${rows.length} station(s) in ${a.city}`, rows.slice(0, limit).map((s, i) => `${i + 1}. ${clean(s.name)} · ${clean(s.station_id)} · ${s.lat}, ${s.lon} · capacity ${s.capacity ?? "?"}`))
}

export async function free_bikes(a: { city?: string, limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(feed(a.city ?? "nyc", "free_bike_status"))
  const list: any[] = Array.isArray(d?.data?.bikes) ? d.data.bikes : []
  if (!list.length) return `No free-floating bikes reported for ${a.city}.`
  return section(`${list.length} free bike(s) in ${a.city}`, list.slice(0, limit).map((b, i) => `${i + 1}. ${clean(b.bike_id)} · ${b.lat ?? "?"}, ${b.lon ?? "?"}${b.is_reserved ? " · reserved" : ""}${b.is_disabled ? " · disabled" : ""}`))
}

export async function system_info(a: { city?: string }): Promise<string> {
  const d = await getJson(feed(a.city ?? "nyc", "system_information"))
  const s = d?.data ?? {}
  if (!s.system_id) throw new SourceError(`No system information for ${a.city}`)
  const status = await getJson(feed(a.city ?? "nyc", "station_status"))
  const count = stations(status).length
  return section(`${clean(s.name)} (${clean(a.city)})`, [
    bullet("System id", s.system_id),
    bullet("Operator", s.operator),
    bullet("Timezone", s.timezone),
    bullet("Launched", s.start_date),
    bullet("Website", s.url),
    bullet("Stations reporting", count),
    bullet("Feed updated", d?.last_updated ? new Date(Number(d.last_updated) * 1000).toISOString() : ""),
  ])
}
