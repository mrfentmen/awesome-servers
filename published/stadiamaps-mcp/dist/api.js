/**
 * Thin HTTP layer for the Stadia Maps APIs. Geocoding and timezone are GETs
 * with the key in an api_key query parameter; the Valhalla-family endpoints
 * are POSTs with the key in the Stadia-API-Key header. The key is read from
 * the environment, never from tool arguments.
 */
import { buildAutocompleteUrl, buildGeocodeSearchUrl, buildReverseUrl, buildStructuredUrl, buildTimezoneUrl, } from './util.js';
const BASE = 'https://api.stadiamaps.com';
export function requireApiKey() {
    const key = process.env.STADIA_MAPS_API_KEY;
    if (!key || key.trim() === '') {
        throw new Error('STADIA_MAPS_API_KEY is not set. Get a free development key at https://client.stadiamaps.com/ (no card needed) and export it before starting this server.');
    }
    return key.trim();
}
async function readJson(resp, what) {
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`${what} failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
    }
    return resp.json();
}
export function geocodeSearch(text, size) {
    return fetch(buildGeocodeSearchUrl(text, requireApiKey(), size), {
        headers: { accept: 'application/json' },
    }).then((r) => readJson(r, 'geocoding search'));
}
export function geocodeAutocomplete(text) {
    return fetch(buildAutocompleteUrl(text, requireApiKey()), {
        headers: { accept: 'application/json' },
    }).then((r) => readJson(r, 'autocomplete'));
}
export function geocodeReverse(point, zoom, layers) {
    return fetch(buildReverseUrl(point, requireApiKey(), zoom, layers), {
        headers: { accept: 'application/json' },
    }).then((r) => readJson(r, 'reverse geocoding'));
}
export function geocodeStructured(fields) {
    return fetch(buildStructuredUrl(requireApiKey(), fields), {
        headers: { accept: 'application/json' },
    }).then((r) => readJson(r, 'structured geocoding'));
}
export function timezoneLookup(p, id) {
    return fetch(buildTimezoneUrl(p, requireApiKey(), id), {
        headers: { accept: 'application/json' },
    }).then((r) => readJson(r, 'timezone lookup'));
}
async function valhallaPost(path, payload) {
    const resp = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Stadia-API-Key': requireApiKey() },
        body: JSON.stringify(payload),
    });
    return readJson(resp, `${path}`);
}
export function routeDirections(payload) {
    return valhallaPost('/route/v1/directions', payload);
}
export function routeIsochrone(payload) {
    return valhallaPost('/isochrone/v1/isochrone', payload);
}
export function routeMatrix(payload) {
    return valhallaPost('/sources_to_targets', payload);
}
export function routeHeight(payload) {
    return valhallaPost('/height', payload);
}
