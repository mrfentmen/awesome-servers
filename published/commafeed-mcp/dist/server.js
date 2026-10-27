import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFeedEntries, markEntry, listEntryTags, subscribeFeed, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "commafeed-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_feed_entries", {
        title: "Feed entries",
        description: "Entries of a subscribed feed.",
        inputSchema: z.object({
            feed_id: z.string().describe("Subscription ID."),
            read_type: z.string().describe("all or unread (default all).").optional(),
            limit: z.string().describe("Max items (default 20, max 1000).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ feed_id, read_type, limit }) => {
        try {
            return text(await getFeedEntries(feed_id, read_type, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mark_entry", {
        title: "Mark entry",
        description: "Mark a feed entry read/unread.",
        inputSchema: z.object({
            entry_id: z.string().describe("Entry ID."),
            read: z.string().describe("true or false.")
        }),
        annotations: MUTATING,
    }, async ({ entry_id, read }) => {
        try {
            return text(await markEntry(entry_id, read));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_entry_tags", {
        title: "Entry tags",
        description: "User's entry tags.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listEntryTags());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("subscribe_feed", {
        title: "Subscribe",
        description: "Subscribe to a feed URL.",
        inputSchema: z.object({
            url: z.string().describe("Feed URL.")
        }),
        annotations: MUTATING,
    }, async ({ url }) => {
        try {
            return text(await subscribeFeed(url));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "commafeed-mcp";
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
