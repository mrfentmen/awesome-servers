export class OrsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OrsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OPENROUTESERVICE_API_KEY;
  if (!k) throw new OrsError("Set OPENROUTESERVICE_API_KEY (free openrouteservice key).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://api.openrouteservice.org${path}${sep}api_key=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OrsError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OrsError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function geocode(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return get(`/geocode/search?text=${encodeURIComponent(query)}&size=${n}`);
}

export function reverse(lat: string, lon: string): Promise<string> {
  return get(`/geocode/reverse?point.lat=${encodeURIComponent(lat)}&point.lon=${encodeURIComponent(lon)}&size=1`);
}

export async function directions(fromLon: string, fromLat: string, toLon: string, toLat: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
      body: JSON.stringify({ coordinates: [[Number(fromLon), Number(fromLat)], [Number(toLon), Number(toLat)]] }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OrsError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new OrsError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

// ---- muxG tools:
const ORS_NOMINATIM = "https://nominatim.openstreetmap.org"
const ORS_OSRM = "https://router.project-osrm.org"
const ORS_VALHALLA = "https://valhalla1.openstreetmap.de"
const ORS_UA = "awesome-mcps/1.0 (mcp routing)"
const ORS_LIST_CAP = 8

async function orsFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": ORS_UA, Accept: "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 429) throw new OrsError("OpenStreetMap Nominatim is rate limiting this IP. Its public instance allows at most one request a second, so wait a moment and try again.")
  if (res.status === 404) throw new OrsError("The routing backend has no answer for that point.")
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new OrsError(`Returned ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

function orsBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

interface OrsPlace {
  place_id?: number
  osm_type?: string
  osm_id?: number
  lat?: string
  lon?: string
  display_name?: string
  name?: string
  category?: string
  type?: string
  addresstype?: string
  importance?: number
  address?: Record<string, string>
  boundingbox?: string[]
}

function orsMetres(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(2)} km` : `${Math.round(n)} m`
}

function orsDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}

/** Geocode against OpenStreetMap itself, so you can see how the answer moves between geocoders. */
export async function nominatimLookup(args: { query?: string; lat?: number; lon?: number; limit?: number }): Promise<string> {
  const limit = orsBound(args?.limit, 1, ORS_LIST_CAP, 5)
  const hasCoords = args?.lat !== undefined && args.lon !== undefined
  const hasQuery = String(args?.query ?? "").trim().length > 0
  if (!hasCoords && !hasQuery) throw new OrsError("Give a query to look up, or a lat and lon to reverse geocode.")

  let url: string
  let direction: string
  if (hasCoords) {
    const lat = Number(args.lat)
    const lon = Number(args.lon)
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) throw new OrsError(`"${args.lat}" is not a latitude between -90 and 90.`)
    if (!Number.isFinite(lon) || Math.abs(lon) > 180) throw new OrsError(`"${args.lon}" is not a longitude between -180 and 180.`)
    const zoom = orsBound(args.limit, 1, 18, 18)
    url = `${ORS_NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=1&namedetails=1`
    direction = `Reverse geocode of ${lat}, ${lon} at zoom ${zoom}`
  } else {
    url = `${ORS_NOMINATIM}/search?format=jsonv2&addressdetails=1&namedetails=1&limit=${limit}&q=${encodeURIComponent(String(args.query).trim())}`
    direction = `Forward geocode of "${String(args.query).trim()}" in OpenStreetMap`
  }

  const raw = await orsFetch<OrsPlace | OrsPlace[]>(url)
  const rows = Array.isArray(raw) ? raw : [raw]
  if (!rows.length || !rows[0]?.display_name) {
    return [
      `${direction}`,
      "OpenStreetMap returned nothing.",
      "No match usually means the name is missing from OSM, is spelled differently, or is a building rather than an address. Try a coarser place name, or the postcode.",
    ].join("\n")
  }

  return [
    direction,
    `${rows.length} result(s) from Nominatim, OpenStreetMap's own geocoder`,
    "",
    ...rows.map((r, i) => {
      const addr = r.address ?? {}
      const named = Object.entries(addr).filter(([k]) => !["country_code", "country", "state", "county", "municipality", "city_district", "ISO3166-2-lvl4"].includes(k)).slice(0, 6)
      return [
        `${i + 1}. ${r.name ?? "(no name)"} — ${r.display_name}`,
        `   ${r.lat}, ${r.lon} | OSM ${r.osm_type ?? "?"}/${r.osm_id ?? "?"} | place id ${r.place_id ?? "not reported"}`,
        `   classified as ${r.category ?? "not reported"}/${r.type ?? "not reported"} (address type ${r.addresstype ?? "not reported"})`,
        r.importance !== undefined ? `   importance ${Number(r.importance).toFixed(4)}` : "",
        named.length ? `   address parts: ${named.map(([k, v]) => `${k}=${v}`).join(", ")}` : "   address parts: not reported",
        r.boundingbox ? `   bounding box: ${r.boundingbox.join(", ")}` : "",
      ].filter(Boolean).join("\n")
    }),
    "",
    "This is a different geocoder from the one this server's other tools use, and they will disagree: Nominatim ranks by OpenStreetMap importance, while a commercial geocoder ranks by its own address database. A pin that moves between them is usually a boundary or a duplicated feature, not a bug in either.",
  ].filter(Boolean).join("\n")
}

/** A road route from OSRM, with the turn-by-turn an OpenStreetMap router can give. */
export async function osrmRouteSteps(args: { from_lat?: number; from_lon?: number; to_lat?: number; to_lon?: number; alternatives?: boolean }): Promise<string> {
  const nums = [args.from_lat, args.from_lon, args.to_lat, args.to_lon].map((v) => Number(v))
  if (nums.some((n) => !Number.isFinite(n))) {
    throw new OrsError("All four of from_lat, from_lon, to_lat and to_lon are required, for example 48.8584, 2.2945 to 48.8606, 2.3376.")
  }
  const [fromLat, fromLon, toLat, toLon] = nums
  if (Math.abs(fromLat) > 90 || Math.abs(toLat) > 90) throw new OrsError("from_lat and to_lat must be between -90 and 90.")
  if (Math.abs(fromLon) > 180 || Math.abs(toLon) > 180) throw new OrsError("from_lon and to_lon must be between -180 and 180.")

  // This OSRM build rejects any geometries parameter, including "none"; overview=false
  // already suppresses the route geometry, and per-step geometry is not printed.
  const params = new URLSearchParams({ overview: "false", steps: "true" })
  if (args.alternatives !== false) params.set("alternatives", "3")
  const d = await orsFetch<{
    code?: string
    routes?: {
      distance: number
      duration: number
      weight_name?: string
      legs?: { steps?: { name?: string; distance: number; duration: number; mode?: string; maneuver?: { type?: string; modifier?: string; instruction?: string } }[] }[]
    }[]
    waypoints?: { name?: string; location?: [number, number]; distance?: number }[]
  }>(`${ORS_OSRM}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?${params}`)

  if (d.code !== "Ok" || !d.routes?.length) throw new OrsError(`OSRM could not route between those points (status ${d.code ?? "unknown"}). Check that both points are on the road network.`)

  const routes = d.routes
  return [
    `OSRM road route, ${routes.length} option(s) found (OpenStreetMap road data)`,
    `The demo OSRM instance is shared and not meant for production traffic, so treat the route as an indication rather than a navigation instruction.`,
    "",
    ...routes.map((r, ri) => {
      const steps = r.legs?.flatMap((l) => l.steps ?? []) ?? []
      const named = steps.filter((s) => s.name && s.distance > 20)
      return [
        `Option ${ri + 1}: ${orsMetres(r.distance)}, ${orsDuration(r.duration)} estimated${ri === 0 ? " (the one OSRM prefers)" : ""}`,
        `  via ${named.length} named road segment(s): ${[...new Set(named.map((s) => s.name))].slice(0, 8).join(", ") || "none recorded"}`,
        `  turn-by-turn:`,
        ...steps.slice(0, 10).map((s) => {
          const m = s.maneuver ?? {}
          const what = [m.modifier, m.type].filter(Boolean).join(" ")
          return `    ${String(Math.round(s.distance)).padStart(6)} m  ${s.name || "(unnamed road)"} — ${what}${m.instruction ? `: ${m.instruction}` : ""}`
        }),
        steps.length > 10 ? `    ... ${steps.length - 10} further step(s) not shown` : "",
      ].filter(Boolean).join("\n")
    }),
    "",
    "The duration is a free-flow estimate with no traffic, no turn penalties beyond the model's own, and no time-of-day variation, so it is optimistic compared to what a navigation app will show you.",
  ].join("\n")
}

/** The same trip by several modes, from Valhalla, which models them with different cost functions. */
export async function valhallaModeCompare(args: { from_lat?: number; from_lon?: number; to_lat?: number; to_lon?: number; modes?: string }): Promise<string> {
  const nums = [args.from_lat, args.from_lon, args.to_lat, args.to_lon].map((v) => Number(v))
  if (nums.some((n) => !Number.isFinite(n))) {
    throw new OrsError("All four of from_lat, from_lon, to_lat and to_lon are required.")
  }
  const [fromLat, fromLon, toLat, toLon] = nums
  const known = ["auto", "bicycle", "pedestrian", "multimodal", "truck", "taxi"]
  const wanted = String(args?.modes ?? "auto,bicycle,pedestrian")
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean)
    .filter((m) => known.includes(m))
    .slice(0, 4)
  if (!wanted.length) {
    throw new OrsError(`No usable mode in "${args.modes}". Valhalla costings here: ${known.join(", ")}.`)
  }

  const results: { mode: string; ok: boolean; note: string }[] = []
  for (const mode of wanted) {
    try {
      const d = await orsFetch<{
        trip?: {
          summary?: {
            time?: number
            length?: number
            has_toll?: boolean
            has_ferry?: boolean
            has_highway?: boolean
            has_time_restrictions?: boolean
            cost?: number
            energy_use?: { value?: number; unit?: string }
            transit?: unknown
          }
          legs?: { shape?: string; summary?: Record<string, string>; maneuvers?: { instruction?: string; street_names?: string[]; time?: number; cost?: number }[] }[]
        }
        error?: string
        error_code?: number
      }>(`${ORS_VALHALLA}/route?json=`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: [{ lat: fromLat, lon: fromLon }, { lat: toLat, lon: toLon }],
          costing: mode,
          directions_options: { units: "kilometers" },
          ...(mode === "multimodal" ? { costings: [{ costing: "pedestrian" }, { costing: "bicycle" }] } : {}),
        }),
      })
      if (d.error) {
        results.push({ mode, ok: false, note: `${d.error_code ?? "error"}: ${d.error}` })
        continue
      }
      const s = d.trip?.summary ?? {}
      const maneuvers = d.trip?.legs?.flatMap((l) => l.maneuvers ?? []) ?? []
      results.push({
        mode,
        ok: true,
        note: [
          orsMetres((s.length ?? 0) * 1000),
          orsDuration(s.time ?? 0),
          `cost ${s.cost ?? "not reported"}`,
          s.has_toll ? "tolls" : "no tolls",
          s.has_ferry ? "includes a ferry" : "",
          s.has_highway ? "uses a motorway" : "",
          s.has_time_restrictions ? "has a time restriction" : "",
          s.energy_use?.value !== undefined ? `energy ${s.energy_use.value} ${s.energy_use.unit ?? ""}` : "",
          `${maneuvers.length} maneuver(s)`,
        ].filter(Boolean).join(", "),
      })
      if (maneuvers.length) {
        results[results.length - 1].note += `\n      first turns: ${maneuvers.slice(0, 3).map((m) => `${m.instruction ?? "?"}${m.street_names?.length ? ` (${m.street_names[0]})` : ""}`).join(" | ")}`
      }
    } catch (e) {
      results.push({ mode, ok: false, note: errorMessage(e) })
    }
  }

  return [
    `Same trip by ${wanted.length} costing model(s), from Valhalla's public instance`,
    `${fromLat}, ${fromLon} to ${toLat}, ${toLon}`,
    "",
    ...results.map((r) => `  ${r.ok ? "ok  " : "fail"} ${r.mode.padEnd(11)} ${r.note}`),
    "",
    "The costing models disagree on purpose: a bicycle and a pedestrian route on the same two points are different journeys, and the fast car route is often the one you cannot walk. Compare them before assuming one mode is the right one.",
    "Valhalla's public instance is a shared demo, so a routing failure here is not evidence the trip is unroutable.",
  ].join("\n")
}
