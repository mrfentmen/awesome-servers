import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { connections, stations, trainStops } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "irail-mcp", version: "1.0.0" });
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
    server.registerTool("live_board", {
        title: "Live board",
        description: "Live departure board for a station: scheduled and delayed times, train number, destination, platform, cancellation and occupancy level.",
        inputSchema: z.object({ station: z.string().describe("Station name or id, e.g. 'Brussels-Central'."), limit: z.number().describe("Max departures.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement board locally (paywall removed)
        try {
            return textError("Not yet implemented: board");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_disruptions", {
        title: "Network disruptions",
        description: "Current planned and unplanned works and disruptions across the whole Belgian rail network, with Infrabel's own description.",
        inputSchema: z.object({ limit: z.number().describe("Max disruptions.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement disruptions locally (paywall removed)
        try {
            return textError("Not yet implemented: disruptions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("train_stops", {
        title: "Train stops",
        description: "Every remaining stop of one train: time, delay, platform, occupancy level and whether it has already departed. Takes a vehicle id from the live_board or connections output.",
        inputSchema: z.object({ id: z.string().describe("Vehicle id, e.g. 'BE.NMBS.IC3433'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await trainStops(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "irail-mcp";
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
    return server;
}
