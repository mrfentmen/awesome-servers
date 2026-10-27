import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { stations, systemInfo } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "citi-bike-mcp", version: "1.0.0" });
    server.registerTool("stations", {
        title: "Stations",
        description: "Citi Bike stations in New York.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_status", {
        title: "Network status",
        description: "Live Citi Bike availability rolled up for the whole network or one region: bikes, ebikes, free docks, capacity and which stations are actually reporting.",
        inputSchema: z.object({ region: z.string().describe("Region name or id, like NYC District or 71. Omit for the whole network.").optional(), staleHours: z.number().describe("Treat a station as offline once its report is older than this many hours, 1-24. Defaults to 1.").optional() }),
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
    server.registerTool("station_status", {
        title: "Station status",
        description: "One Citi Bike station by name, short name or id, joined to its live bike and dock counts, capacity share and report freshness.",
        inputSchema: z.object({ station: z.string().describe("Station name or part of it, short name, or station id."), limit: z.number().describe("How many matches to show, 1-25. Defaults to 5.").optional() }),
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
    server.registerTool("system_info", {
        title: "System info",
        description: "Citi Bike system metadata: operator, launch date, timezone, every region and the current pricing plans.",
        inputSchema: z.object({ plansLimit: z.number().describe("How many pricing plans to list, 1-50. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await systemInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "citi-bike-mcp";
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
