import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TetrisError, getPage, searchPages, wikiTextToPlain } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "tetriswiki-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_pages", {
        title: "Search pages",
        description: "Search the Tetris wiki for games, pieces, and techniques.",
        inputSchema: z.object({ query: z.string().describe("Search terms, e.g. 'T-spin' or 'Tetris Attack'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const pages = await searchPages(query);
            if (pages.length === 0)
                return text(`No Tetris wiki pages match "${query}".`);
            return text(`Tetris wiki results for "${query}":\n\n` +
                pages
                    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.snippet ?? ""}\n   https://tetris.wiki/${encodeURIComponent(p.title).replace(/%2F/g, "/")}`)
                    .join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_page", {
        title: "Get page",
        description: "Read a Tetris wiki page as plain text.",
        inputSchema: z.object({
            title: z.string().describe("Exact page title from search_pages"),
            maxChars: z.number().int().min(500).max(30000).default(12000),
        }),
        annotations: READ_ONLY,
    }, async ({ title, maxChars }) => {
        try {
            const page = await getPage(title);
            if (!page)
                return text(`No Tetris wiki page "${title}".`);
            const plain = wikiTextToPlain(page.wikitext, maxChars);
            return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_history", {
        title: "Page history",
        description: "Revision history for one Tetris wiki page: revision id, timestamp, editor, byte size, minor flag and edit summary.",
        inputSchema: z.object({ title: z.string().describe("Exact page title from search_pages"), limit: z.number().int().min(1).max(50).default(10) }),
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
    server.registerTool("browse_category", {
        title: "Browse category",
        description: "List the pages in a Tetris wiki category such as Category:Pieces or Category:Games, with each page's url.",
        inputSchema: z.object({ category: z.string().describe("Category name, with or without the Category: prefix"), limit: z.number().int().min(1).max(100).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement category locally (paywall removed)
        try {
            return textError("Not yet implemented: category");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_changes", {
        title: "Recent changes",
        description: "The most recent edits anywhere in the Tetris wiki's article namespace: which page changed, when, by whom, by how many bytes and with what edit summary, plus the spread of editors. page_history reads one named page's whole revision list instead.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(100).optional().describe("How many recent edits to read. Default 20.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement changes locally (paywall removed)
        try {
            return textError("Not yet implemented: changes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_outlinks", {
        title: "Page outlinks",
        description: "The pages one Tetris wiki article points at, split into article links and namespace links, with the templates the article is built from and a link for each page. get_page returns the article text and browse_category lists a category's members; neither shows what an article links out to.",
        inputSchema: z.object({ title: z.string().describe("Exact page title, e.g. 'T-Spin'."), limit: z.number().int().min(1).max(200).optional().describe("Max links to list, 1-200. Default 40.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement outlinks locally (paywall removed)
        try {
            return textError("Not yet implemented: outlinks");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "tetriswiki-mcp";
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
function errorMessage(e) {
    if (e instanceof TetrisError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
