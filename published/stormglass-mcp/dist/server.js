import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getWeather, getElevation, getTides, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "stormglass-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_weather", {
        title: "Get marine weather",
        description: "Hourly marine weather for coordinates from multiple sources.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lng: z.string().describe("Longitude"),
            params: z.string().default("airTemperature,windSpeed,waveHeight").describe("Comma params"),
            start: z.string().optional().describe("Start timestamp"),
            end: z.string().optional().describe("End timestamp"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lng, params, start, end }) => {
        try {
            return text(await getWeather(lat, lng, params, start, end));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_elevation", {
        title: "Get elevation",
        description: "Seabed/land elevation for a coordinate.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lng: z.string().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lng }) => {
        try {
            return text(await getElevation(lat, lng));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_tides", {
        title: "Get tide extremes",
        description: "High/low tide extremes near a coordinate.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lng: z.string().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lng }) => {
        try {
            return text(await getTides(lat, lng));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "stormglass-mcp";
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
