import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { article, search, articleVersionHistory } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "figshare-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Figshare articles.",
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
    server.registerTool("article_version_history", {
        title: "Article version history",
        description: "Every published version of a Figshare article, with version number and the api url for each version.",
        inputSchema: z.object({ id: z.number().int().describe("Figshare article id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await articleVersionHistory(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_articles", {
        title: "Recent articles",
        description: "The most recently published or modified public Figshare articles, ordered by a chosen date field, with id, doi and public url.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(10), order: z.string().default("published_date").describe("published_date, modified_date, created_date or views") }),
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
    const serverName = "figshare-mcp";
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
