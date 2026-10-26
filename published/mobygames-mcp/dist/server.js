import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchGames, getGame } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "mobygames-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_games", {
        title: "Search games",
        description: "Title search incl. retro (needs MOBYGAMES_API_KEY).",
        inputSchema: z.object({
            query: z.string().describe("Title text, e.g. Doom."),
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchGames(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_game", {
        title: "Get game",
        description: "One game by id, with platforms, genres and score.",
        inputSchema: z.object({
            game_id: z.string().describe("Numeric game ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ game_id }) => {
        try {
            return text(await getGame(game_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("steam_game_profile", {
        title: "Steam game profile",
        description: "One game's store profile from Valve's public app details: developers, publishers, genres, release date, platforms, price and discount, review recommendations, Metacritic score, achievement count and highlighted achievements, categories and languages.",
        inputSchema: z.object({ appid: z.number().int().positive().describe("Steam app id, e.g. 400 for Portal."), limit: z.number().int().min(1).max(20).default(8).describe("Highlighted achievements to print (default 8, max 20).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("steam_specials_census", {
        title: "Steam specials census",
        description: "What is on special in the Steam store right now, ranked by depth of discount, with the median discount, how many titles sit in each discount band, and each title's current US price.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(40).default(10).describe("Specials to print (default 10, max 40).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement census locally (paywall removed)
        try {
            return textError("Not yet implemented: census");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mobygames-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
