import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_pluginInfo, m0_searchPlugins, m1_search } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'wordpress-mcp', version: '1.0.0' });
    server.registerTool("plugin_info", {
        title: "Plugin info",
        description: "Get details for a WordPress plugin.",
        inputSchema: z.object({ slug: z.string().describe("Plugin slug.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_pluginInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_plugins", {
        title: "Search plugins",
        description: "Search plugins.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_searchPlugins(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search WordPress themes.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("theme_info", {
        title: "Theme info",
        description: "One wordpress.org theme's record: version, author, rating, active installs and tags, which the plugin tools cannot fetch.",
        inputSchema: z.object({ slug: z.string().describe("Theme slug, e.g. twentytwentyfour."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: theme_info ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_wordpress_theme_info", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("theme_list", {
        title: "Theme list",
        description: "Browse the wordpress.org theme directory by search term, with each theme's rating and active install count, which no existing tool does.",
        inputSchema: z.object({ query: z.string().describe("Search term, e.g. blog.").optional(), limit: z.number().describe("Max themes.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: theme_list ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_wordpress_theme_list", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("core_releases", {
        title: "Core releases",
        description: "List official WordPress core update offers with release downloads and minimum PHP and MySQL versions.",
        inputSchema: z.object({ limit: z.number().describe("Maximum offers, 1-30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: core_releases ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_wordpress_core_releases", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
