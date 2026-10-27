import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dailyPuzzle, userActivity, userProfile, userStatus, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "lichess-stats-mcp", version: "1.0.0" });
    server.tool("user_profile", "A Lichess account: ratings per time control, games played and profile.", {
        username: z.string().min(2).describe("Lichess username, e.g. thibault")
    }, async (a) => {
        try {
            return text(await userProfile(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("user_activity", "Recent activity streaks: games, puzzles and practice days.", {
        username: z.string().min(2).describe("Lichess username"),
        count: z.number().int().min(1).max(10).default(3).describe("Activity entries to return")
    }, async (a) => {
        try {
            return text(await userActivity(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("user_status", "Whether accounts are online, playing or otherwise busy.", {
        usernames: z.array(z.string().min(2)).min(1).max(50).describe("Usernames to check")
    }, async (a) => {
        try {
            return text(await userStatus(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("daily_puzzle", "The puzzle of the day with its solution moves and themes.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await dailyPuzzle());
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
