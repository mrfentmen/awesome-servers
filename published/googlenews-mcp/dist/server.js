import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "googlenews-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Google News headlines.",
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
    server.registerTool("top_stories", {
        title: "Top stories",
        description: "The Google News front page feed: the headlines Google is currently leading with, in a chosen locale.",
        inputSchema: z.object({ limit: z.number().describe("Max headlines, 1-25, default 10.").optional(), locale: z.string().describe("Locale like en-US or en-GB. Defaults to en-US.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stories locally (paywall removed)
        try {
            return textError("Not yet implemented: stories");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("topic_headlines", {
        title: "Topic headlines",
        description: "Headlines from one Google News topic section: WORLD, NATION, BUSINESS, TECHNOLOGY, ENTERTAINMENT, SPORTS, SCIENCE or HEALTH.",
        inputSchema: z.object({ topic: z.string().describe("Topic name, for example SCIENCE or TECHNOLOGY."), limit: z.number().describe("Max headlines, 1-25, default 10.").optional(), locale: z.string().describe("Locale like en-US. Defaults to en-US.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement headlines locally (paywall removed)
        try {
            return textError("Not yet implemented: headlines");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "googlenews-mcp";
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
