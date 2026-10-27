import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dateDiff, fromTimestamp, now } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "time-tools-mcp", version: "1.0.0" });
    server.registerTool("now", {
        title: "Now",
        description: "Current time in several formats.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await now(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("from_timestamp", {
        title: "From timestamp",
        description: "Convert a unix timestamp to a date.",
        inputSchema: z.object({ timestamp: z.number().describe("Unix seconds.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fromTimestamp(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("date_diff", {
        title: "Date diff",
        description: "Days between two dates.",
        inputSchema: z.object({ start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dateDiff(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("week_info", {
        title: "Week info",
        description: "The calendar facts about one date: ISO 8601 week number and week year, day of year, days left in the year, quarter and weekday. Pure computation, no network.",
        inputSchema: z.object({ date: z.string().describe("A date as YYYY-MM-DD, or a unix timestamp in seconds. Omit for today.").optional() }),
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
    server.registerTool("add_duration", {
        title: "Add duration",
        description: "Add an ISO 8601 duration to a date or timestamp, with the calendar parts applied before the fixed width ones so month lengths are respected. Pure computation, no network.",
        inputSchema: z.object({ start: z.string().describe("A date as YYYY-MM-DD, or a unix timestamp in seconds."), duration: z.string().describe("An ISO 8601 duration, like P1M, P2W, PT90M, P1Y2M3DT4H5M6S.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement duration locally (paywall removed)
        try {
            return textError("Not yet implemented: duration");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "time-tools-mcp";
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
