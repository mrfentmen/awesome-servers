import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { summary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "noaa-ncei-mcp", version: "1.0.0" });
    server.registerTool("summary", {
        title: "Summary",
        description: "Daily summary for a station and date range.",
        inputSchema: z.object({ station: z.string().describe("Station id like USW00013739."), start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await summary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("station_info", {
        title: "Station info",
        description: "Name, position and elevation of a NOAA station, plus which daily-summaries fields it reported on a given day.",
        inputSchema: z.object({ station: z.string().describe("Station id like USW00013739."), date: z.string().max(10).describe("Date to check, YYYY-MM-DD. Defaults to 2024-01-01.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("monthly_climate", {
        title: "Monthly climate",
        description: "NOAA monthly climate summaries for a station: mean and extreme temperatures, total precipitation and snowfall, mean wind and the raw daily-count fields.",
        inputSchema: z.object({ station: z.string().describe("Station id like USW00013739."), start: z.string().max(10).describe("Start month YYYY-MM-DD.").optional(), end: z.string().max(10).describe("End month YYYY-MM-DD.").optional(), limit: z.number().int().min(1).max(60).default(12) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement climate locally (paywall removed)
        try {
            return textError("Not yet implemented: climate");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "noaa-ncei-mcp";
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
