import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchStops, getDepartures, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bkk-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_stops", {
        title: "Search nearby stops",
        description: "BKK stops near coordinates with ids, names and routes.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await searchStops(lat, lon));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_departures", {
        title: "Get departures",
        description: "Live BKK arrivals and departures for a stop with delays and trip headsigns.",
        inputSchema: z.object({
            stopId: z.string().describe("Stop id from search_stops"),
            minutesAfter: z.number().default(30).describe("Look-ahead minutes"),
        }),
        annotations: READ_ONLY,
    }, async ({ stopId, minutesAfter }) => {
        try {
            return text(await getDepartures(stopId, minutesAfter));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bkk-mcp";
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
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
