import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { connections, stationboard } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "swiss-sbb-mcp", version: "1.0.0" });
    server.registerTool("connections", {
        title: "Connections",
        description: "Connections between stations.",
        inputSchema: z.object({ from: z.string().describe("Origin station."), to: z.string().describe("Destination station."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await connections(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stationboard", {
        title: "Stationboard",
        description: "Departures at a station.",
        inputSchema: z.object({ station: z.string().describe("Station name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stationboard(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_station", {
        title: "Find station",
        description: "Look up Swiss stations by name: station id for the stationboard tool, exact name, latitude and longitude, and how far away it is when a coordinate is given.",
        inputSchema: z.object({ query: z.string().describe("Station name, e.g. 'Zurich HB' or 'Bern'."), limit: z.number().describe("Max stations, 1-25, default 8.").optional() }),
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
    server.registerTool("geocode_address", {
        title: "Geocode address",
        description: "Geocode a Swiss address or place with the official swisstopo search service: label, coordinates, postal code, town, district and canton.",
        inputSchema: z.object({ query: z.string().describe("Address or place, e.g. 'Bahnhofstrasse 1 Zurich'."), limit: z.number().describe("Max results, 1-20, default 5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement address locally (paywall removed)
        try {
            return textError("Not yet implemented: address");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "swiss-sbb-mcp";
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
