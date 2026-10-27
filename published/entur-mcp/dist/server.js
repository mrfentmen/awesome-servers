import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { autocompleteStop, reverseGeocode, getDepartures, planTrip } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "entur-mcp",
        version: "1.0.0",
    });
    server.registerTool("autocomplete_stop", {
        title: "Autocomplete stops",
        description: "Find Norwegian stops and stations by name: Oslo S, Bergen, Trondheim S.",
        inputSchema: z.object({
            query: z.string().describe("Stop name search"),
            lang: z.string().default("en").describe("Language"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, lang }) => {
        try {
            return text(await autocompleteStop(query, lang));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_geocode", {
        title: "Reverse geocode",
        description: "Nearest Norwegian stops and addresses for coordinates.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude"),
            longitude: z.number().describe("Longitude"),
            lang: z.string().default("en").describe("Language"),
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude, lang }) => {
        try {
            return text(await reverseGeocode(latitude, longitude, lang));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_departures", {
        title: "Get departures",
        description: "Live departures from a Norwegian stop place: lines, destinations, realtime times.",
        inputSchema: z.object({
            stopPlaceId: z.string().describe("Stop id like 'NSR:StopPlace:59872' (Oslo S)"),
            departures: z.number().default(5).describe("How many departures"),
        }),
        annotations: READ_ONLY,
    }, async ({ stopPlaceId, departures }) => {
        try {
            return text(await getDepartures(stopPlaceId, departures));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("plan_trip", {
        title: "Plan a trip",
        description: "Door-to-door Norway trip: trains, buses, trams, ferries with legs, times and lines.",
        inputSchema: z.object({
            from: z.string().describe("Origin stop id or 'lat,lon'"),
            to: z.string().describe("Destination stop id or 'lat,lon'"),
            dateTime: z.string().optional().describe("ISO departure time, default now"),
        }),
        annotations: READ_ONLY,
    }, async ({ from, to, dateTime }) => {
        try {
            return text(await planTrip(from, to, dateTime));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("quays_nearby", {
        title: "Quays nearby",
        description: "Every Entur quay within a radius of a latitude and longitude, each with its real distance in metres, which is how you find the stop ids the other tools need.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude, -90 to 90."), longitude: z.number().describe("Longitude, -180 to 180."), radius: z.number().describe("Radius in metres, up to 20000.").optional(), limit: z.number().describe("Max quays.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement nearby locally (paywall removed)
        try {
            return textError("Not yet implemented: nearby");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stop_details", {
        title: "Stop details",
        description: "One Entur stop place in full: transport modes, tariff zones, and every quay with its public code, stop type and wheelchair accessibility.",
        inputSchema: z.object({ stopId: z.string().describe("Stop place id, e.g. NSR:StopPlace:58366."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("service_alerts", {
        title: "Service alerts",
        description: "Live service disruptions across Norway's transport network, optionally narrowed to one Entur severity level.",
        inputSchema: z.object({ severity: z.string().describe("verySevere, severe, unknownSeverity, normal or verySlight.").optional(), limit: z.number().describe("Max alerts.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement alerts locally (paywall removed)
        try {
            return textError("Not yet implemented: alerts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "entur-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    return server;
}
