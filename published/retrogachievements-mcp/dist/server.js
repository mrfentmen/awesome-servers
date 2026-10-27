import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gameExtended, RaError, userProgress, libraryBreakdown } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "retrogachievements-mcp",
        version: "1.0.0",
    });
    server.registerTool("game_extended", {
        title: "Game achievements",
        description: "A retro game with its achievement list. Find ids via rom-mcp.",
        inputSchema: z.object({
            game_id: z.string().describe("Numeric RetroAchievements game id"),
        }),
        annotations: READ_ONLY,
    }, async ({ game_id }) => {
        try {
            return text(await gameExtended(game_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("user_progress", {
        title: "User progress",
        description: "A player's points, rank, and recently played games.",
        inputSchema: z.object({
            username: z.string().describe("RetroAchievements username"),
        }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            return text(await userProgress(username));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("set_scorecard", {
        title: "Score a list of games",
        description: "Paste the games you have started and get your points against what each set offers, what is still on the table, and the order to grind in by points per remaining achievement. Computed locally, no account needed.",
        inputSchema: z.object({
            games: z.string().describe("One game per line: title | console | percentage | achievements owned | achievements total | game points"),
            set_name: z.string().optional().describe("What this list is, e.g. 'Genesis set'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement scorecard locally (paywall removed)
        try {
            return textError("Not yet implemented: scorecard");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("library_breakdown", {
        title: "Break a list down",
        description: "Summarise a pasted game list by console and completion band, list what is closest to finished, and rank the sets by points per achievement as a difficulty signal. Computed locally.",
        inputSchema: z.object({
            games: z.string().describe("One game per line: title | console | percentage | achievements owned | achievements total | game points"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await libraryBreakdown(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "retrogachievements-mcp";
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
function errorMessage(e) {
    if (e instanceof RaError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
