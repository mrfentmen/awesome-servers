import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, geocodeInBox } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "photon-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Geocode a place name.",
        inputSchema: z.object({ query: z.string().describe("Place name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_geocode", {
        title: "Reverse geocode",
        description: "OpenStreetMap features at a latitude and longitude: nearest street, house, square or place, with OSM type and postcode.",
        inputSchema: z.object({ lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), limit: z.number().int().min(1).max(20).default(5) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement geocode locally (paywall removed)
        try {
            return textError("Not yet implemented: geocode");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_by_tag", {
        title: "Search by tag",
        description: "Geocode a place name restricted to one OpenStreetMap tag, such as amenity:restaurant or tourism:attraction.",
        inputSchema: z.object({ query: z.string().describe("Place name."), tag: z.string().describe("OSM tag as key:value."), countryCode: z.string().max(2).optional(), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tag locally (paywall removed)
        try {
            return textError("Not yet implemented: tag");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("geocode_in_box", {
        title: "Geocode in box",
        description: "Geocode a place name restricted to a bounding box, so results only come from that part of the world.",
        inputSchema: z.object({ query: z.string().describe("Place name."), south: z.number().min(-90).max(90), west: z.number().min(-180).max(180), north: z.number().min(-90).max(90), east: z.number().min(-180).max(180), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await geocodeInBox(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "photon-mcp";
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
