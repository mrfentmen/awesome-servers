import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatGuild, formatItem, formatPlayer, getGuild, getPlayer, searchItems, WynncraftError, mapLocations } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "wynncraft-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_player", {
        title: "Get player profile",
        description: "Get a Wynncraft player profile: rank, online status, guild, playtime, characters.",
        inputSchema: z.object({
            name: z.string().describe("Minecraft username, e.g. 'Salted'"),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(formatPlayer(await getPlayer(name)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_guild", {
        title: "Get guild info",
        description: "Get a Wynncraft guild: level, territories, wars, member counts by rank.",
        inputSchema: z.object({
            name: z.string().describe("Guild name, e.g. 'Wynncraft'"),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(formatGuild(await getGuild(name)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_items", {
        title: "Search items",
        description: "Search the Wynncraft item database by name: weapons, armour, accessories with tier and level requirement.",
        inputSchema: z.object({
            query: z.string().describe("Item name to search, e.g. 'discoverer'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchItems(query, limit);
            if (results.length === 0)
                return text(`No Wynncraft items match "${query}".`);
            return text(`Wynncraft items for "${query}":\n\n${results.map((it, i) => formatItem(it, i)).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("item_build", {
        title: "Item build stats",
        description: "Build data for Wynncraft items matching a name: level and class requirements, stat requirements and identifications, elements, powder slots, emblem and average DPS.",
        inputSchema: z.object({
            query: z.string().describe("Item name, e.g. \"Idol\" or \"Pareidolia\""),
            limit: z.number().int().min(1).max(10).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement build locally (paywall removed)
        try {
            return textError("Not yet implemented: build");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("map_locations", {
        title: "Map locations",
        description: "Find Wynncraft map locations and profession stations by name, with their coordinates.",
        inputSchema: z.object({ query: z.string().describe("Optional location name filter.").optional(), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mapLocations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("territory_owners", {
        title: "Territory owners",
        description: "List territory ownership, acquisition times and headquarters flags, optionally filtered by guild.",
        inputSchema: z.object({ guild: z.string().describe("Optional guild name filter.").optional(), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement owners locally (paywall removed)
        try {
            return textError("Not yet implemented: owners");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wynncraft-mcp";
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
    if (e instanceof WynncraftError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
