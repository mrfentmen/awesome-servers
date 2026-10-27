import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findStations, getTimeseries } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "synoptic-mcp",
        version: "1.0.0",
    });
    server.registerTool("find_stations", {
        title: "Find stations",
        description: "Synoptic weather stations by state with ids, names and coordinates.",
        inputSchema: z.object({
            state: z.string().describe("Two-letter state, e.g. 'TX'"),
            limit: z.number().default(20).describe("How many"),
        }),
        annotations: READ_ONLY,
    }, async ({ state, limit }) => {
        try {
            return text(await findStations(state, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_timeseries", {
        title: "Get time series",
        description: "Observations for stations: temp, wind, humidity and more.",
        inputSchema: z.object({
            stid: z.string().describe("Station id(s), comma-separated"),
            vars: z.string().default("air_temp").describe("Variables like air_temp,wind_speed"),
            recent: z.number().default(60).describe("Minutes back"),
        }),
        annotations: READ_ONLY,
    }, async ({ stid, vars, recent }) => {
        try {
            return text(await getTimeseries(stid, vars, recent));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nws_station_timeseries", {
        title: "NWS station time series",
        description: "Observed weather station time series from the US National Weather Service: temperature, dewpoint, humidity, wind, gust, pressure and visibility, one row per observation. No key needed.",
        inputSchema: z.object({
            stid: z.string().describe("NWS station id, e.g. KJFK, KBOS, KDCA"),
            hours: z.number().default(6).describe("How many hours back to fetch, 1-72"),
            limit: z.number().default(24).describe("How many observations to show, 1-100"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement timeseries locally (paywall removed)
            try {
                return textError("Not yet implemented: timeseries");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nws_gridpoint_hourly", {
        title: "NWS gridded hourly forecast",
        description: "Hourly model forecast time series for any US point from the National Weather Service grid: temperature, wind, humidity, precipitation chance and conditions. No key needed.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            hours: z.number().default(24).describe("How many hours to show, 1-156"),
            limit: z.number().default(24).describe("How many hourly periods to show, 1-156"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement hourly locally (paywall removed)
            try {
                return textError("Not yet implemented: hourly");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "synoptic-mcp";
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
