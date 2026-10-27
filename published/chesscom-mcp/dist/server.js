import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChessComError, dailyPuzzle, formatLeaders, formatProfile, formatPuzzle, formatStats, getPlayer, getStats, leaderboards, LEADERBOARD_CATEGORIES, clubProfile } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "chesscom-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_player", {
        title: "Get player profile",
        description: "Get a Chess.com player profile: title, name, followers, country, join date, league.",
        inputSchema: z.object({
            username: z.string().describe("Chess.com username, e.g. 'hikaru'"),
        }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            return text(formatProfile(await getPlayer(username)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_stats", {
        title: "Get player ratings",
        description: "Get a Chess.com player's ratings by time control: daily, rapid, blitz, bullet, tactics, Puzzle Rush.",
        inputSchema: z.object({
            username: z.string().describe("Chess.com username, e.g. 'hikaru'"),
        }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            return text(formatStats(username, await getStats(username)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("daily_puzzle", {
        title: "Daily puzzle",
        description: "Get today's Chess.com Daily Puzzle: solve link and board position (FEN).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(formatPuzzle(await dailyPuzzle()));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("leaderboards", {
        title: "Leaderboards",
        description: "Top Chess.com players in a category: daily, rapid, blitz, bullet, or tactics.",
        inputSchema: z.object({
            category: z.enum(LEADERBOARD_CATEGORIES).default("live_blitz"),
            limit: z.number().int().min(1).max(50).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ category, limit }) => {
        try {
            return text(formatLeaders(category, await leaderboards(category, limit)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_games", {
        title: "Recent games",
        description: "Chess.com game archive for a player: rated or casual, time class, ratings, result, timestamps and the game URL.",
        inputSchema: z.object({ username: z.string().describe("chess.com username."), limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement games locally (paywall removed)
        try {
            return textError("Not yet implemented: games");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("club_profile", {
        title: "Club profile",
        description: "Chess.com club details: member count, average daily rating, visibility, country, admins and creation date.",
        inputSchema: z.object({ club_id: z.string().describe("Club slug or id, e.g. lichess.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await clubProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("club_members", {
        title: "Club members",
        description: "Chess.com club roster for a period, listing member usernames and join dates alongside the weekly, monthly and all-time counts.",
        inputSchema: z.object({ club_id: z.string().describe("Club slug or id, e.g. lichess."), period: z.string().describe("all_time, monthly or weekly.").optional(), limit: z.number().describe("Max members.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement members locally (paywall removed)
        try {
            return textError("Not yet implemented: members");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "chesscom-mcp";
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
    if (e instanceof ChessComError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
