import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { article, articles, reports } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "spaceflight-news-mcp", version: "1.0.0" });
    server.registerTool("articles", {
        title: "Articles",
        description: "Latest space news articles.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional(), search: z.string().describe("Optional search terms.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await articles(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("article", {
        title: "Article",
        description: "One article by ID.",
        inputSchema: z.object({ id: z.number().describe("Article ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await article(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("blogs", {
        title: "Blogs",
        description: "Blog posts from the spaceflight news API, a separate catalogue from the news articles, newest first, with the live catalogue size.",
        inputSchema: z.object({ limit: z.number().describe("How many posts, 1-25. Defaults to 10.").optional(), search: z.string().describe("Optional search text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement blogs locally (paywall removed)
        try {
            return textError("Not yet implemented: blogs");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reports", {
        title: "Reports",
        description: "Reports from the spaceflight news API, its third catalogue, newest first, with the live catalogue size.",
        inputSchema: z.object({ limit: z.number().describe("How many reports, 1-25. Defaults to 10.").optional(), search: z.string().describe("Optional search text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reports(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "spaceflight-news-mcp";
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
