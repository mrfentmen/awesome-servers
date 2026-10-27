/**
 * Thin HTTP layer for the Stadia Maps APIs. Geocoding and timezone are GETs
 * with the key in an api_key query parameter; the Valhalla-family endpoints
 * are POSTs with the key in the Stadia-API-Key header. The key is read from
 * the environment, never from tool arguments.
 */
import {
  buildAutocompleteUrl,
  buildGeocodeSearchUrl,
  buildReverseUrl,
  buildStructuredUrl,
  buildTimezoneUrl,
  type LatLon,
} from './util.js';

const BASE = 'https://api.stadiamaps.com';

export function requireApiKey(): string {
  const key = process.env.STADIA_MAPS_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error(
      'STADIA_MAPS_API_KEY is not set. Get a free development key at https://client.stadiamaps.com/ (no card needed) and export it before starting this server.',
    );
  }
  return key.trim();
}

async function readJson(resp: Response, what: string): Promise<unknown> {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${what} failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
  }
  return resp.json();
}

export function geocodeSearch(text: string, size?: number): Promise<unknown> {
  return fetch(buildGeocodeSearchUrl(text, requireApiKey(), size), {
    headers: { accept: 'application/json' },
  }).then((r) => readJson(r, 'geocoding search'));
}

export function geocodeAutocomplete(text: string): Promise<unknown> {
  return fetch(buildAutocompleteUrl(text, requireApiKey()), {
    headers: { accept: 'application/json' },
  }).then((r) => readJson(r, 'autocomplete'));
}

export function geocodeReverse(point: LatLon, zoom?: number, layers?: string): Promise<unknown> {
  return fetch(buildReverseUrl(point, requireApiKey(), zoom, layers), {
    headers: { accept: 'application/json' },
  }).then((r) => readJson(r, 'reverse geocoding'));
}

export function geocodeStructured(
  fields: Record<string, string | undefined>,
): Promise<unknown> {
  return fetch(buildStructuredUrl(requireApiKey(), fields), {
    headers: { accept: 'application/json' },
  }).then((r) => readJson(r, 'structured geocoding'));
}

export function timezoneLookup(p: LatLon, id?: number): Promise<unknown> {
  return fetch(buildTimezoneUrl(p, requireApiKey(), id), {
    headers: { accept: 'application/json' },
  }).then((r) => readJson(r, 'timezone lookup'));
}

async function valhallaPost(path: string, payload: Record<string, unknown>): Promise<unknown> {
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Stadia-API-Key': requireApiKey() },
    body: JSON.stringify(payload),
  });
  return readJson(resp, `${path}`);
}

export function routeDirections(payload: Record<string, unknown>): Promise<unknown> {
  return valhallaPost('/route/v1/directions', payload);
}

export function routeIsochrone(payload: Record<string, unknown>): Promise<unknown> {
  return valhallaPost('/isochrone/v1/isochrone', payload);
}

export function routeMatrix(payload: Record<string, unknown>): Promise<unknown> {
  return valhallaPost('/sources_to_targets', payload);
}

export function routeHeight(payload: Record<string, unknown>): Promise<unknown> {
  return valhallaPost('/height', payload);
}
