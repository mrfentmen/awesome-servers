import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { league, team, player } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "thesportsdb-mcp", version: "1.0.0" });
    server.registerTool("team", {
        title: "Team",
        description: "Search teams.",
        inputSchema: z.object({ query: z.string().describe("Team name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await team(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("league", {
        title: "League",
        description: "Upcoming events for a league.",
        inputSchema: z.object({ id: z.number().describe("League id."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await league(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("league_table", {
        title: "League table",
        description: "Current league standings: rank, team, played, won, drawn, lost, goals for, goals against, goal difference and points.",
        inputSchema: z.object({ id: z.number().describe("League id, e.g. 4328 for the English Premier League."), limit: z.number().describe("Max rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement table locally (paywall removed)
        try {
            return textError("Not yet implemented: table");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("league_teams", {
        title: "League teams",
        description: "Every team in a league with its id, short code, founding year, country and home stadium.",
        inputSchema: z.object({ league: z.string().describe("League name, e.g. 'English Premier League'."), limit: z.number().describe("Max teams.").optional() }),
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
    server.registerTool("player", {
        title: "Player",
        description: "One footballer's details: club, position, shirt number, nationality, date of birth, birthplace, height, weight and status.",
        inputSchema: z.object({ id: z.number().describe("Player id from TheSportsDB.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await player(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "thesportsdb-mcp";
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
