import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, pageSections } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "wikibooks-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Wikibooks titles.",
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
    server.registerTool("book", {
        title: "Book",
        description: "Full plain text of a Wikibooks page, from a title found with search.",
        inputSchema: z.object({ title: z.string().describe("Exact Wikibooks page title.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement book locally (paywall removed)
        try {
            return textError("Not yet implemented: book");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("browse_categories", {
        title: "Browse categories",
        description: "List Wikibooks categories whose name starts with a prefix, to find a shelf or subject.",
        inputSchema: z.object({ prefix: z.string().describe("Category name prefix, e.g. \"Cook\"."), limit: z.number().int().min(1).max(50).default(20).describe("Max categories.") }),
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
    server.registerTool("page_history", {
        title: "Page revision history",
        description: "Recent revisions with timestamps, editors and edit comments.",
        inputSchema: z.object({ title: z.string().describe("Exact page title, e.g. Python Programming."), limit: z.number().describe("Maximum revisions, 1-30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_sections", {
        title: "Page sections",
        description: "Table of contents headings and anchors for a Wikibooks page.",
        inputSchema: z.object({ title: z.string().describe("Exact page title, e.g. Python Programming."), limit: z.number().describe("Maximum headings, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageSections(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("category_members", {
        title: "Category members",
        description: "Pages and subcategories inside a named Wikibooks category.",
        inputSchema: z.object({ category: z.string().describe("Category name, e.g. Subject:Computer science."), limit: z.number().describe("Maximum members, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement members locally (paywall removed)
        try {
            return textError("Not yet implemented: members");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wikibooks-mcp";
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
    return server;
}
