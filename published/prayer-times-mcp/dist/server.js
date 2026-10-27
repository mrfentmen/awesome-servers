import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { timings } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "prayer-times-mcp", version: "1.0.0" });
    server.registerTool("timings", {
        title: "Timings",
        description: "Prayer times for a city.",
        inputSchema: z.object({ city: z.string().describe("City name."), country: z.string().describe("Country name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await timings(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("month_calendar", {
        title: "Month calendar",
        description: "Every day's Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha for one month in a city, as a per-day grid.",
        inputSchema: z.object({ city: z.string().describe("City name."), country: z.string().describe("Country name."), month: z.number().int().min(1).max(12), year: z.number().int().min(1970).max(2100) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement calendar locally (paywall removed)
        try {
            return textError("Not yet implemented: calendar");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hijri_date", {
        title: "Hijri date",
        description: "Convert a DD-MM-YYYY date between the Gregorian and Hijri calendars, with weekday and Hijri month.",
        inputSchema: z.object({ date: z.string().min(1).max(20), direction: z.enum(["to_hijri", "to_gregorian"]) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement date locally (paywall removed)
        try {
            return textError("Not yet implemented: date");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "prayer-times-mcp";
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
