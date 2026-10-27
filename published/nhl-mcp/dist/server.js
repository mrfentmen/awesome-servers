import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatGame, formatStanding, formatTeamStats, getSchedule, getStandings, getTeamStats, NhlError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "nhl-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_team_stats", {
        title: "Get team stats",
        description: "Season team stats: wins, losses, points, goals, special teams.",
        inputSchema: z.object({ season: z.string().default("20252026").describe("Season id like '20252026'"), limit: z.number().int().min(1).max(32).default(10) }),
        annotations: READ_ONLY,
    }, async ({ season, limit }) => {
        try {
            const teams = await getTeamStats(season, limit);
            if (teams.length === 0)
                return text(`No team stats for season ${season}.`);
            return text(`NHL team stats ${season}:\n\n${teams.map((t) => formatTeamStats(t)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_standings", {
        title: "Get standings",
        description: "Current NHL standings for every team.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await getStandings();
            if (rows.length === 0)
                return text("No standings right now.");
            return text(`NHL standings:\n\n${rows.map((r, i) => formatStanding(r, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_schedule", {
        title: "Get schedule",
        description: "Today's NHL games with scores where played.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const games = await getSchedule();
            if (games.length === 0)
                return text("No games on today's schedule.");
            return text(`NHL games today:\n${games.map((g) => `- ${formatGame(g)}`).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("player_profile", {
        title: "Player profile",
        description: "An NHL player's current club, position, birth date, height, weight and featured season statistics by category.",
        inputSchema: z.object({ playerId: z.number().describe("NHL player id, e.g. 8478402."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("team_roster", {
        title: "Team roster",
        description: "A club's current NHL roster grouped by forwards, defence and goalies with player ids, positions and birth dates, which standings and schedules do not give.",
        inputSchema: z.object({ team: z.string().describe("Team abbreviation, e.g. EDM."), }),
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
    const serverName = "nhl-mcp";
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
function errorMessage(e) {
    if (e instanceof NhlError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
