import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, geocode, reverse, directions, nominatimLookup } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "openrouteservice-mcp",
        version: "1.0.0",
    });
    server.registerTool("geocode", {
        title: "Geocode",
        description: "Coordinates for a place name, e.g. Berlin.",
        inputSchema: z.object({
            query: z.string().describe("Place name, e.g. Berlin."),
            limit: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await geocode(query, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("reverse", {
        title: "Reverse geocode",
        description: "Nearest place name for latitude and longitude.",
        inputSchema: z.object({
            lat: z.string().describe("Latitude, e.g. 48.86"),
            lon: z.string().describe("Longitude, e.g. 2.35")
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await reverse(lat, lon));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("directions", {
        title: "Driving directions",
        description: "Driving route between two points, with distance and time.",
        inputSchema: z.object({
            from_lon: z.string().describe("Origin longitude."),
            from_lat: z.string().describe("Origin latitude."),
            to_lon: z.string().describe("Destination longitude."),
            to_lat: z.string().describe("Destination latitude.")
        }),
        annotations: READ_ONLY,
    }, async ({ from_lon, from_lat, to_lon, to_lat }) => {
        try {
            return text(await directions(from_lon, from_lat, to_lon, to_lat));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("nominatim_lookup", {
        title: "Nominatim lookup",
        description: "Geocode against OpenStreetMap's own Nominatim instead of the commercial geocoder, forward or reverse: display name, coordinates, OSM object type and id, place id, how Nominatim classifies the feature, importance score, address parts and bounding box, so you can see how the answer differs from another geocoder.",
        inputSchema: z.object({
            query: z.string().describe("What to look up, e.g. 'Eiffel Tower' or a postcode.").optional(),
            lat: z.number().describe("Latitude, for a reverse lookup.").optional(),
            lon: z.number().describe("Longitude, for a reverse lookup.").optional(),
            limit: z.number().describe("Results to show, 1-8. For a reverse lookup this is the zoom level.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nominatimLookup(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("osrm_route_steps", {
        title: "OSRM route steps",
        description: "A road route from OSRM over OpenStreetMap data with turn-by-turn instructions and alternatives: distance, estimated time, the named roads used, and each manoeuvre with its modifier, type and instruction. A different router on different data from this server's directions tool.",
        inputSchema: z.object({
            from_lat: z.number().describe("Origin latitude."),
            from_lon: z.number().describe("Origin longitude."),
            to_lat: z.number().describe("Destination latitude."),
            to_lon: z.number().describe("Destination longitude."),
            alternatives: z.boolean().describe("Ask for alternative routes, default true.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: osrm_route_steps ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_openrouteservice_osrm_route_steps", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("valhalla_mode_compare", {
        title: "Valhalla mode compare",
        description: "The same origin and destination costed by several Valhalla modes (auto, bicycle, pedestrian, multimodal, truck, taxi) side by side: distance, time, cost, tolls, ferries, motorway use, energy estimate and the opening manoeuvres, so the right mode for a journey can be compared rather than assumed.",
        inputSchema: z.object({
            from_lat: z.number().describe("Origin latitude."),
            from_lon: z.number().describe("Origin longitude."),
            to_lat: z.number().describe("Destination latitude."),
            to_lon: z.number().describe("Destination longitude."),
            modes: z.string().describe("Comma separated costings, default 'auto,bicycle,pedestrian'.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: valhalla_mode_compare ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_openrouteservice_valhalla_mode_compare", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
