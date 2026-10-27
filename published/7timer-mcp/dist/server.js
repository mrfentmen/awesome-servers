import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { forecast, forecastByPlace, forecastSummary, dailyOutlook } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "7timer-mcp", version: "1.0.0" });
    server.registerTool("forecast", {
        title: "Forecast",
        description: "Weather for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecast(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("forecast_summary", {
        title: "Forecast summary",
        description: "What the whole 7Timer 3-hourly series adds up to: when the coldest and warmest periods land and by how much, how much precipitation the series carries, mean and peak wind, mean and thickest cloud, and the lifted index.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecastSummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("daily_outlook", {
        title: "Daily outlook",
        description: "The 7Timer daily product: one row per day with that day's condition, its low and high, the size of its temperature range and its peak wind, plus the period's overall extremes.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), limit: z.number().describe("Days to show, 1-7.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dailyOutlook(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("forecast_by_place", {
        title: "Forecast by place name",
        description: "Look a place up by name with OpenStreetMap Nominatim, show the candidate matches with their coordinates, then give the 7Timer civil series for the first match.",
        inputSchema: z.object({ place: z.string().describe("Place name, e.g. Reykjavik or Wellington."), limit: z.number().describe("Candidate places to list, 1-5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecastByPlace(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "7timer-mcp";
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
