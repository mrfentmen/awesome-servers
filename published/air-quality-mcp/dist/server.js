import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { airQuality } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "air-quality-mcp", version: "1.0.0" });
    server.registerTool("air_quality", {
        title: "Air quality",
        description: "Get the current air quality index for a location.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await airQuality(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("air_forecast", {
        title: "Air quality forecast",
        description: "Day by day PM2.5 forecast for a location, with the cleanest and dirtiest hours.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), days: z.number().describe("Forecast days, 1 to 3.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement forecast locally (paywall removed)
        try {
            return textError("Not yet implemented: forecast");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pollen_report", {
        title: "Pollen report",
        description: "Current pollen counts for the six main allergens at a location, with the European AQI.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement report locally (paywall removed)
        try {
            return textError("Not yet implemented: report");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "air-quality-mcp";
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
