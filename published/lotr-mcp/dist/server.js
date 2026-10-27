import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { books, chapters } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "lotr-mcp", version: "1.0.0" });
    server.registerTool("books", {
        title: "Books",
        description: "List the Lord of the Rings books.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await books(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("chapters", {
        title: "Chapters",
        description: "Chapters for a book.",
        inputSchema: z.object({ bookId: z.string().describe("Book ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await chapters(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gateway_page", {
        title: "Gateway page",
        description: "A Tolkien Gateway article rendered as plain text: characters, places, peoples, items and books of Middle-earth.",
        inputSchema: z.object({ title: z.string().max(120).describe("Tolkien Gateway page title, e.g. Gandalf."), maxChars: z.number().int().min(200).max(6000).default(1200) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement page locally (paywall removed)
        try {
            return textError("Not yet implemented: page");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gateway_categories", {
        title: "Gateway categories",
        description: "The Tolkien Gateway categories a page belongs to, which is how the wiki sorts characters by appearance, era and work.",
        inputSchema: z.object({ title: z.string().max(120).describe("Tolkien Gateway page title, e.g. Gandalf."), limit: z.number().int().min(1).max(100).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement categories locally (paywall removed)
        try {
            return textError("Not yet implemented: categories");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lotr-mcp";
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
