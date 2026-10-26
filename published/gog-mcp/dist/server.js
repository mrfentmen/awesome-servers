import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { browseGames, deals, gameDetails, gamesByIds, searchGames, topRated, priceCheck, browseByType, errorMessage, gogNews, steamReception } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "gog-mcp", version: "1.0.0" });
    server.registerTool("browse_games", {
        title: "Browse games",
        description: "Browse the GOG catalogue of DRM-free PC games, sorted by trending, newest, biggest discount, cheapest or rating.",
        inputSchema: z.object({
            order: z.enum(["trending", "newest", "discount", "cheapest", "rating"]).describe("Sort order (default trending).").optional(),
            limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await browseGames(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_games", {
        title: "Search games",
        description: "Search the GOG catalogue by game title and see current prices.",
        inputSchema: z.object({
            query: z.string().describe("Game title, e.g. 'cyberpunk', 'witcher'."),
            limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchGames(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("deals", {
        title: "Deals",
        description: "Current GOG discounts, filtered to a minimum percentage off.",
        inputSchema: z.object({
            minDiscount: z.number().describe("Minimum discount percent (default 50).").optional(),
            limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await deals(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_rated", {
        title: "Top rated",
        description: "Highest-rated games on GOG, by user review score.",
        inputSchema: z.object({
            limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topRated(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("game_details", {
        title: "Game details",
        description: "Full details for one GOG product by numeric ID: price, platforms, developer, genres and description.",
        inputSchema: z.object({
            product_id: z.string().describe("GOG product ID as a number, e.g. '1207658924'."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await gameDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("games_by_ids", {
        title: "Games by IDs",
        description: "Look up several GOG products at once from a comma-separated list of product IDs.",
        inputSchema: z.object({
            ids: z.string().describe("Comma-separated product IDs, e.g. '1207658695,1207658924'."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await gamesByIds(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("price_check", {
        title: "Price check",
        description: "Batch prices for up to 20 product ids: current USD price, list price and discount.",
        inputSchema: z.object({
            ids: z.string().describe("Numeric GOG product ids, comma separated."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await priceCheck(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("browse_by_type", {
        title: "Browse by type",
        description: "Browse one product kind (game, dlc or pack) with the real catalog total for that kind.",
        inputSchema: z.object({
            product_type: z.string().describe("game, dlc or pack (default dlc).").optional(),
            limit: z.number().describe("Items to list (default 10, max 20).").optional(),
            order: z.enum(["trending", "newest", "discount", "cheapest", "rating"]).describe("Sort order (default newest).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await browseByType(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("gog_news", {
        title: "GOG news",
        description: "The GOG news feed: what the store is publishing right now, with the date, comment count and forum thread.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(30).default(10).describe("How many posts to print (default 10, max 30)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: gog_news ----
        try {
            return text(await gogNews(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("steam_reception", {
        title: "Steam reception",
        description: "How a game was received on the other big PC storefront: Metacritic score, Steam user recommendation count, price, platforms and release date. The GOG catalogue publishes none of this.",
        inputSchema: z.object({
            game: z.string().describe("Game name to look for, e.g. 'The Witcher 3'"),
            limit: z.number().int().min(1).max(3).default(1).describe("How many storefront matches to detail (default 1, max 3)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: steam_reception ----
        try {
            return text(await steamReception(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
