import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVersion, searchItems, getItem, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "docspell-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_version", {
        title: "Server version",
        description: "Docspell server version info. Public, no auth needed.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getVersion());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_items", {
        title: "Search items",
        description: "Full-text document search (requires DOCSPELL_AUTH_TOKEN).",
        inputSchema: z.object({
            query: z.string().describe("Search query, e.g. tag:invoice year:2025.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchItems(query));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_item", {
        title: "Get item",
        description: "Document item details by ID (requires DOCSPELL_AUTH_TOKEN).",
        inputSchema: z.object({
            item_id: z.string().describe("Docspell item ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ item_id }) => {
        try {
            return text(await getItem(item_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "docspell-mcp";
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
