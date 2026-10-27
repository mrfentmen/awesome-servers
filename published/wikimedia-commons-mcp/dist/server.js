import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_file, m0_search, m1_random, categoryFiles } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'wikimedia-commons-mcp', version: '1.0.0' });
    server.registerTool("search", {
        title: "Search",
        description: "Search Commons files by text.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("file", {
        title: "File",
        description: "Details for one Commons file.",
        inputSchema: z.object({ title: z.string().describe("File title.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_file(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random", {
        title: "Random",
        description: "Random image files from Commons.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_random(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("file_categories", {
        title: "File categories",
        description: "The Wikimedia Commons categories a file sits in, which is how Commons media gets browsed.",
        inputSchema: z.object({ title: z.string().describe("File title like File:Example.jpg."), limit: z.number().describe("Max categories.").optional() }),
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
    server.registerTool("file_thumbnail", {
        title: "File thumbnail",
        description: "The thumbnail URL for a Commons file at a chosen pixel width, alongside the original's dimensions and MIME type.",
        inputSchema: z.object({ title: z.string().describe("File title like File:Example.jpg."), width: z.number().describe("Thumbnail width in pixels, 20 to 2000.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement thumbnail locally (paywall removed)
        try {
            return textError("Not yet implemented: thumbnail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("category_files", {
        title: "Category files",
        description: "List the media files and subcategories inside a Wikimedia Commons category.",
        inputSchema: z.object({ category: z.string().describe("Category name, e.g. Featured pictures of animals."), limit: z.number().describe("Max members.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await categoryFiles(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wikimedia-commons-mcp";
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
