import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getHourlyForecast, getThreeHourlyForecast, getDailyForecast, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "metoffice-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_hourly_forecast", {
        title: "Get hourly forecast",
        description: "UK Met Office hourly forecast for a point: temperature, feels-like, rain probability, wind, gusts, visibility.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude"),
            longitude: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude }) => {
        try {
            return text(await getHourlyForecast(latitude, longitude));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_three_hourly_forecast", {
        title: "Get three-hourly forecast",
        description: "UK Met Office three-hourly forecast steps for a point, longer range than hourly.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude"),
            longitude: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude }) => {
        try {
            return text(await getThreeHourlyForecast(latitude, longitude));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_daily_forecast", {
        title: "Get daily forecast",
        description: "UK Met Office daily forecast for a point: day/night temperature, rain probability, wind summary.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude"),
            longitude: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude }) => {
        try {
            return text(await getDailyForecast(latitude, longitude));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "metoffice-mcp";
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
