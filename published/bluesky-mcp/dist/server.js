import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, actorPosts } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bluesky-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Bluesky actors.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("actor_posts", {
        title: "Actor posts",
        description: "Recent posts from a Bluesky handle or DID, with reply, like, repost and quote counts.",
        inputSchema: z.object({ actor: z.string().describe("Handle or DID, e.g. bsky.app."), limit: z.number().describe("Max posts.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await actorPosts(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("post_thread", {
        title: "Post thread",
        description: "One Bluesky post with its parent and nested replies walked to a chosen depth.",
        inputSchema: z.object({ uri: z.string().describe("Post at-uri."), depth: z.number().describe("How many reply levels, 1 to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement thread locally (paywall removed)
        try {
            return textError("Not yet implemented: thread");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("post_quotes", {
        title: "Post quotes",
        description: "Posts that quote a given Bluesky post, newest first.",
        inputSchema: z.object({ uri: z.string().describe("Post at-uri."), limit: z.number().describe("Max quotes.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement quotes locally (paywall removed)
        try {
            return textError("Not yet implemented: quotes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bluesky-mcp";
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
