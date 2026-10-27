import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatArticle, getArticle, LostMediaError, randomArticle, searchArticles } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "lostmedia-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_lost_media", {
        title: "Search lost media",
        description: "Search the Lost Media Wiki: lost TV episodes, films, music, games, pilots, commercials.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'Doctor Who', 'lost cartoon pilot', 'unreleased album'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchArticles(query, limit);
            if (results.length === 0)
                return text(`No Lost Media Wiki articles match "${query}".`);
            return text(`Lost Media Wiki results for "${query}":\n\n${results.map((h, i) => `${i + 1}. ${h.title}${h.snippet ? ` — ${h.snippet.slice(0, 140)}` : ""}`).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_article", {
        title: "Get article",
        description: "Get a Lost Media Wiki article: what it is, found/partially-found/lost status, recovery story.",
        inputSchema: z.object({
            title: z.string().describe("Exact article title (use search_lost_media to find it)"),
        }),
        annotations: READ_ONLY,
    }, async ({ title }) => {
        try {
            const a = await getArticle(title);
            if (!a)
                return text(`No Lost Media Wiki article titled "${title}".`);
            return text(formatArticle(a));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_article", {
        title: "Random article",
        description: "Open a random Lost Media Wiki article. Great for falling down the lost-media rabbit hole.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const { title } = await randomArticle();
            const a = await getArticle(title);
            if (!a)
                return text(`Random pick: ${title}`);
            return text(formatArticle(a));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_changes", {
        title: "Recent changes",
        description: "The newest edits to Lost Media Wiki articles, with editor, timestamp, byte size change and edit summary.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(10) }),
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
    server.registerTool("browse_categories", {
        title: "Browse categories",
        description: "List Lost Media Wiki categories whose name starts with a prefix, to explore how lost media is organised.",
        inputSchema: z.object({
            prefix: z.string().describe("Category name prefix, e.g. \"Lost\" or \"Lost films\""),
            limit: z.number().int().min(1).max(50).default(25),
        }),
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
    server.registerTool("category_articles", {
        title: "Category articles",
        description: "List members of a Lost Media Wiki category, with page IDs and namespaces, to find articles and subcategories.",
        inputSchema: z.object({ category: z.string().min(1).max(200).describe("Category name, e.g. Lost films."), limit: z.number().int().min(1).max(30).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement articles locally (paywall removed)
        try {
            return textError("Not yet implemented: articles");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lostmedia-mcp";
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
    if (e instanceof LostMediaError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
