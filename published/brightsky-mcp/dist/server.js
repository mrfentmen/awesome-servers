import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { weather, weatherSources } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "brightsky-mcp", version: "1.0.0" });
    server.registerTool("weather", {
        title: "Weather",
        description: "Weather for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("YYYY-MM-DD.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await weather(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hourly_forecast", {
        title: "Hourly forecast",
        description: "Hourly Bright Sky weather with the full field set: temperature, dew point, humidity, cloud cover, precipitation and its probability, wind speed, direction and gusts, pressure, visibility and condition.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("ISO date, defaults to today.").optional(), limit: z.number().describe("Max hours.").optional() }),
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
    server.registerTool("forecast_summary", {
        title: "Forecast summary",
        description: "Derive a whole window summary from Bright Sky hourly data: temperature range and mean, coldest and warmest hour, total rainfall, wet hours, strongest wind and the dominant condition.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("ISO date, defaults to today.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement summary locally (paywall removed)
        try {
            return textError("Not yet implemented: summary");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("weather_sources", {
        title: "Weather sources",
        description: "List the observation stations and models that produced the Bright Sky data for a coordinate, with WMO and national station ids, position, height and record window.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("ISO date, defaults to today.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await weatherSources(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "brightsky-mcp";
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
