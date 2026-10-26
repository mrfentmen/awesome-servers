import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchGames, getGame } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "rawg-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_games", {
        title: "Search games",
        description: "Game search (needs RAWG_API_KEY).",
        inputSchema: z.object({
            query: z.string().describe("Game title, e.g. Portal."),
            limit: z.string().describe("Max results (default 10, max 40).").optional()
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
        description: "One game by id or slug, with platforms and rating.",
        inputSchema: z.object({
            game_id: z.string().describe("Numeric ID or slug, e.g. portal / 13536.")
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
    server.registerTool("steam_store_info", {
        title: "Steam store record",
        description: "The Steam store's own record for an app: type, developer, publisher, release date, platforms, genres, feature tags, price, review count, content notes and achievement count.",
        inputSchema: z.object({
            app_id: z.number().describe("Steam app id, the number in store.steampowered.com/app/<id>/, e.g. 730"),
        }),
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
    server.registerTool("steam_reach", {
        title: "Steam reach",
        description: "How big a Steam title actually is: the estimated ownership bracket, players online right now, the positive and negative review split, median playtime and the community tags.",
        inputSchema: z.object({
            app_id: z.number().describe("Steam app id, e.g. 730"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement reach locally (paywall removed)
        try {
            return textError("Not yet implemented: reach");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "rawg-mcp";
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
