const BASE = 'https://flood-api.open-meteo.com/v1/flood';
const UA = 'mrfentmen-flood-mcp/1.0';

export interface ForecastArgs {
  lat: number;
  lng: number;
  limit?: number;
}

export async function forecast(args: ForecastArgs): Promise<string> {
  const lat = Number(args.lat);
  const lng = Number(args.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Provide valid coordinates.';
  const limit = Math.min(Math.max(Number(args.limit ?? 7) || 7, 1), 30);
  const res = await fetch(`${BASE}?latitude=${lat}&longitude=${lng}&daily=river_discharge`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Open-Meteo Flood returned ${res.status}`);
  const d = (await res.json()) as { latitude?: number; longitude?: number; daily?: { time?: string[]; river_discharge?: (number | null)[] } };
  const daily = d.daily ?? {};
  const times = daily.time ?? [];
  const discharge = daily.river_discharge ?? [];
  if (!times.length) return `No flood data at (${lat}, ${lng}).`;
  return `Open-Meteo flood forecast at (${d.latitude ?? lat}, ${d.longitude ?? lng}) next ${Math.min(limit, times.length)} days:\n` +
    times.slice(0, limit).map((t, i) => `${i + 1}. ${t}: ${discharge[i] != null ? `${discharge[i]} m3/s` : 'n/a'}`).join('\n');
}

// ---- muxF tools:
const FLOOD_URL = 'https://flood-api.open-meteo.com/v1/flood';

interface FloodDaily {
  time?: string[];
  river_discharge?: Array<number | null>;
}

interface FloodPayload {
  latitude?: number;
  longitude?: number;
  elevation?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  utc_offset_seconds?: number;
  daily?: FloodDaily;
}

const EARTH_KM = 6371.0088

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLon = (bLon - aLon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function pair(args: { lat?: number; lng?: number }): { lat: number; lng: number } {
  const lat = Number(args.lat)
  const lng = Number(args.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Provide valid latitude and longitude.')
  if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90.')
  if (lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180.')
  return { lat, lng }
}

async function flood(lat: number, lng: number): Promise<{ payload: FloodPayload; rows: Array<{ date: string; discharge: number }> }> {
  const res = await fetch(`${FLOOD_URL}?latitude=${lat}&longitude=${lng}&daily=river_discharge`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Open-Meteo Flood returned ${res.status}`)
  const payload = (await res.json()) as FloodPayload
  const daily = payload.daily ?? {}
  const times = daily.time ?? []
  const values = daily.river_discharge ?? []
  const rows: Array<{ date: string; discharge: number }> = []
  for (let i = 0; i < times.length; i += 1) {
    const value = values[i]
    if (value == null || !Number.isFinite(Number(value))) continue
    rows.push({ date: String(times[i]), discharge: Number(value) })
  }
  if (!rows.length) throw new Error(`Open-Meteo Flood has no river discharge series at (${lat}, ${lng}).`)
  return { payload, rows }
}

/** Which grid cell the forecast was actually snapped to, and how far that is from the point asked for. */
export async function floodGrid(args: { lat?: number; lng?: number }): Promise<string> {
  const { lat, lng } = pair(args)
  const { payload } = await flood(lat, lng)
  const gLat = Number(payload.latitude)
  const gLng = Number(payload.longitude)
  if (!Number.isFinite(gLat) || !Number.isFinite(gLng)) {
    return `Open-Meteo Flood did not report a snapped grid cell for (${lat}, ${lng}).`
  }
  const distance = km(lat, lng, gLat, gLng)
  return [
    `Flood forecast grid cell for a request at (${lat}, ${lng})`,
    `Snapped to: ${gLat}, ${gLng}`,
    `Offset from the requested point: ${distance.toFixed(2)} km`,
    `Cell elevation: ${payload.elevation === undefined ? 'not reported' : `${payload.elevation} m`}`,
    `Time zone the series is expressed in: ${payload.timezone ?? 'not reported'} (${payload.timezone_abbreviation ?? 'abbreviation not reported'}, offset ${payload.utc_offset_seconds ?? 'not reported'} seconds)`,
    "The model runs on a grid, so a discharge value is the cell's value, not a measurement at your exact coordinates.",
  ].join('\n')
}
