/**
 * USGS client. Live earthquake data, keyless. Uses the GeoJSON summary
 * feeds and the FDSN event query endpoint.
 */
const FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary"
const QUERY = "https://earthquake.usgs.gov/fdsnws/event/1/query"

export class UsgsError extends Error {}

export interface Quake {
  id?: string
  mag?: number
  place?: string
  time?: string
  depthKm?: number
  lat?: number
  lon?: number
  url?: string
  type?: string
}

function mapFeature(f: any): Quake {
  const p = f.properties ?? {}
  const c = f.geometry?.coordinates ?? []
  return {
    id: f.id,
    mag: p.mag,
    place: p.place,
    time: p.time ? new Date(p.time).toISOString() : undefined,
    depthKm: c[2] != null ? Math.round(c[2] * 10) / 10 : undefined,
    lat: c[1] != null ? Math.round(c[1] * 100) / 100 : undefined,
    lon: c[0] != null ? Math.round(c[0] * 100) / 100 : undefined,
    url: p.url,
    type: p.type,
  }
}

export async function latestQuakes(magnitude = "2.5", timeframe = "day", limit = 15): Promise<Quake[]> {
  const res = await fetch(`${FEED}/${magnitude}_${timeframe}.geojson`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new UsgsError(`USGS feed error ${res.status}`)
  const d = await res.json()
  return (d.features ?? []).slice(0, limit).map(mapFeature)
}

export async function queryQuakes(
  minMagnitude = 4.5,
  limit = 10,
  starttime?: string,
): Promise<Quake[]> {
  const params = new URLSearchParams({
    format: "geojson",
    minmagnitude: String(minMagnitude),
    limit: String(Math.min(limit, 50)),
  })
  if (starttime) params.set("starttime", starttime)
  const res = await fetch(`${QUERY}?${params}`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new UsgsError(`USGS query error ${res.status}`)
  const d = await res.json()
  return (d.features ?? []).slice(0, limit).map(mapFeature)
}

export function formatQuake(q: Quake): string {
  const lines = [
    `M ${q.mag ?? "?"} ${q.place ?? "Unknown place"}`,
    q.time ? `Time: ${q.time}` : "",
    `Depth: ${q.depthKm ?? "?"} km, at ${q.lat ?? "?"}, ${q.lon ?? "?"}`,
    q.url ?? "",
  ].filter(Boolean)
  return lines.join("\n")
}
