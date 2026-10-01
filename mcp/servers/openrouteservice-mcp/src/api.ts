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

