import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_issNow, m0_issPasses, m1_position, issGroundTrack, resolvePlace } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'iss-mcp', version: '1.0.0' });
    server.registerTool("iss_now", {
        title: "Iss now",
        description: "Current ISS position, altitude, and velocity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_issNow(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("iss_passes", {
        title: "Iss passes",
        description: "Upcoming ISS passes over a location.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), days: z.number().describe("Days to look ahead.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_issPasses(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("position", {
        title: "Position",
        description: "Current ISS position.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_position(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("iss_ground_track", {
        title: "ISS ground track",
        description: "What the ISS is actually over right now: the named place, country and region under it, reverse geocoded from its live position through OpenStreetMap, with altitude, speed and a map link.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await issGroundTrack());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("resolve_place", {
        title: "Resolve place",
        description: "Resolve a place name to latitude and longitude through OpenStreetMap Nominatim, so iss_passes can be asked about a town instead of a pair of numbers.",
        inputSchema: z.object({ place: z.string().describe("Place name, e.g. Reykjavik"), limit: z.number().int().min(1).max(10).default(3).describe("How many matches to print (default 3, max 10).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await resolvePlace(args.place, args.limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "iss-mcp";
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
    return server;
}
