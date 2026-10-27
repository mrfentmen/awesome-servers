import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { suggest } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "google-autocomplete-mcp", version: "1.0.0" });
    server.registerTool("suggest", {
        title: "Suggest",
        description: "Search suggestions for a query.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await suggest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("youtube_suggest", {
        title: "YouTube suggestions",
        description: "Autocomplete suggestions drawn from YouTube search rather than Google web search.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().int().min(1).max(20).default(10).describe("Max suggestions.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement suggest locally (paywall removed)
        try {
            return textError("Not yet implemented: suggest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("localized_suggest", {
        title: "Localized suggestions",
        description: "Autocomplete suggestions for a query as Google sees them in another language or country, e.g. hl \"de\" or gl \"fr\".",
        inputSchema: z.object({ query: z.string().describe("Search terms."), language: z.string().max(8).describe("Interface language code, e.g. \"de\".").optional(), country: z.string().max(4).describe("Two letter country code, e.g. \"fr\".").optional(), limit: z.number().int().min(1).max(20).default(10).describe("Max suggestions.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement suggest locally (paywall removed)
        try {
            return textError("Not yet implemented: suggest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "google-autocomplete-mcp";
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
