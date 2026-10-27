import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { station } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ndbc-buoy-mcp", version: "1.0.0" });
    server.registerTool("station", {
        title: "Station",
        description: "Latest observations for a buoy station.",
        inputSchema: z.object({ stationId: z.string().describe("Station ID like 41008.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await station(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nearby_stations", {
        title: "Nearby stations",
        description: "Active NDBC stations within a radius of a point, nearest first, with distance, position and station type.",
        inputSchema: z.object({ lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), radiusKm: z.number().int().min(1).max(1000).default(100).describe("Search radius in km."), type: z.string().max(30).optional(), limit: z.number().int().min(1).max(30).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stations locally (paywall removed)
        try {
            return textError("Not yet implemented: stations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wave_spectrum", {
        title: "Wave spectrum",
        description: "Latest wave spectrum observations for a buoy: significant and mean wave height, peak and average period, mean direction and steepness.",
        inputSchema: z.object({ stationId: z.string().describe("Station ID like 41008."), limit: z.number().int().min(1).max(20).default(6) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement spectrum locally (paywall removed)
        try {
            return textError("Not yet implemented: spectrum");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ndbc-buoy-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
