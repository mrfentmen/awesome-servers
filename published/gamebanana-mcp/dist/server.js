import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BananaError, formatMod, formatSearchResult, getGame, getGameMods, getMod, searchGames, searchMods } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "gamebanana-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_mods", {
        title: "Search mods",
        description: "Search GameBanana for mods across all games.",
        inputSchema: z.object({ query: z.string().describe("Mod name, e.g. 'Brutal Doom' or 'randomizer'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const results = await searchMods(query);
            if (results.length === 0)
                return text(`No mods found for "${query}".`);
            return text(`Mods matching "${query}":\n` +
                results.map((r, i) => formatSearchResult(r, i + 1)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_mod", {
        title: "Get mod",
        description: "Get a GameBanana mod page: description, author, downloads, size, category.",
        inputSchema: z.object({ id: z.number().int().describe("Mod id from search_mods or get_game_mods") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const mod = await getMod(id);
            if (!mod)
                return text(`No mod with id ${id}.`);
            return text(formatMod(mod));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_games", {
        title: "Search games",
        description: "Search GameBanana for games by title.",
        inputSchema: z.object({ query: z.string().describe("Game title, e.g. 'Doom' or 'Half-Life'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const results = await searchGames(query);
            if (results.length === 0)
                return text(`No games found for "${query}".`);
            return text(`Games matching "${query}":\n` +
                results.map((r, i) => formatSearchResult(r, i + 1)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_game_mods", {
        title: "Get game mods",
        description: "List the latest mods for a game on GameBanana.",
        inputSchema: z.object({
            gameId: z.number().int().describe("Game id from search_games"),
            limit: z.number().int().min(1).max(25).default(10).describe("Max mods"),
        }),
        annotations: READ_ONLY,
    }, async ({ gameId, limit }) => {
        try {
            const game = await getGame(gameId);
            const mods = await getGameMods(gameId, limit);
            if (mods.length === 0) {
                return text(`No mods found for game ${gameId}.`);
            }
            const head = `${game?.name ?? `Game ${gameId}`} mods:\n`;
            const body = mods
                .map((m, i) => `${i + 1}. ${m.name}${m.category ? ` [${m.category}]` : ""}${m.viewCount ? ` (${m.viewCount.toLocaleString()} views)` : ""}\n   ${m.url}`)
                .join("\n");
            return text(head + body);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mod_files", {
        title: "Mod files",
        description: "Every file attached to a GameBanana mod with its size, download count, archived flag and direct download link.",
        inputSchema: z.object({ id: z.number().describe("Mod id from search_mods or get_game_mods."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement files locally (paywall removed)
        try {
            return textError("Not yet implemented: files");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mod_stats", {
        title: "Mod stats",
        description: "Engagement statistics for a GameBanana mod: views, downloads, likes, comments, subscribers, version, dates, obsolete and ported flags and license.",
        inputSchema: z.object({ id: z.number().describe("Mod id from search_mods or get_game_mods."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stats locally (paywall removed)
        try {
            return textError("Not yet implemented: stats");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mod_previews", {
        title: "Mod previews",
        description: "The preview and screenshot image URLs attached to a GameBanana mod, so you can see what a mod looks like before downloading it.",
        inputSchema: z.object({ id: z.number().describe("Mod id from search_mods or get_game_mods."), limit: z.number().describe("Max images, 1-30, default 8.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement previews locally (paywall removed)
        try {
            return textError("Not yet implemented: previews");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gamebanana-mcp";
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
function errorMessage(e) {
    if (e instanceof BananaError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
