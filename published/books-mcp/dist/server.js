import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bookInfo, searchBooks } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "books-mcp", version: "1.0.0" });
    server.registerTool("search_books", {
        title: "Search books",
        description: "Search for books by title or author.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchBooks(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("book_info", {
        title: "Book info",
        description: "Get details for a specific book volume.",
        inputSchema: z.object({ volumeId: z.string().describe("Google Books volume ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bookInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("isbn_lookup", {
        title: "Isbn lookup",
        description: "Resolve an ISBN-10 or ISBN-13 against Open Library: title, publish date, publishers, page count, language, subjects and first sentence.",
        inputSchema: z.object({ isbn: z.string().describe("ISBN-10 or ISBN-13, digits only or with hyphens.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("author_works", {
        title: "Author works",
        description: "List an author's works and descriptions from Open Library, matched by author name.",
        inputSchema: z.object({ author: z.string().describe("Author name, for example Ursula K. Le Guin."), limit: z.number().describe("Max works, 1-50, default 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement works locally (paywall removed)
        try {
            return textError("Not yet implemented: works");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "books-mcp";
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
