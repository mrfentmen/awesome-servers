import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addon, search, categoryCatalog } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "firefox-addons-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Firefox add-ons.",
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
    server.registerTool("addon", {
        title: "Addon",
        description: "Details for one add-on.",
        inputSchema: z.object({ slug: z.string().describe("Add-on slug like ublock-origin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await addon(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("version_history", {
        title: "Version history",
        description: "The release history behind a Firefox add-on: how many versions AMO lists, how many are on the listed channel, which licences appear across the history, the first and most recent file dates, the median gap between releases and the current compatibility window.",
        inputSchema: z.object({ slug: z.string().describe("Add-on slug like ublock-origin."), limit: z.number().describe("Versions to list, 1-20.").optional() }),
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
    server.registerTool("category_catalog", {
        title: "Category catalog",
        description: "The Firefox add-on catalogue's own taxonomy: every category AMO files add-ons under, its type, weight and purpose, and which categories are the miscellaneous bucket.",
        inputSchema: z.object({ limit: z.number().describe("Categories to list, 1-40.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await categoryCatalog(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("addon_manifest", {
        title: "Addon manifest",
        description: "The add-on record in full: GUID, publication status, dates, authors, how many locales it is translated into, tags, privacy policy and EULA flags, promotion placements, preview count and the rating breakdown.",
        inputSchema: z.object({ slug: z.string().describe("Add-on slug like ublock-origin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement manifest locally (paywall removed)
        try {
            return textError("Not yet implemented: manifest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "firefox-addons-mcp";
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
