import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchBooks, getVolume, isbnLookup, authorWorks } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "google-books-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_books", {
        title: "Search books",
        description: "Search Google Books volumes by title or author.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. Dune Herbert."),
            limit: z.string().describe("Max results (default 10, max 40).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchBooks(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_volume", {
        title: "Get volume",
        description: "One volume by id, with description and ISBNs.",
        inputSchema: z.object({
            volume_id: z.string().describe("Google Books volume ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ volume_id }) => {
        try {
            return text(await getVolume(volume_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("isbn_lookup", {
        title: "ISBN lookup",
        description: "Check an ISBN-10 or ISBN-13 checksum, then read the Open Library edition record: title, authors, publisher, date, pages, classification and subjects.",
        inputSchema: z.object({
            isbn: z.string().describe("ISBN-10 or ISBN-13, digits only is fine, e.g. 9780140449136"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await isbnLookup(args.isbn));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("author_works", {
        title: "Author works",
        description: "An author's bibliography from Open Library with first publication year, edition count and reader rating for each title, plus the best rated on the page.",
        inputSchema: z.object({
            author: z.string().describe("Author name, e.g. Ursula Le Guin"),
            limit: z.number().int().min(1).max(25).default(10).describe("How many titles to print (default 10, max 25)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await authorWorks(args.author, args.limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "google-books-mcp";
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
