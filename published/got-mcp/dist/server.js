import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { book, character, houses } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "got-mcp", version: "1.0.0" });
    server.registerTool("book", {
        title: "Book",
        description: "Get a book by id.",
        inputSchema: z.object({ id: z.number().describe("Book id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await book(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character", {
        title: "Character",
        description: "Get a character by id.",
        inputSchema: z.object({ id: z.number().describe("Character id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await character(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("houses", {
        title: "Houses",
        description: "List houses.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await houses(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_books", {
        title: "List books",
        description: "Page through the twelve A Song of Ice and Fire books with release date, authors, page count, isbn and publisher.",
        inputSchema: z.object({ page: z.number().describe("Page number.").optional(), limit: z.number().describe("Max books.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement books locally (paywall removed)
        try {
            return textError("Not yet implemented: books");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_characters", {
        title: "List characters",
        description: "Page through the characters of A Song of Ice and Fire with gender, culture, titles and aliases, or filter a page down to one alias.",
        inputSchema: z.object({ page: z.number().describe("Page number.").optional(), limit: z.number().describe("Max characters.").optional(), alias: z.string().describe("Find the character with this alias.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement characters locally (paywall removed)
        try {
            return textError("Not yet implemented: characters");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "got-mcp";
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
