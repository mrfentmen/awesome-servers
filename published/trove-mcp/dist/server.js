import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatRecord, searchRecords, TroveError, catalogueSearch, authorSearch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "trove-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_records", {
        title: "Search Trove",
        description: "Australian books, newspapers, images, music and more by keyword.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'ned kelly', 'sydney harbour'"),
            category: z.string().default("all").describe("Category like 'book', 'newspaper', 'image', empty/all = all"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, category, limit }) => {
        try {
            const rows = await searchRecords(query, category, limit);
            if (rows.length === 0)
                return text(`Nothing found for "${query}".`);
            return text(rows.map((r, i) => formatRecord(r, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("catalogue_search", {
        title: "Search the book catalogue",
        description: "Search Open Library's catalogue of books: authors, first publication year, edition count, publishers, subjects, ISBNs, ratings and whether a copy is readable online.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'australian short stories', 'banjo paterson'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await catalogueSearch({ query, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("author_search", {
        title: "Search authors",
        description: "Search Open Library's author index: work count, best known work, subject headings, average rating and how many readers want to or have read them.",
        inputSchema: z.object({
            query: z.string().describe("Author name fragment, e.g. 'ned kelly'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await authorSearch({ query, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "trove-mcp";
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
function errorMessage(e) {
    if (e instanceof TroveError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
