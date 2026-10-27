/**
 * Pure helpers for stadiamaps-mcp: coordinate validation, URL building,
 * Valhalla request payloads and response shaping. No network calls and no
 * process.env reads here - unit-tested directly against the built dist/.
 */
/** Parse "lat, lon" text (one point) into a validated pair. */
export function parseCoords(text, label = 'coordinates') {
    const parts = String(text).split(',').map((s) => s.trim());
    if (parts.length !== 2)
        throw new Error(`${label} must be "lat, lon"`);
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    return validateCoords({ lat, lon }, label);
}
export function validateCoords(p, label = 'coordinates') {
    if (!Number.isFinite(p.lat) || p.lat < -90 || p.lat > 90) {
        throw new Error(`${label}: latitude must be a number between -90 and 90 (got ${String(p.lat)})`);
    }
    if (!Number.isFinite(p.lon) || p.lon < -180 || p.lon > 180) {
        throw new Error(`${label}: longitude must be a number between -180 and 180 (got ${String(p.lon)})`);
    }
    return p;
}
export function validateCosting(c, fallback = 'auto') {
    if (c == null || c === '')
        return fallback;
    const s = String(c);
    if (!['auto', 'pedestrian', 'bicycle', 'bus', 'truck'].includes(s)) {
        throw new Error(`costing must be one of auto, pedestrian, bicycle, bus, truck (got ${s})`);
    }
    return s;
}
/** Shared travel-mode + units options for the Valhalla-family tools. */
export function routeOptions(args) {
    return {
        costing: validateCosting(args?.costing),
        units: args?.units === 'kilometers' ? 'kilometers' : 'miles',
    };
}
/** Parse "lat,lon lat,lon ..." into a waypoint list (2+ points for a route). */
export function parseWaypoints(text, minimum = 2, label = 'waypoints') {
    const points = String(text)
        .split(/\s*;\s*|\s+(?=-?\d)/)
        .map((s) => s.trim())
        .filter((s) => s !== '');
    if (points.length < minimum) {
        throw new Error(`${label}: need at least ${minimum} points as "lat,lon" separated by spaces or semicolons`);
    }
    return points.map((p, i) => parseCoords(p, `${label}[${i}]`));
}
function geocodingUrl(path, params, apiKey) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '')
            continue;
        qs.set(k, String(v));
    }
    qs.set('api_key', apiKey);
    return `https://api.stadiamaps.com${path}?${qs.toString()}`;
}
export function buildGeocodeSearchUrl(text, apiKey, size) {
    if (text.trim() === '')
        throw new Error('text is required');
    return geocodingUrl('/geocoding/v1/search', { text: text.trim(), size }, apiKey);
}
export function buildAutocompleteUrl(text, apiKey) {
    if (text.trim() === '')
        throw new Error('text is required');
    return geocodingUrl('/geocoding/v1/autocomplete', { text: text.trim() }, apiKey);
}
export function buildReverseUrl(point, apiKey, zoom, layers) {
    return geocodingUrl('/geocoding/v1/reverse', { 'point.lat': point.lat, 'point.lon': point.lon, zoom, layers }, apiKey);
}
export function buildStructuredUrl(apiKey, fields) {
    if (!Object.values(fields).some((v) => v && v.trim() !== '')) {
        throw new Error('structured search needs at least one field (country, region, city, address, postalcode)');
    }
    const clean = {};
    for (const [k, v] of Object.entries(fields))
        if (v)
            clean[k] = v.trim();
    return geocodingUrl('/geocoding/v1/structured', clean, apiKey);
}
export function buildTimezoneUrl(p, apiKey, id) {
    return geocodingUrl('/timezone/v1', { lat: p.lat, lng: p.lon, id }, apiKey);
}
/** Valhalla-style locations block. */
function locationsOf(points) {
    return points.map((p) => ({ lat: p.lat, lon: p.lon }));
}
/** POST body for /route/v1/directions (Valhalla protocol). */
export function directionsPayload(points, opts) {
    return {
        locations: locationsOf(points),
        costing: opts.costing,
        directions_options: { units: opts.units },
    };
}
/** POST body for /isochrone/v1/isochrone: reachable area within time contours. */
export function isochronePayload(point, opts, contoursMinutes) {
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
export function matrixPayload(sources, targets, opts) {
    return {
        sources: locationsOf(sources),
        targets: locationsOf(targets),
        costing: opts.costing,
        units: opts.units,
    };
}
/** POST body for /height (elevation profile). */
export function heightPayload(points, range) {
    return {
        shape: locationsOf(points),
        ...(range ? { range: true } : {}),
    };
}
/** Compact a Pelias/GeoJSON response into label + position rows. */
export function summarizeGeocoding(data) {
    const rec = data;
    if (!rec || !Array.isArray(rec.features))
        return data;
    return rec.features.map((f) => {
        const geom = (f.geometry ?? {});
        const props = (f.properties ?? {});
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
export function summarizeRoute(data) {
    const rec = data;
    if (!rec?.trip)
        return data;
    return {
        summary: rec.trip.summary ?? {},
        legs: (rec.trip.legs ?? []).map((leg) => ({
            summary: leg.summary ?? {},
            shape_points: leg.shape ? leg.shape.length : 0,
        })),
    };
}
/** Read the per-contour distance info from an isochrone answer. */
export function isochroneContours(data) {
    const rec = data;
    if (!rec?.features)
        return data;
    return rec.features.map((f) => f.properties ?? {});
}
/** Required non-empty text argument; throws a readable error instead of sending a blank query. */
export function requireText(value, label, max = 200) {
    if (typeof value !== 'string')
        throw new Error(`${label} is required`);
    const text = value.trim();
    if (text.length === 0)
        throw new Error(`${label} is required`);
    if (text.length > max)
        throw new Error(`${label} must be at most ${max} characters`);
    return text;
}
