import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sunTimes } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "sunrise-sunset-mcp", version: "1.0.0" });
    server.registerTool("sun_times", {
        title: "Sun times",
        description: "Get sunrise and sunset times for a location and date.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("Date in YYYY-MM-DD format.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sunTimes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("twilight_phases", {
        title: "Twilight phases",
        description: "Civil, nautical and astronomical twilight for a location and date, with solar noon and day length.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().max(20).describe("Date in YYYY-MM-DD format or today.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement phases locally (paywall removed)
        try {
            return textError("Not yet implemented: phases");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("daylight_trend", {
        title: "Daylight trend",
        description: "Sample day length, sunrise and sunset across a whole year at a location, and report the shortest and longest day.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), year: z.number().int().min(1970).max(2200).optional(), steps: z.number().int().min(4).max(12).default(8).describe("How many days to sample.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement trend locally (paywall removed)
        try {
            return textError("Not yet implemented: trend");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "sunrise-sunset-mcp";
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
