import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etd, stations } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bart-mcp", version: "1.0.0" });
    server.registerTool("etd", {
        title: "Etd",
        description: "Estimated departures for a station.",
        inputSchema: z.object({ station: z.string().describe("Station abbreviation.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await etd(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stations", {
        title: "Stations",
        description: "List stations.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("station_locations", {
        title: "Station locations and nearest station",
        description: "Look up BART stations by city, or find the ones nearest a latitude and longitude, returning the GTFS coordinates, street address, county and zip of each.",
        inputSchema: z.object({
            city: z.string().describe("Filter by city or county, for example Oakland.").optional(),
            latitude: z.number().describe("Latitude to measure from, between -90 and 90.").optional(),
            longitude: z.number().describe("Longitude to measure from, between -180 and 180.").optional(),
            limit: z.number().describe("How many stations to list, 1 to 50. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement locations locally (paywall removed)
        try {
            return textError("Not yet implemented: locations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_status", {
        title: "Network-wide real time status",
        description: "Summarise the whole BART network at one instant: cancelled arrivals, delayed trains, arrivals with no bike space, the longest wait on the board, the busiest stations and the most delayed trains.",
        inputSchema: z.object({
            limit: z.number().describe("How many busiest stations to list, 1 to 25. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement status locally (paywall removed)
        try {
            return textError("Not yet implemented: status");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bart-mcp";
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
