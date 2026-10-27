import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LichessError, formatPlayer, formatPuzzle, getDailyPuzzle, getPlayer, getPuzzleById, getTopPlayers } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "lichess-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_daily_puzzle", {
        title: "Get daily puzzle",
        description: "Get today's daily chess puzzle from Lichess with the FEN and solution.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const p = await getDailyPuzzle();
            if (!p)
                return text("No daily puzzle available right now.");
            return text(formatPuzzle(p));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_puzzle", {
        title: "Get puzzle",
        description: "Get a specific Lichess puzzle by id.",
        inputSchema: z.object({ id: z.string().describe("Puzzle id, e.g. 'd4q3x'") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const p = await getPuzzleById(id);
            if (!p)
                return text(`No puzzle "${id}".`);
            return text(formatPuzzle(p));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_player", {
        title: "Get player",
        description: "Get a Lichess player's stats — best rating, games played, account age.",
        inputSchema: z.object({ username: z.string().describe("Lichess username") }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            const u = await getPlayer(username);
            if (!u)
                return text(`No Lichess user "${username}".`);
            return text(formatPlayer(u));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_top_players", {
        title: "Get top players",
        description: "Top players by performance (blitz, bullet, classical, puzzle, etc.).",
        inputSchema: z.object({
            perf: z
                .string()
                .default("blitz")
                .describe("Performance type: blitz, bullet, rapid, classical, puzzle, etc."),
            limit: z.number().int().min(1).max(20).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ perf, limit }) => {
        try {
            const users = await getTopPlayers(perf, limit);
            if (users.length === 0)
                return text(`No top players for "${perf}".`);
            return text(`Top ${perf} players:\n` +
                users
                    .map((u, i) => `${i + 1}. ${u.username}${u.title ? ` (${u.title})` : ""} — ${u.rating ?? "?"}`)
                    .join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("live_tournaments", {
        title: "Live tournaments",
        description: "The arena and swiss tournaments Lichess has open right now, with clock, variant, player count and join link.",
        inputSchema: z.object({ limit: z.number().describe("Max tournaments.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tournaments locally (paywall removed)
        try {
            return textError("Not yet implemented: tournaments");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("team_info", {
        title: "Team info",
        description: "A Lichess team's public record: whether it is open to join, its description, its leader and its members with titles and blitz ratings.",
        inputSchema: z.object({ team: z.string().describe("Team id, e.g. lichess-swiss."), }),
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
    const serverName = "lichess-mcp";
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
    if (e instanceof LichessError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
