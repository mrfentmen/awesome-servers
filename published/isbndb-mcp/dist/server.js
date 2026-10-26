import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBook, searchBooks, getBooksBatch, locCatalog, bookBackground } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "isbndb-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_book", {
        title: "Get book by ISBN",
        description: "ISBNdb book detail: title, authors, publisher, pages, cover.",
        inputSchema: z.object({
            isbn: z.string().describe("ISBN-10 or ISBN-13"),
        }),
        annotations: READ_ONLY,
    }, async ({ isbn }) => {
        try {
            return text(await getBook(isbn));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_books", {
        title: "Search books",
        description: "Search ISBNdb by title, author or subject with pagination.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. the great gatsby"),
            page: z.number().default(1).describe("Page number, 1 or higher"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, page }) => {
        try {
            return text(await searchBooks(query, page));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_books_batch", {
        title: "Batch lookup",
        description: "Look up several ISBNdb books in one call.",
        inputSchema: z.object({
            isbns: z.string().describe("Comma-separated ISBNs"),
        }),
        annotations: READ_ONLY,
    }, async ({ isbns }) => {
        try {
            return text(await getBooksBatch(isbns));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("loc_catalog", {
        title: "LOC catalog",
        description: "Catalog records from the Library of Congress, which publishes its bibliographic data without a key: title, contributors, date, subjects, LCCN, language and access restrictions.",
        inputSchema: z.object({ query: z.string().describe("Title, author or subject to search for"), limit: z.number().int().min(1).max(20).default(5).describe("How many records to print (default 5, max 20).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await locCatalog(args.query, args.limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("book_background", {
        title: "Book background",
        description: "The encyclopaedia summary of a book or author from Wikipedia, with revision and edit date, for the context an ISBN record never carries. No ISBNdb key needed.",
        inputSchema: z.object({ title: z.string().describe("Book title or author name, e.g. The Dispossessed") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bookBackground(args.title));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "isbndb-mcp";
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
    return server;
}
