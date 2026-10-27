import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WikiError, getPage, searchPages, wikiTextToPlain, listCategories } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "hiddenpalace-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_pages", {
        title: "Search pages",
        description: "Search hiddenpalace.org — unreleased prototypes, beta builds, and " +
            "cut content documentation.",
        inputSchema: z.object({ query: z.string().describe("Search terms, e.g. 'Super Mario 64 beta' or 'Sonic prototype'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const pages = await searchPages(query);
            if (pages.length === 0)
                return text(`No hiddenpalace pages match "${query}".`);
            return text(`hiddenpalace.org results for "${query}":\n\n` +
                pages
                    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.snippet ?? ""}\n   https://hiddenpalace.org/w/${encodeURIComponent(p.title).replace(/%2F/g, "/")}`)
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
                return text(`No hiddenpalace page "${title}".`);
            const plain = wikiTextToPlain(page.wikitext, maxChars);
            return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_changes", {
        title: "Recent changes",
        description: "The newest edits and new pages on hiddenpalace.org, with editor, timestamp and page size.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(15) }),
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
    server.registerTool("page_info", {
        title: "Page info",
        description: "Dated metadata for one hiddenpalace.org page: canonical URL, page id, byte length and who last edited it.",
        inputSchema: z.object({ title: z.string().describe("Exact page title") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_categories", {
        title: "List categories",
        description: "The categories hiddenpalace.org files its prototype documentation under.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(200).default(40) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listCategories(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("category_members", {
        title: "Category members",
        description: "Browse the pages and subcategories filed in a Hidden Palace category, with their page IDs.",
        inputSchema: z.object({ category: z.string().describe("Category title, with or without the Category: prefix."), limit: z.number().describe("Maximum members, 1-50; default 20.").optional() }),
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
    const serverName = "hiddenpalace-mcp";
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
    if (e instanceof WikiError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
