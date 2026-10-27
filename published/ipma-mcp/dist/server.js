import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cities, forecast } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ipma-mcp", version: "1.0.0" });
    server.registerTool("cities", {
        title: "Cities",
        description: "List forecast cities.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cities(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("forecast", {
        title: "Forecast",
        description: "Daily forecast for a city.",
        inputSchema: z.object({ id: z.number().describe("City global id."), limit: z.number().describe("Max days.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecast(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("weather_warnings", {
        title: "Weather warnings",
        description: "Active IPMA weather warnings for mainland Portugal, optionally filtered by awareness level and area code.",
        inputSchema: z.object({ level: z.string().describe("green, yellow, orange or red.").optional(), area: z.string().describe("IPMA area code such as LIS, POR, BGC.").optional(), limit: z.number().int().min(1).max(40).default(10).describe("Max warnings.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement warnings locally (paywall removed)
        try {
            return textError("Not yet implemented: warnings");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("station_observations", {
        title: "Station observations",
        description: "Latest observations from IPMA's automatic weather stations: temperature, humidity, pressure and wind, with station coordinates.",
        inputSchema: z.object({ station: z.string().describe("Substring of a station name, e.g. Lisboa. Empty lists the first stations.").optional(), limit: z.number().int().min(1).max(25).default(8).describe("Max stations.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement observations locally (paywall removed)
        try {
            return textError("Not yet implemented: observations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ipma-mcp";
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
