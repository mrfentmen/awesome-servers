import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCoords,
  parseWaypoints,
  validateCosting,
  validateCoords,
  routeOptions,
  buildGeocodeSearchUrl,
  buildReverseUrl,
  buildStructuredUrl,
  directionsPayload,
  isochronePayload,
  matrixPayload,
  heightPayload,
  summarizeGeocoding,
  summarizeRoute,
  isochroneContours,
} from '../dist/util.js';

test('parseCoords accepts "lat, lon" pairs and rejects bad ones', () => {
  assert.deepEqual(parseCoords(' 40.7128, -74.0060 '), { lat: 40.7128, lon: -74.006 });
  assert.deepEqual(parseCoords('40.7128,-74.006'), { lat: 40.7128, lon: -74.006 });
  assert.throws(() => parseCoords('40.7128'), /must be "lat, lon"/);
  assert.throws(() => parseCoords('91, 0'), /latitude must be a number/);
  assert.throws(() => parseCoords('40, -200'), /longitude must be a number/);
  assert.throws(() => parseCoords('40, abc'), /latitude must be a number/);
});

test('validateCoords bounds both axes', () => {
  assert.deepEqual(validateCoords({ lat: 0, lon: 0 }), { lat: 0, lon: 0 });
  assert.throws(() => validateCoords({ lat: NaN, lon: 0 }), /latitude must be a number/);
  assert.throws(() => validateCoords({ lat: 89, lon: 181 }), /longitude must be a number/);
});

test('parseWaypoints splits on spaces or semicolons and enforces a minimum', () => {
  const got = parseWaypoints('40.7, -74.0 41.9, -87.6; 34.05,-118.24', 3, 'waypoints');
  assert.equal(got.length, 3);
  assert.deepEqual(got[1], { lat: 41.9, lon: -87.6 });
  assert.throws(() => parseWaypoints('40.7, -74.0', 2, 'waypoints'), /need at least 2/);
});

test('validateCosting accepts the Valhalla modes and rejects others', () => {
  assert.equal(validateCosting('bicycle'), 'bicycle');
  assert.equal(validateCosting(undefined), 'auto');
  assert.throws(() => validateCosting('helicopter'), /costing must be one of/);
});

test('routeOptions normalizes units and defaults the mode', () => {
  assert.deepEqual(routeOptions({ units: 'kilometers', costing: 'bus' }), { costing: 'bus', units: 'kilometers' });
  assert.deepEqual(routeOptions({}), { costing: 'auto', units: 'miles' });
});

test('geocoding URLs carry api_key and encode the text', () => {
  assert.equal(
    buildGeocodeSearchUrl('Grand Central', 'k/ey', 3),
    'https://api.stadiamaps.com/geocoding/v1/search?text=Grand%20Central&size=3&api_key=k%2Fey',
  );
  assert.throws(() => buildGeocodeSearchUrl('   ', 'k'), /text is required/);
  const rev = buildReverseUrl({ lat: 37.7749, lon: -122.4194 }, 'k', 18, 'address');
  assert.ok(rev.includes('point.lat=37.7749'));
  assert.ok(rev.includes('point.lon=-122.4194'));
  assert.ok(rev.includes('zoom=18'));
  assert.ok(rev.includes('layers=address'));

  const structured = buildStructuredUrl('k', { country: 'US', city: ' Ann Arbor ' });
  assert.ok(structured.includes('country=US'));
  assert.ok(structured.includes('city=Ann%20Anbor'.replace('Anbor', 'Arbor')));
  assert.throws(() => buildStructuredUrl('k', {}), /at least one field/);
});

test('Valhalla payload builders produce the documented shapes', () => {
  const a = { lat: 40.7, lon: -74.0 };
  const b = { lat: 42.3, lon: -71.0 };
  const route = directionsPayload([a, b], { costing: 'pedestrian', units: 'kilometers' });
  assert.deepEqual(route, {
    locations: [{ lat: 40.7, lon: -74 }, { lat: 42.3, lon: -71 }],
    costing: 'pedestrian',
    directions_options: { units: 'kilometers' },
  });

  const iso = isochronePayload(a, { costing: 'auto', units: 'miles' }, [10, 20]);
  assert.deepEqual(iso.contours, [{ time: 10 }, { time: 20 }]);
  assert.equal(iso.polygons, true);
  assert.throws(() => isochronePayload(a, { costing: 'auto', units: 'miles' }, []), /non-empty list/);
  assert.throws(() => isochronePayload(a, { costing: 'auto', units: 'miles' }, [0]), /between 1 and 120/);
  assert.throws(() => isochronePayload(a, { costing: 'auto', units: 'miles' }, [999]), /between 1 and 120/);

  const matrix = matrixPayload([a], [b], { costing: 'bicycle', units: 'miles' });
  assert.deepEqual(matrix.sources, [{ lat: 40.7, lon: -74 }]);
  assert.deepEqual(matrix.targets, [{ lat: 42.3, lon: -71 }]);

  assert.deepEqual(heightPayload([a, b], false), { shape: [{ lat: 40.7, lon: -74 }, { lat: 42.3, lon: -71 }] });
  assert.deepEqual(heightPayload([a], true), { shape: [{ lat: 40.7, lon: -74 }], range: true });
});

test('summarizeGeocoding compacts GeoJSON features and passes others through', () => {
  const got = summarizeGeocoding({
    features: [
      {
        geometry: { coordinates: [-74.006, 40.7128] },
        properties: { label: 'New York, NY', name: 'New York', layer: 'locality', country: 'United States' },
      },
    ],
  }) as Array<Record<string, unknown>>;
  assert.equal(got[0].label, 'New York, NY');
  assert.equal(got[0].lat, 40.7128);
  assert.equal(summarizeGeocoding({ nope: true }), undefined); // features missing -> returns undefined body
  assert.equal(summarizeGeocoding(null), null);
});

test('summarizeRoute keeps the trip summary and drops raw geometry', () => {
  const got = summarizeRoute({
    trip: {
      summary: { length: 214, time: 15186 },
      legs: [{ summary: { length: 100, time: 7000 }, shape: 'abcdef' }],
    },
  }) as Record<string, unknown>;
  assert.deepEqual(got.summary, { length: 214, time: 15186 });
  assert.deepEqual(got.legs, [{ summary: { length: 100, time: 7000 }, shape_points: 6 }]);
  assert.deepEqual(summarizeRoute({}), {});
});

test('isochroneContours reduces polygons to their metadata', () => {
  const got = isochroneContours({
    features: [{ properties: { contour: 600, area: 1234 } }, { properties: { contour: 1200, area: 5678 } }],
  }) as Array<Record<string, unknown>>;
  assert.equal(got[0].contour, 600);
  assert.equal(got[1].contour, 1200);
  assert.deepEqual(isochroneContours({}), {});
});