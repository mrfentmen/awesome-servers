const BASE = 'https://geolocation-db.com/json/';

export interface LocateArgs {
  ip?: string;
}

export async function locate(args: LocateArgs = {}): Promise<string> {
  const ip = (args.ip ?? '').trim();
  const url = ip ? `${BASE}${encodeURIComponent(ip)}` : BASE;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-geolocation-db-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Geolocation DB returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  return [
    `IP: ${d.IPv4 ?? 'n/a'}`,
    `Country: ${d.country_name ?? 'n/a'} (${d.country_code ?? ''})`,
    `State: ${d.state ?? 'n/a'}`,
    `City: ${d.city ?? 'n/a'}`,
    `Postal: ${d.postal ?? 'n/a'}`,
    `Latitude: ${d.latitude ?? 'n/a'}`,
    `Longitude: ${d.longitude ?? 'n/a'}`,
  ].join('\n');
}

// ---- muxB tools:

interface GeoRecord {
  country_code?: string
  country_name?: string
  city?: string | null
  postal?: string | null
  state?: string | null
  latitude?: number
  longitude?: number
  IPv4?: string
}

async function geoLookup(ip: string): Promise<GeoRecord> {
  const res = await fetch(`${BASE}${encodeURIComponent(ip)}`, {
    headers: { 'User-Agent': 'mrfentmen-geolocation-db-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Geolocation DB returned ${res.status} for ${ip}`);
  return (await res.json()) as GeoRecord;
}

const geoField = (value: unknown): string =>
  value != null && String(value) !== '' ? String(value) : 'not reported';

const geoCoords = (r: GeoRecord): { lat: number; lon: number } | null => {
  const lat = Number(r.latitude);
  const lon = Number(r.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
};

export interface LocateManyArgs {
  ips: string;
}

export interface DistanceBetweenArgs {
  from: string;
  to: string;
}

export async function distanceBetween(args: DistanceBetweenArgs): Promise<string> {
  const from = (args.from ?? '').trim();
  const to = (args.to ?? '').trim();
  if (!from || !to) throw new Error('Provide both a from and a to IP address.');
  const [a, b] = await Promise.all([geoLookup(from), geoLookup(to)]);
  const pa = geoCoords(a);
  const pb = geoCoords(b);
  const place = (r: GeoRecord, c: { lat: number; lon: number } | null) =>
    `${geoField(r.IPv4)} at ${c ? `${c.lat}, ${c.lon}` : 'no coordinates reported'} (${geoField(r.country_name)}, city ${geoField(r.city)})`;
  if (!pa || !pb) {
    return [
      `From: ${place(a, pa)}`,
      `To:   ${place(b, pb)}`,
      '',
      'No distance: at least one address has no coordinates in the database.',
    ].join('\n');
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(pb.lat - pa.lat);
  const dLon = toRad(pb.lon - pa.lon);
  const lat1 = toRad(pa.lat);
  const lat2 = toRad(pb.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const km = 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(h)));
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((bearing + 360) % 360) / 45) % 8];
  return [
    `From: ${place(a, pa)}`,
    `To:   ${place(b, pb)}`,
    '',
    `Great-circle distance: ${km.toFixed(1)} km (${(km * 0.621371).toFixed(1)} miles)`,
    `Initial bearing: ${bearing.toFixed(1)} degrees (${compass})`,
    'Straight-line over the earth surface, not a route: roads, borders and terrain are not considered.',
  ].join('\n');
}
