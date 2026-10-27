import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTotals, getHits, getBreakdown, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "goatcounter-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_totals", {
        title: "Get totals",
        description: "GoatCounter total pageviews for a date range.",
        inputSchema: z.object({
            start: z.string().optional().describe("Start datetime"),
            end: z.string().optional().describe("End datetime"),
        }),
        annotations: READ_ONLY,
    }, async ({ start, end }) => {
        try {
            return text(await getTotals(start, end));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_hits", {
        title: "Get hits",
        description: "GoatCounter per-path pageviews with pagination.",
        inputSchema: z.object({
            limit: z.number().default(20).describe("How many paths"),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await getHits(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_breakdown", {
        title: "Get breakdown",
        description: "GoatCounter browser/system/location/language stats.",
        inputSchema: z.object({
            page: z.string().describe("One of browsers, systems, locations, languages, sizes, campaigns, toprefs"),
        }),
        annotations: READ_ONLY,
    }, async ({ page }) => {
        try {
            return text(await getBreakdown(page));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "goatcounter-mcp";
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
