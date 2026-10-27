import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { city } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "waqi-mcp", version: "1.0.0" });
    server.registerTool("city", {
        title: "City",
        description: "AQI for a city.",
        inputSchema: z.object({ city: z.string().describe("City like beijing.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await city(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("station_search", {
        title: "Station search",
        description: "Search the WAQI network for monitoring stations by place name, with coordinates, current AQI and the station uid.",
        inputSchema: z.object({ keyword: z.string().describe("Place name, e.g. london."), limit: z.number().int().min(1).max(25).default(10).describe("Max stations.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nearest_station", {
        title: "Nearest station",
        description: "Current air quality at the WAQI station nearest a latitude and longitude, with the dominant pollutant and the main iaqi measurements.",
        inputSchema: z.object({ lat: z.number().describe("Latitude, -90 to 90."), lon: z.number().describe("Longitude, -180 to 180.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement station locally (paywall removed)
        try {
            return textError("Not yet implemented: station");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "waqi-mcp";
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
