import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getWeatherStations, getHomeData, getHomeStatus, getEvents, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "netatmo-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_weather_stations", {
        title: "Get weather stations",
        description: "Netatmo weather stations: indoor/outdoor modules, temperature, humidity, CO2, noise, pressure.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getWeatherStations());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_home_data", {
        title: "Get home data",
        description: "Netatmo homes: rooms, modules, cameras, schedules, place info.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getHomeData());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_home_status", {
        title: "Get home status",
        description: "Live Netatmo home status: thermostats, valves, windows, presence per room.",
        inputSchema: z.object({
            homeId: z.string().describe("Home id from get_home_data"),
        }),
        annotations: READ_ONLY,
    }, async ({ homeId }) => {
        try {
            return text(await getHomeStatus(homeId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_events", {
        title: "Get home events",
        description: "Recent Netatmo home events: motion, doorbell, alarms, person seen.",
        inputSchema: z.object({
            homeId: z.string().describe("Home id"),
        }),
        annotations: READ_ONLY,
    }, async ({ homeId }) => {
        try {
            return text(await getEvents(homeId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "netatmo-mcp";
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
