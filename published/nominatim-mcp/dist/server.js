import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_reverse, m0_search, m1_geocode } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'nominatim-mcp', version: '1.0.0' });
    server.registerTool("search", {
        title: "Search",
        description: "Search places by name.",
        inputSchema: z.object({ query: z.string().describe("Place name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse", {
        title: "Reverse",
        description: "Address for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_reverse(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("geocode", {
        title: "Geocode",
        description: "Find coordinates for a place name or address.",
        inputSchema: z.object({ query: z.string().describe("Place or address."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_geocode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lookup_osm", {
        title: "Lookup OSM ids",
        description: "Resolve a batch of OpenStreetMap ids at once, with namedetails and extra tags attached, using the ids a search or reverse reports.",
        inputSchema: z.object({ ids: z.string().describe("OSM ids like W5013364, comma separated, max 50."), extratags: z.boolean().describe("Include extra tags (default true).").optional(), namedetails: z.boolean().describe("Include name details (default true).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement osm locally (paywall removed)
        try {
            return textError("Not yet implemented: osm");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nominatim-mcp";
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
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
