#!/usr/bin/env node
/**
 * stadiamaps-mcp - geospatial answers through the Stadia Maps APIs.
 *
 * Tools:
 *  - stadia_geocode           : forward geocoding (Pelias search)
 *  - stadia_autocomplete      : as-you-type place suggestions
 *  - stadia_reverse           : what is at a coordinate
 *  - stadia_structured        : geocode from separate field/address parts
 *  - stadia_directions        : route between 2+ points (auto/pedestrian/bicycle/bus/truck)
 *  - stadia_directions_summary: the same route, reduced to distance + time + legs
 *  - stadia_isochrone         : how far you can travel in N minutes (as polygons)
 *  - stadia_isochrone_contours: the same answer reduced to per-contour info
 *  - stadia_route_matrix      : time/distance between many sources and targets
 *  - stadia_elevation         : elevation along a path (with per-point range)
 *  - stadia_elevation_point   : elevation at one coordinate
 *  - stadia_timezone          : IANA timezone for a coordinate (optional timestamp)
 *
 * Auth is one free development key from STADIA_MAPS_API_KEY. Geocoding and
 * timezone calls take it as api_key; Valhalla calls send a Stadia-API-Key header.
 *
 * First-party MCP coverage check (2026-10-23): no Stadia Maps MCP on npm and
 * no first-party server from Stadia. See mcp/MISSING.md for the log.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  geocodeAutocomplete,
  geocodeReverse,
  geocodeSearch,
  geocodeStructured,
  routeDirections,
  routeHeight,
  routeIsochrone,
  routeMatrix,
  timezoneLookup,
} from './api.js';
import {
  directionsPayload,
  heightPayload,
  isochroneContours,
  isochronePayload,
  matrixPayload,
  parseCoords,
  parseWaypoints,
  requireText,
  routeOptions,
  summarizeGeocoding,
  summarizeRoute,
  validateCoords,
  type Costing,
  type LatLon,
} from './util.js';

const server = new Server(
  { name: 'stadiamaps-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const COORD = { type: 'string', description: '"lat, lon", e.g. "40.7128, -74.0060"' };

const COSTING = {
  type: 'string',
  enum: ['auto', 'pedestrian', 'bicycle', 'bus', 'truck'],
  default: 'auto',
};

function directionsPayloadOf(a: Record<string, unknown> | undefined): Record<string, unknown> {
  const points: LatLon[] = parseWaypoints(String(a?.waypoints ?? ''), 2, 'waypoints');
  return directionsPayload(points, routeOptions(a));
}

function heightPayloadOf(a: Record<string, unknown> | undefined): Record<string, unknown> {
  const points: LatLon[] = parseWaypoints(String(a?.waypoints ?? ''), 1, 'waypoints');
  return heightPayload(points, a?.range !== false);
}

function isochronePayloadOf(a: Record<string, unknown> | undefined): Record<string, unknown> {
  return isochronePayload(
    parseCoords(String(a?.coordinates), 'coordinates'),
    routeOptions(a),
    a?.contours as number[],
  );
}

const TOOLS = [
  {
    name: 'stadia_geocode',
    description: 'Forward geocode a place name or address; returns compact rows (label, lat/lon, region, country).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'place name or address to search' },
        size: { type: 'integer', minimum: 1, maximum: 40, description: 'max results (default 10)' },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_autocomplete',
    description: 'As-you-type place suggestions for partial input.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'partial place name' } },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_reverse',
    description: 'Reverse geocode a coordinate: what place is at this lat/lon. Returns compact rows.',
    inputSchema: {
      type: 'object',
      properties: {
        coordinates: COORD,
        zoom: { type: 'integer', minimum: 1, maximum: 18, description: 'Pelias zoom granularity (18 = building)' },
        layers: { type: 'string', description: 'optional layer filter, e.g. "address,street"' },
      },
      required: ['coordinates'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_structured',
    description: 'Structured geocoding: give separate country/region/city/address/postalcode parts instead of one string.',
    inputSchema: {
      type: 'object',
      properties: {
        country: { type: 'string' },
        region: { type: 'string' },
        city: { type: 'string' },
        address: { type: 'string' },
        postalcode: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_directions',
    description:
      'Route between 2+ waypoints ("lat,lon lat,lon ..." separated by spaces or semicolons). ' +
      'Returns trip summary plus per-leg summaries (length, time) — no raw geometry.',
    inputSchema: {
      type: 'object',
      properties: {
        waypoints: { type: 'string', description: '"lat,lon" points in order, separated by spaces or semicolons' },
        costing: COSTING,
        units: { type: 'string', enum: ['miles', 'kilometers'], default: 'miles' },
      },
      required: ['waypoints'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_directions_summary',
    description: 'The same route call reduced to one line: total distance, total time, leg count.',
    inputSchema: {
      type: 'object',
      properties: {
        waypoints: { type: 'string', description: '"lat,lon" points in order, separated by spaces or semicolons' },
        costing: COSTING,
        units: { type: 'string', enum: ['miles', 'kilometers'], default: 'miles' },
      },
      required: ['waypoints'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_isochrone',
    description: 'Reachable-area polygons from one point within 1-120 minute contours (per travel mode).',
    inputSchema: {
      type: 'object',
      properties: {
        coordinates: COORD,
        costing: COSTING,
        contours: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 120 }, description: 'minutes, e.g. [10, 20]' },
      },
      required: ['coordinates', 'contours'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_isochrone_contours',
    description: 'The same isochrone call reduced to the per-contour metadata (which contour covers how far).',
    inputSchema: {
      type: 'object',
      properties: {
        coordinates: COORD,
        costing: COSTING,
        contours: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 120 } },
      },
      required: ['coordinates', 'contours'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_route_matrix',
    description:
      'Time/distance matrix between many sources and targets (each "lat,lon lat,lon ...") — pick the nearest of N places.',
    inputSchema: {
      type: 'object',
      properties: {
        sources: { type: 'string', description: '"lat,lon" points, separated by spaces or semicolons' },
        targets: { type: 'string', description: '"lat,lon" points, separated by spaces or semicolons' },
        costing: COSTING,
        units: { type: 'string', enum: ['miles', 'kilometers'], default: 'miles' },
      },
      required: ['sources', 'targets'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_elevation',
    description:
      'Elevation along a path of 2+ points; with range=true the answer includes cumulative distance at each sample.',
    inputSchema: {
      type: 'object',
      properties: {
        waypoints: { type: 'string', description: '"lat,lon" points, separated by spaces or semicolons' },
        range: { type: 'boolean', default: true, description: 'include cumulative distance per sample' },
      },
      required: ['waypoints'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_elevation_point',
    description: 'Elevation at a single coordinate (one height call, range off).',
    inputSchema: {
      type: 'object',
      properties: { coordinates: COORD },
      required: ['coordinates'],
      additionalProperties: false,
    },
  },
  {
    name: 'stadia_timezone',
    description: 'IANA timezone and offsets for a coordinate; pass timestamp (epoch seconds) for the offset at that instant.',
    inputSchema: {
      type: 'object',
      properties: {
        coordinates: COORD,
        timestamp: { type: 'integer', description: 'epoch seconds to ask about' },
      },
      required: ['coordinates'],
      additionalProperties: false,
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
  const json = (data: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
  const fail = (err: unknown) => ({
    isError: true,
    content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  });
  try {
    switch (name) {
      case 'stadia_geocode':
        return json(summarizeGeocoding(await geocodeSearch(requireText(args?.text, 'text'), args?.size as number | undefined)));
      case 'stadia_autocomplete':
        return json(summarizeGeocoding(await geocodeAutocomplete(requireText(args?.text, 'text'))));
      case 'stadia_reverse':
        return json(summarizeGeocoding(await geocodeReverse(
          parseCoords(String(args?.coordinates), 'coordinates'),
          args?.zoom as number | undefined,
          typeof args?.layers === 'string' ? args.layers : undefined,
        )));
      case 'stadia_structured':
        return json(summarizeGeocoding(await geocodeStructured({
          country: typeof args?.country === 'string' ? args.country : undefined,
          region: typeof args?.region === 'string' ? args.region : undefined,
          city: typeof args?.city === 'string' ? args.city : undefined,
          address: typeof args?.address === 'string' ? args.address : undefined,
          postalcode: typeof args?.postalcode === 'string' ? args.postalcode : undefined,
        })));
      case 'stadia_directions':
        return json(summarizeRoute(await routeDirections(directionsPayloadOf(args))));
      case 'stadia_directions_summary': {
        const raw = (await routeDirections(directionsPayloadOf(args))) as { trip?: { summary?: Record<string, unknown>; legs?: unknown[] } };
        return json({ summary: raw?.trip?.summary ?? {}, legs: raw?.trip?.legs?.length ?? 0 });
      }
      case 'stadia_isochrone':
        return json(await routeIsochrone(isochronePayloadOf(args)));
      case 'stadia_isochrone_contours':
        return json(isochroneContours(await routeIsochrone(isochronePayloadOf(args))));
      case 'stadia_route_matrix':
        return json(await routeMatrix(matrixPayload(
          parseWaypoints(String(args?.sources ?? ''), 1, 'sources'),
          parseWaypoints(String(args?.targets ?? ''), 1, 'targets'),
          routeOptions(args),
        )));
      case 'stadia_elevation':
        return json(await routeHeight(heightPayloadOf(args)));
      case 'stadia_elevation_point':
        return json(await routeHeight(heightPayloadOf({ waypoints: String(args?.coordinates), range: false })));
      case 'stadia_timezone':
        return json(await timezoneLookup(
          validateCoords(parseCoords(String(args?.coordinates), 'coordinates')),
          args?.timestamp as number | undefined,
        ));
      default:
        return fail(new Error(`unknown tool: ${name}`));
    }
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);