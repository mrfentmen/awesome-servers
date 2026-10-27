import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchAssets, getAsset, getConfigure } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "godot-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_assets", {
        title: "Search assets",
        description: "Search the Godot Asset Library. No key needed.",
        inputSchema: z.object({
            filter: z.string().describe("Search text.").optional(),
            godot_version: z.string().describe("e.g. 4.3 (default lists 2.1-era assets).").optional(),
            type: z.string().describe("addon or project.").optional(),
            category: z.string().describe("Category ID (see get_configure).").optional(),
            max_results: z.string().describe("1-500.").optional(),
            sort: z.string().describe("rating, cost, name or updated.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ filter, godot_version, type, category, max_results, sort }) => {
        try {
            return text(await searchAssets(filter, godot_version, type, category, max_results, sort));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_asset", {
        title: "Get asset",
        description: "Asset metadata and download URLs by ID.",
        inputSchema: z.object({
            asset_id: z.string().describe("Numeric asset ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ asset_id }) => {
        try {
            return text(await getAsset(asset_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_configure", {
        title: "Configure",
        description: "Categories and login URL info.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getConfigure());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("asset_categories", {
        title: "Asset categories",
        description: "Godot asset library categories with the ids that search_assets filters on, read from the library's own configure endpoint.",
        inputSchema: z.object({}),
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
    server.registerTool("browse_assets", {
        title: "Browse assets",
        description: "Browse the Godot asset library by sort order (recent, popular, rating, downloads) and by licence (free, open_source, proprietary), which the plain search filters do not expose.",
        inputSchema: z.object({ sort: z.string().describe("recent, popular, rating or downloads.").optional(), license: z.string().describe("free, open_source or proprietary.").optional(), maxResults: z.number().describe("How many assets.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement assets locally (paywall removed)
        try {
            return textError("Not yet implemented: assets");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "godot-mcp";
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
