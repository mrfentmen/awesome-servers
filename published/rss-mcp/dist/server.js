import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFeed, feedJson } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'rss-mcp', version: '1.0.0' });
    server.registerTool('readFeed', {
        title: "Read Feed",
        description: 'Fetch and parse any RSS or Atom feed directly.',
        inputSchema: z.object({ url: z.string().describe('Feed URL.').optional(), limit: z.number().describe('Max entries.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await readFeed(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('feedJson', {
        title: "Feed Json",
        description: 'Convert any RSS feed to JSON via rss2json.',
        inputSchema: z.object({ url: z.string().describe('Feed URL.').optional(), limit: z.number().describe('Max entries.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await feedJson(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_feed", {
        title: "Search feed",
        description: "Find items inside an RSS feed by word or phrase, which is how you pull one story out of a busy site instead of reading the whole feed.",
        inputSchema: z.object({ url: z.string().describe("Feed url."), query: z.string().describe("Word or phrase to look for."), limit: z.number().describe("Max matches.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement feed locally (paywall removed)
        try {
            return textError("Not yet implemented: feed");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("feed_info", {
        title: "Feed info",
        description: "A feed's own channel metadata: title, description, site link, image and item count, which reading its items does not show.",
        inputSchema: z.object({ url: z.string().describe("Feed url."), }),
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
    const serverName = "rss-mcp";
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
