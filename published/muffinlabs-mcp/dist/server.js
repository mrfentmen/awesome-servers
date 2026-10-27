import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { day } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "muffinlabs-mcp", version: "1.0.0" });
    server.registerTool("day", {
        title: "Day",
        description: "Events for a date.",
        inputSchema: z.object({ month: z.number().describe("Month.").optional(), day: z.number().describe("Day.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await day(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("most_read_articles", {
        title: "Most read articles",
        description: "The Wikipedia articles that were most read on a given day, with rank, view count, description and a short extract.",
        inputSchema: z.object({
            date: z.string().describe("Date as YYYY/MM/DD. Defaults to today (UTC).").optional(),
            limit: z.number().describe("Max articles, 1-25, default 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement articles locally (paywall removed)
        try {
            return textError("Not yet implemented: articles");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lookup_wikidata_item", {
        title: "Look up a Wikidata item",
        description: "Search Wikidata for a person, place, event or work and get its item id, label and short description.",
        inputSchema: z.object({
            query: z.string().describe("Name to search Wikidata for."),
            limit: z.number().describe("Max results, 1-20, default 5.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement item locally (paywall removed)
        try {
            return textError("Not yet implemented: item");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "muffinlabs-mcp";
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
