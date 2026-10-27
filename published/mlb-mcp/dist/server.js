import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { schedule, standings, teams } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mlb-mcp", version: "1.0.0" });
    server.registerTool("teams", {
        title: "Teams",
        description: "All MLB teams.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await teams(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schedule", {
        title: "Schedule",
        description: "Games for a date.",
        inputSchema: z.object({ date: z.string().describe("Date like 2026-08-10."), teamId: z.number().describe("Optional team ID.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await schedule(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("standings", {
        title: "Standings",
        description: "Standings for a season.",
        inputSchema: z.object({ season: z.number().describe("Season year.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await standings(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("player_search", {
        title: "Player search",
        description: "Find MLB players by name, with their MLB Stats API id, primary position, draft year and profile link.",
        inputSchema: z.object({ name: z.string().describe("Player name, e.g. Ohtani."), limit: z.number().int().min(1).max(25).default(8) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("team_roster", {
        title: "Team roster",
        description: "The active roster of one MLB team id, with each player's position, jersey number and status.",
        inputSchema: z.object({ team_id: z.string().describe("Numeric MLB team id, e.g. 133 for the Los Angeles Angels."), roster_type: z.string().describe("active, 40Man, fullSeason, nonRosterInvitees or coach.").optional(), limit: z.number().int().min(1).max(40).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement roster locally (paywall removed)
        try {
            return textError("Not yet implemented: roster");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mlb-mcp";
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
    return server;
}
