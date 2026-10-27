import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { instance, trends, accountLookup, hashtagTimeline } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mastodon-mcp", version: "1.0.0" });
    server.registerTool("instance", {
        title: "Instance",
        description: "Public info for one instance.",
        inputSchema: z.object({ domain: z.string().describe("Instance domain.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await instance(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trends", {
        title: "Trends",
        description: "Trending tags on one instance.",
        inputSchema: z.object({ domain: z.string().describe("Instance domain.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await trends(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("account_lookup", {
        title: "Account lookup",
        description: "Resolve a fediverse handle to the real account behind it on its own instance: type, join date, approval and discoverability flags, follower ratio, profile fields and custom emoji.",
        inputSchema: z.object({ acct: z.string().describe("Handle, e.g. Gargron@mastodon.social or just gargron."), instance: z.string().describe("Instance to assume when the handle has no domain, e.g. hachyderm.io").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await accountLookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hashtag_timeline", {
        title: "Hashtag timeline",
        description: "Read a hashtag timeline on one instance: who is posting under it, which languages, from which servers, how many are replies or boosts, and the post text itself.",
        inputSchema: z.object({ tag: z.string().describe("Hashtag without the #, e.g. opensource."), instance: z.string().describe("Instance domain (default mastodon.social).").optional(), limit: z.number().int().min(1).max(20).default(10).describe("Posts to read (default 10, max 20).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hashtagTimeline(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mastodon-mcp";
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
