import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SegaError, categoryMembers, getPage, pageMetadata, recentChanges, searchPages, wikiTextToPlain } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "segaretro-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_pages", {
        title: "Search pages",
        description: "Search Sega Retro — every Sega game, console, and unreleased hardware.",
        inputSchema: z.object({ query: z.string().describe("Search terms, e.g. 'Sonic the Hedgehog' or 'Dreamcast'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const pages = await searchPages(query);
            if (pages.length === 0)
                return text(`No Sega Retro pages match "${query}".`);
            return text(`Sega Retro results for "${query}":\n\n` +
                pages
                    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.snippet ?? ""}\n   https://segaretro.org/${encodeURIComponent(p.title).replace(/%2F/g, "/")}`)
                    .join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_page", {
        title: "Get page",
        description: "Get a page's content as readable text.",
        inputSchema: z.object({
            title: z.string().describe("Exact page title from search_pages"),
            maxChars: z.number().int().min(500).max(30000).default(12000),
        }),
        annotations: READ_ONLY,
    }, async ({ title, maxChars }) => {
        try {
            const page = await getPage(title);
            if (!page)
                return text(`No Sega Retro page "${title}".`);
            const plain = wikiTextToPlain(page.wikitext, maxChars);
            return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_category", {
        title: "List category",
        description: "List pages in a Sega Retro category (e.g. 'Category:Games', 'Category:Consoles').",
        inputSchema: z.object({ category: z.string().describe("Category name, e.g. 'Category:Games'") }),
        annotations: READ_ONLY,
    }, async ({ category }) => {
        try {
            const members = await categoryMembers(category);
            if (members.length === 0)
                return text(`Empty or missing category "${category}".`);
            return text(`Pages in ${category}:\n` + members.map((m, i) => `${i + 1}. ${m}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_changes", {
        title: "Recent changes",
        description: "The newest edits and new articles on Sega Retro, with the editor, timestamp and edit comment.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentChanges(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_metadata", {
        title: "Page metadata",
        description: "Dated metadata for one Sega Retro page: canonical URL, page id, byte length, last editor and the categories the page is filed under.",
        inputSchema: z.object({
            title: z.string().describe("Exact page title from search_pages"),
            categoryLimit: z.number().int().min(1).max(60).default(20),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageMetadata(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "segaretro-mcp";
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
function errorMessage(e) {
    if (e instanceof SegaError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
