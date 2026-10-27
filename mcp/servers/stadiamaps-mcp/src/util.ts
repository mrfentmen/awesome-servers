/**
 * Pure helpers for stadiamaps-mcp: coordinate validation, URL building,
 * Valhalla request payloads and response shaping. No network calls and no
 * process.env reads here - unit-tested directly against the built dist/.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

/** Parse "lat, lon" text (one point) into a validated pair. */
export function parseCoords(text: string, label = 'coordinates'): LatLon {
  const parts = String(text).split(',').map((s) => s.trim());
  if (parts.length !== 2) throw new Error(`${label} must be "lat, lon"`);
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  return validateCoords({ lat, lon }, label);
}

export function validateCoords(p: LatLon, label = 'coordinates'): LatLon {
  if (!Number.isFinite(p.lat) || p.lat < -90 || p.lat > 90) {
    throw new Error(`${label}: latitude must be a number between -90 and 90 (got ${String(p.lat)})`);
  }
  if (!Number.isFinite(p.lon) || p.lon < -180 || p.lon > 180) {
    throw new Error(`${label}: longitude must be a number between -180 and 180 (got ${String(p.lon)})`);
  }
  return p;
}

export type Costing = 'auto' | 'pedestrian' | 'bicycle' | 'bus' | 'truck';

export function validateCosting(c: unknown, fallback: Costing = 'auto'): Costing {
  if (c == null || c === '') return fallback;
  const s = String(c);
  if (!['auto', 'pedestrian', 'bicycle', 'bus', 'truck'].includes(s)) {
    throw new Error(`costing must be one of auto, pedestrian, bicycle, bus, truck (got ${s})`);
  }
  return s as Costing;
}

/** Shared travel-mode + units options for the Valhalla-family tools. */
export function routeOptions(
  args: Record<string, unknown> | undefined,
): { costing: Costing; units: 'miles' | 'kilometers' } {
  return {
    costing: validateCosting(args?.costing),
    units: args?.units === 'kilometers' ? ('kilometers' as const) : ('miles' as const),
  };
}

/** Parse "lat,lon lat,lon ..." into a waypoint list (2+ points for a route). */
export function parseWaypoints(text: string, minimum = 2, label = 'waypoints'): LatLon[] {
  const points = String(text)
    .split(/\s*;\s*|\s+(?=-?\d)/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (points.length < minimum) {
    throw new Error(`${label}: need at least ${minimum} points as "lat,lon" separated by spaces or semicolons`);
  }
  return points.map((p, i) => parseCoords(p, `${label}[${i}]`));
}

function geocodingUrl(path: string, params: Record<string, string | number | undefined>, apiKey: string): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    qs.set(k, String(v));
  }
  qs.set('api_key', apiKey);
  return `https://api.stadiamaps.com${path}?${qs.toString()}`;
}

export function buildGeocodeSearchUrl(text: string, apiKey: string, size?: number): string {
  if (text.trim() === '') throw new Error('text is required');
  return geocodingUrl('/geocoding/v1/search', { text: text.trim(), size }, apiKey);
}

export function buildAutocompleteUrl(text: string, apiKey: string): string {
  if (text.trim() === '') throw new Error('text is required');
  return geocodingUrl('/geocoding/v1/autocomplete', { text: text.trim() }, apiKey);
}

export function buildReverseUrl(point: LatLon, apiKey: string, zoom?: number, layers?: string): string {
  return geocodingUrl(
    '/geocoding/v1/reverse',
    { 'point.lat': point.lat, 'point.lon': point.lon, zoom, layers },
    apiKey,
  );
}

export function buildStructuredUrl(
  apiKey: string,
  fields: Record<string, string | undefined>,
): string {
  if (!Object.values(fields).some((v) => v && v.trim() !== '')) {
    throw new Error('structured search needs at least one field (country, region, city, address, postalcode)');
  }
  const clean: Record<string, string | number | undefined> = {};
  for (const [k, v] of Object.entries(fields)) if (v) clean[k] = v.trim();
  return geocodingUrl('/geocoding/v1/structured', clean, apiKey);
}

export function buildTimezoneUrl(p: LatLon, apiKey: string, id?: number): string {
  return geocodingUrl('/timezone/v1', { lat: p.lat, lng: p.lon, id }, apiKey);
}

/** Valhalla-style locations block. */
function locationsOf(points: LatLon[]): Array<{ lat: number; lon: number }> {
  return points.map((p) => ({ lat: p.lat, lon: p.lon }));
}

export interface RouteOptions {
  costing: Costing;
  units: 'miles' | 'kilometers';
}

/** POST body for /route/v1/directions (Valhalla protocol). */
export function directionsPayload(points: LatLon[], opts: RouteOptions): Record<string, unknown> {
  return {
    locations: locationsOf(points),
    costing: opts.costing,
    directions_options: { units: opts.units },
  };
}

/** POST body for /isochrone/v1/isochrone: reachable area within time contours. */
export function isochronePayload(
  point: LatLon,
  opts: RouteOptions,
  contoursMinutes: number[],
): Record<string, unknown> {
  if (!Array.isArray(contoursMinutes) || contoursMinutes.length === 0) {
    throw new Error('contours must be a non-empty list of times in minutes');
  }
  for (const c of contoursMinutes) {
    if (!Number.isInteger(c) || c < 1 || c > 120) {
      throw new Error('each contour must be an integer between 1 and 120 minutes');
    }
  }
  return {
    locations: locationsOf([point]),
    costing: opts.costing,
    contours: contoursMinutes.map((time) => ({ time })),
    polygons: true,
    denoise: 0.5,
  };
}

/** POST body for /sources_to_targets (route matrix). */
export function matrixPayload(
  sources: LatLon[],
  targets: LatLon[],
  opts: RouteOptions,
): Record<string, unknown> {
  return {
    sources: locationsOf(sources),
    targets: locationsOf(targets),
    costing: opts.costing,
    units: opts.units,
  };
}

/** POST body for /height (elevation profile). */
export function heightPayload(points: LatLon[], range: boolean): Record<string, unknown> {
  return {
    shape: locationsOf(points),
    ...(range ? { range: true } : {}),
  };
}

/** Compact a Pelias/GeoJSON response into label + position rows. */
export function summarizeGeocoding(data: unknown): unknown {
  const rec = data as { features?: Array<Record<string, unknown>> };
  if (!rec || !Array.isArray(rec.features)) return data;
  return rec.features.map((f) => {
    const geom = (f.geometry ?? {}) as { coordinates?: number[] };
    const props = (f.properties ?? {}) as Record<string, unknown>;
    return {
      label: props.label,
      name: props.name,
      layer: props.layer,
      region: props.region,
      locality: props.locality,
      country: props.country,
      lat: geom.coordinates?.[1],
      lon: geom.coordinates?.[0],
    };
  });
}

/** Compact a Valhalla route answer into trip summary + per-leg summaries. */
export function summarizeRoute(data: unknown): unknown {
  const rec = data as { trip?: { summary?: Record<string, unknown>; legs?: Array<{ summary?: Record<string, unknown>; shape?: string }> } };
  if (!rec?.trip) return data;
  return {
    summary: rec.trip.summary ?? {},
    legs: (rec.trip.legs ?? []).map((leg) => ({
      summary: leg.summary ?? {},
      shape_points: leg.shape ? leg.shape.length : 0,
    })),
  };
}

/** Read the per-contour distance info from an isochrone answer. */
export function isochroneContours(data: unknown): unknown {
  const rec = data as { features?: Array<{ properties?: Record<string, unknown> }> };
  if (!rec?.features) return data;
  return rec.features.map((f) => f.properties ?? {});
}
