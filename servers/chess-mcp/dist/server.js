import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChessError, formatBoardRow, formatGame, formatPlayer, formatStats, getLeaderboards, getPlayer, getPlayerGames, getPlayerStats, getTitledPlayers, titledPlayerLookup } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "chess-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_player", {
        title: "Get player",
        description: "Get a chess.com player profile.",
        inputSchema: z.object({ username: z.string().describe("chess.com username, e.g. 'hikaru'") }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            const p = await getPlayer(username);
            if (!p)
                return text(`No chess.com player "${username}".`);
            return text(formatPlayer(p));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_player_stats", {
        title: "Get player stats",
        description: "Get a player's ratings across time controls.",
        inputSchema: z.object({ username: z.string().describe("chess.com username") }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            const stats = await getPlayerStats(username);
            const out = formatStats(stats);
            return text(out || `No rated stats for "${username}".`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_player_games", {
        title: "Get player games",
        description: "Get a player's games for a month.",
        inputSchema: z.object({
            username: z.string().describe("chess.com username"),
            year: z.number().int().min(2005).max(2100).describe("Year, e.g. 2026"),
            month: z.number().int().min(1).max(12).describe("Month, e.g. 6"),
            limit: z.number().int().min(1).max(50).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ username, year, month, limit }) => {
        try {
            const games = await getPlayerGames(username, year, month);
            if (games.length === 0)
                return text(`No games for ${username} in ${year}-${String(month).padStart(2, "0")}.`);
            return text(`Games for ${username} in ${year}-${String(month).padStart(2, "0")}:\n${games.slice(0, limit).map((g, i) => formatGame(g, i)).join("\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_leaderboards", {
        title: "Get leaderboards",
        description: "Top players on chess.com by rating.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const boards = await getLeaderboards();
            const parts = [];
            for (const key of ["daily", "rapid", "blitz", "bullet"]) {
                const rows = boards[key] ?? [];
                if (rows.length)
                    parts.push(`${key.toUpperCase()}:\n${rows.slice(0, 5).map(formatBoardRow).join("\n")}`);
            }
            return text(parts.join("\n\n") || "No leaderboard data.");
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_titled_players", {
        title: "Get titled players",
        description: "List players with a title like GM or IM.",
        inputSchema: z.object({ title: z.enum(["GM", "WGM", "IM", "WIM", "FM", "WFM", "NM", "CM", "WCM", "WNM"]).describe("Title abbreviation") }),
        annotations: READ_ONLY,
    }, async ({ title }) => {
        try {
            const users = await getTitledPlayers(title);
            return text(`${title} players on chess.com (${users.length} total):\n${users.slice(0, 40).join(", ")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("live_leaderboards", {
        title: "Live leaderboards",
        description: "The live and puzzle chess.com leaderboards with records and trends, covering the groups the plain daily board misses.",
        inputSchema: z.object({ group: z.string().describe("One board, e.g. live_blitz, tactics, rush, battle. Omit for all live groups.").optional(), limit: z.number().describe("Rows per group.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: live_leaderboards ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_chess_live_leaderboards", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("board_records", {
        title: "Board records",
        description: "One chess.com leaderboard with per player win, loss and draw records, score and rank trend, plus the aggregate across the rows.",
        inputSchema: z.object({ group: z.string().describe("live_rapid, live_blitz, live_bullet, daily960, tactics, rush, battle and the rest."), limit: z.number().describe("Max rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: board_records ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_chess_board_records", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("titled_player_lookup", {
        title: "Titled player lookup",
        description: "Check whether a player holds a given title and where their username sits in that title list.",
        inputSchema: z.object({ title: z.string().describe("Title, e.g. GM, IM, WGM."), player: z.string().describe("Username to look for.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await titledPlayerLookup(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof ChessError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
