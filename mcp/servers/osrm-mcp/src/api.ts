const BASE = "https://router.project-osrm.org"
const UA = "mrfentmen-osrm-mcp/1.0 (https://github.com/mrfentmen)"
export class OsrmError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new OsrmError(`OSRM returned HTTP ${res.status}`)
  return (await res.json()) as T
}

function fmtDur(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
  return `${Math.floor(sec / 3600)}h ${Math.round((sec % 3600) / 60)}m`
}

function fmtDist(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(2)} km`
}

export async function route(args: { coordinates?: string; profile?: string }): Promise<string> {
  const coords = (args.coordinates ?? "").trim()
  if (!coords) throw new OsrmError("Provide coordinates as lon,lat;lon,lat pairs")
  if (coords.split(";").length < 2) throw new OsrmError("Provide at least two coordinate pairs")
  const profile = (args.profile ?? "driving").trim().toLowerCase()
  if (!["driving", "cycling", "walking"].includes(profile)) throw new OsrmError("profile must be driving, cycling, or walking")
  const d = await get<any>(`${BASE}/route/v1/${profile}/${encodeURIComponent(coords)}?overview=false&steps=true&annotations=false`)
  const r = d?.routes?.[0]
  if (!r) throw new OsrmError("No route found")
  const legs = (r?.legs ?? []) as any[]
  const steps = legs.flatMap((l: any) => (l?.steps ?? []).map((s: any) => s?.maneuver?.type ?? s?.name)).filter(Boolean)
  const lines = [
    `${profile} route: ${fmtDist(r?.distance ?? 0)}, ${fmtDur(r?.duration ?? 0)}`,
    `Via ${coords.split(";").length} points`,
  ]
  if (steps.length) {
    lines.push("", "Maneuvers:")
    steps.slice(0, 12).forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`))
  }
  return lines.join("\n")
}

export async function nearest(args: { longitude?: number; latitude?: number; profile?: string }): Promise<string> {
  const lon = Number(args.longitude)
  const lat = Number(args.latitude)
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) throw new OsrmError("Provide valid longitude and latitude")
  const profile = (args.profile ?? "driving").trim().toLowerCase()
  if (!["driving", "cycling", "walking"].includes(profile)) throw new OsrmError("profile must be driving, cycling, or walking")
  const d = await get<any>(`${BASE}/nearest/v1/${profile}/${lon},${lat}`)
  const wp = d?.waypoints?.[0]
  if (!wp) throw new OsrmError("No nearest point found")
  const loc = wp?.location ?? []
  return `Nearest ${profile} point:\n  ${wp?.name || "unnamed road"} at ${loc[1] != null ? loc[1].toFixed(5) : "?"}, ${loc[0] != null ? loc[0].toFixed(5) : "?"}\n  Distance from input: ${fmtDist(wp?.distance ?? 0)}`
}

// ---- muxB tools:
const PROFILES = ["driving", "cycling", "walking"] as const;

function profileOf(raw: string | undefined): string {
  const p = (raw ?? "driving").trim().toLowerCase()
  if (!(PROFILES as readonly string[]).includes(p)) throw new OsrmError("profile must be driving, cycling, or walking")
  return p
}

function coordList(coords: string): string[] {
  const list = coords.trim().split(";").map((c) => c.trim()).filter(Boolean)
  if (list.length < 2) throw new OsrmError("Provide at least two coordinate pairs as lon,lat;lon,lat")
  return list
}

