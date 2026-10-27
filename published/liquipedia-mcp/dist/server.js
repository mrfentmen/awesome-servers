import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPages, getPage, getRecentChanges, getCategoryMembers, getBacklinks } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "liquipedia-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_pages", {
        title: "Search wiki pages",
        description: "Search a Liquipedia game wiki for pages: players, teams, tournaments.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            wiki: z.string().default("counterstrike").describe("Wiki: counterstrike, dota2, leagueoflegends, valorant, starcraft2, overwatch, rocketleague, ..."),
            limit: z.number().default(5).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, wiki, limit }) => {
        try {
            return text(await searchPages(query, wiki, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_page", {
        title: "Read wiki page",
        description: "Read a Liquipedia page as plain text: player bios, team rosters, tournament results.",
        inputSchema: z.object({
            title: z.string().describe("Page title"),
            wiki: z.string().default("counterstrike").describe("Game wiki"),
        }),
        annotations: READ_ONLY,
    }, async ({ title, wiki }) => {
        try {
            return text(await getPage(title, wiki));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_recent_changes", {
        title: "Get recent changes",
        description: "Recent edits on a Liquipedia wiki: roster moves, results updates.",
        inputSchema: z.object({
            wiki: z.string().default("counterstrike").describe("Game wiki"),
            limit: z.number().default(10).describe("How many changes"),
        }),
        annotations: READ_ONLY,
    }, async ({ wiki, limit }) => {
        try {
            return text(await getRecentChanges(wiki, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_category_members", {
        title: "List category members",
        description: "List pages in a Liquipedia category, e.g. tournament or team categories.",
        inputSchema: z.object({
            category: z.string().describe("Category without prefix"),
            wiki: z.string().default("counterstrike").describe("Game wiki"),
            limit: z.number().default(20).describe("How many members"),
        }),
        annotations: READ_ONLY,
    }, async ({ category, wiki, limit }) => {
        try {
            return text(await getCategoryMembers(category, wiki, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_backlinks", {
        title: "Get page backlinks",
        description: "Pages linking to a Liquipedia page: related players, teams, events.",
        inputSchema: z.object({
            title: z.string().describe("Page title"),
            wiki: z.string().default("counterstrike").describe("Game wiki"),
            limit: z.number().default(20).describe("How many links"),
        }),
        annotations: READ_ONLY,
    }, async ({ title, wiki, limit }) => {
        try {
            return text(await getBacklinks(title, wiki, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wiki_search", {
        title: "Wiki search",
        description: "Full-text search a Liquipedia wiki through its own MediaWiki search index, across every game wiki it hosts, which the rendered-page tools cannot do.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), host: z.string().describe("Wiki host, e.g. dota2, lol, cs, overwatch or commons.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_info", {
        title: "Page info",
        description: "A Liquipedia page's metadata and last revision from the api: page id, revision author and timestamp, edit summary and byte size.",
        inputSchema: z.object({ title: z.string().describe("Page title, e.g. Dota 2."), host: z.string().describe("Wiki host, e.g. dota2 or commons.").optional() }),
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
    const serverName = "liquipedia-mcp";
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
    return server;
}
