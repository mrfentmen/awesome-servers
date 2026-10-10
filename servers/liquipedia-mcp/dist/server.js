import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchPages, getPage, getRecentChanges, getCategoryMembers, getBacklinks } from "./api.js";
import { premiumTool } from "./gateway.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
        }
    });
    server.registerTool("wiki_search", {
        title: "Wiki search",
        description: "Full-text search a Liquipedia wiki through its own MediaWiki search index, across every game wiki it hosts, which the rendered-page tools cannot do.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), host: z.string().describe("Wiki host, e.g. dota2, lol, cs, overwatch or commons.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: wiki_search ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_liquipedia_wiki_search", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("page_info", {
        title: "Page info",
        description: "A Liquipedia page's metadata and last revision from the api: page id, revision author and timestamp, edit summary and byte size.",
        inputSchema: z.object({ title: z.string().describe("Page title, e.g. Dota 2."), host: z.string().describe("Wiki host, e.g. dota2 or commons.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: page_info ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_liquipedia_page_info", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
