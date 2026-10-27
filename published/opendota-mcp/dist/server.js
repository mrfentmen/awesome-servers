import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { heroStats, heroes, match, player } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "opendota-mcp", version: "1.0.0" });
    server.registerTool("heroes", {
        title: "Heroes",
        description: "List Dota 2 heroes.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await heroes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hero_stats", {
        title: "Hero stats",
        description: "Hero win rates and pick rates.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await heroStats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("match", {
        title: "Match",
        description: "Details for one match.",
        inputSchema: z.object({ matchId: z.number().describe("Match ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await match(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("player", {
        title: "Player",
        description: "Summary for one player.",
        inputSchema: z.object({ accountId: z.number().describe("Steam account ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await player(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("player_breakdown", {
        title: "Player breakdown",
        description: "A player's match record broken down by game mode, lane role, region, patch, lobby or leaver status, with win rate per bucket.",
        inputSchema: z.object({ accountId: z.number().describe("Steam account ID."), dimension: z.enum(["game_mode", "lane_role", "region", "patch", "lobby_type", "leaver_status", "is_radiant"]).default("game_mode"), limit: z.number().int().min(1).max(20).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement breakdown locally (paywall removed)
        try {
            return textError("Not yet implemented: breakdown");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("top_teams", {
        title: "Top teams",
        description: "Dota 2 pro teams ranked by their OpenDota rating, with wins, losses and win rate.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement teams locally (paywall removed)
        try {
            return textError("Not yet implemented: teams");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "opendota-mcp";
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
