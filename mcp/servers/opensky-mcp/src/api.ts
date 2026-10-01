
export interface m0_AreaArgs {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
  limit?: number;
}

const m0 = (() => {
const BASE = 'https://opensky-network.org/api/states/all';

async function area(args: m0_AreaArgs): Promise<string> {
  const minLat = Number(args.minLat);
  const minLon = Number(args.minLon);
  const maxLat = Number(args.maxLat);
  const maxLon = Number(args.maxLon);
  if ([minLat, minLon, maxLat, maxLon].some((n) => !Number.isFinite(n))) return 'Provide a valid bounding box.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const params = new URLSearchParams({
    lamin: String(Math.min(minLat, maxLat)),
    lomin: String(Math.min(minLon, maxLon)),
    lamax: String(Math.max(minLat, maxLat)),
    lomax: String(Math.max(minLon, maxLon)),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-opensky-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OpenSky returned ${res.status}`);
  const d = (await res.json()) as { states?: Array<Array<unknown>> };
  const states = d.states ?? [];
  if (!states.length) return 'No flights in that area.';
  const rows = states.slice(0, limit).map((st) => {
    const callsign = String(st[1] ?? '').trim() || 'unknown';
    const alt = Number(st[7] ?? 0);
    const vel = Number(st[9] ?? 0);
    const country = String(st[2] ?? '');
    return `${callsign} | ${country} | ${alt ? (alt * 0.3048).toFixed(0) + ' m' : 'ground'} | ${vel ? Math.round(vel * 1.852) + ' km/h' : ''}`;
  });
  return `Flights in area (${rows.length} shown of ${states.length}):\n` + rows.join('\n');
}

return { area };
})();

const m1 = (() => {
const BASE = "https://opensky-network.org/api"
const UA = "mrfentmen-flights-mcp/1.0 (https://github.com/mrfentmen)"
class FlightsError extends Error {}

function fmtState(s: any): string {
  const [icao, callsign, origin, , , lon, lat, alt, onGround, vel, heading] = s
  return `${callsign?.trim() || icao} | ${origin ?? "?"} | ${lat?.toFixed(2) ?? "?"}, ${lon?.toFixed(2) ?? "?"} | alt ${Math.round(alt ?? 0)} m | ${onGround ? "on ground" : `airborne ${Math.round(vel ?? 0)} m/s`}${heading ? ` | heading ${Math.round(heading)}` : ""}`
}

async function flightsNear(args: { lat?: number; lon?: number; radius_km?: number }): Promise<string> {
  const lat = args.lat ?? 0
  const lon = args.lon ?? 0
  if (!lat && !lon) throw new FlightsError("Provide lat and lon")
  const km = args.radius_km ?? 100
  const dLat = km / 111
  const dLon = km / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))
  const res = await fetch(
    `${BASE}/states/all?lamin=${lat - dLat}&lomin=${lon - dLon}&lamax=${lat + dLat}&lomax=${lon + dLon}`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) }
  )
  if (res.status === 429) throw new FlightsError("OpenSky rate limit hit, wait a few seconds")
  if (!res.ok) throw new FlightsError(`OpenSky error ${res.status}`)
  const d = await res.json()
  const states = (d.states ?? []).slice(0, 30)
  return `${states.length} aircraft near ${lat}, ${lon}\n${states.map(fmtState).join("\n") || "None found"}`
}

async function flightsInBox(args: {
  min_lat?: number; min_lon?: number; max_lat?: number; max_lon?: number; limit?: number
}): Promise<string> {
  const res = await fetch(
    `${BASE}/states/all?lamin=${args.min_lat ?? 0}&lomin=${args.min_lon ?? 0}&lamax=${args.max_lat ?? 0}&lomax=${args.max_lon ?? 0}`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) }
  )
  if (res.status === 429) throw new FlightsError("OpenSky rate limit hit, wait a few seconds")
  if (!res.ok) throw new FlightsError(`OpenSky error ${res.status}`)
  const d = await res.json()
  const limit = Math.min(args.limit ?? 25, 50)
  const states = (d.states ?? []).slice(0, limit)
  return `${states.length} aircraft in the box\n${states.map(fmtState).join("\n") || "None found"}`
}

return { FlightsError, flightsInBox, flightsNear };
})();

export const FlightsError = m1.FlightsError;
export const area = m0.area;
export const flightsInBox = m1.flightsInBox;
export const flightsNear = m1.flightsNear;
export const m0_area = m0.area;
export const m1_flightsInBox = m1.flightsInBox;
export const m1_FlightsError = m1.FlightsError;
export const m1_flightsNear = m1.flightsNear;

// ---- muxQ tools:
// The three tools this server shipped with all use a bounding box on
// /api/states/all. For an anonymous caller OpenSky answers that with
// states: null - the box filter is not available without an API key. The
// unfiltered global snapshot is served anyway, several thousand aircraft at a
// time, and it carries every field a state vector has. These tools work off
// that snapshot, so they work with no credentials.
const OSKY_ALL = 'https://opensky-network.org/api/states/all';
const OSKY_UA = 'mrfentmen-opensky-mcp/1.1';

type Vector = (string | number | boolean | null)[];

interface Snapshot {
  time?: number;
  states?: Vector[];
}

async function snapshot(): Promise<Snapshot> {
  const res = await fetch(OSKY_ALL, {
    headers: { 'User-Agent': OSKY_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`OpenSky returned ${res.status}`);
  const data = (await res.json()) as Snapshot;
  if (!data || typeof data !== 'object') throw new Error('OpenSky returned an unexpected body.');
  if (!Array.isArray(data.states) || !data.states.length) {
    throw new Error('OpenSky returned an empty state vector snapshot.');
  }
  return data;
}

export interface CallsignArgs {
  prefix: string;
  limit?: number;
}

export interface CountryArgs {
  country: string;
  limit?: number;
}

/** What the whole sky looks like right now, in one pass. */
export async function airspaceSummary(_args: Record<string, never> = {}): Promise<string> {
  const snap = await snapshot();
  const all = snap.states ?? [];
  const airborne = all.filter((v) => v[8] !== true);
  const ground = all.length - airborne.length;

  const byCountry = new Map<string, number>();
  for (const v of all) {
    const name = typeof v[2] === 'string' && v[2].trim() ? v[2].trim() : 'not reported';
    byCountry.set(name, (byCountry.get(name) ?? 0) + 1);
  }
  const top = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const bands: Array<[string, number, number]> = [
    ['below 3000 m', 0, 3000],
    ['3000-10000 m', 3000, 10000],
    ['10000-12000 m', 10000, 12000],
    ['above 12000 m', 12000, Number.POSITIVE_INFINITY],
  ];
  const bandLines: string[] = [];
  for (const [label, low, high] of bands) {
    let count = 0;
    for (const v of airborne) {
      const alt = typeof v[13] === 'number' ? v[13] : typeof v[7] === 'number' ? v[7] : null;
      if (alt === null) continue;
      if (alt >= low && alt < high) count += 1;
    }
    bandLines.push(`${label}: ${count}`);
  }

  const snapshotAt = typeof snap.time === 'number' ? new Date(snap.time * 1000).toISOString() : 'not reported';
  return [
    `Global air traffic snapshot at ${snapshotAt}`,
    `Aircraft tracked: ${all.length}`,
    `Airborne: ${airborne.length}`,
    `On ground: ${ground}`,
    '',
    'Altitude distribution (airborne):',
    ...bandLines.map((line) => `* ${line}`),
    '',
    `Top 10 countries of registration (of ${byCountry.size} reported):`,
    ...top.map(([name, count]) => `* ${name}: ${count}`),
  ].join('\n');
}
