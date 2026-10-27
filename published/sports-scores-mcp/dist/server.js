import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mlbScores, nbaScores, nflScores } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "sports-scores-mcp", version: "1.0.0" });
    server.registerTool("nba_scores", {
        title: "Nba scores",
        description: "Today NBA scores and game states.",
        inputSchema: z.object({ limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nbaScores(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nfl_scores", {
        title: "Nfl scores",
        description: "Today NFL scores and game states.",
        inputSchema: z.object({ limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nflScores(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mlb_scores", {
        title: "Mlb scores",
        description: "Today MLB scores and game states.",
        inputSchema: z.object({ limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mlbScores(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nhl_scores", {
        title: "NHL scores",
        description: "NHL scores from ESPN's scoreboard, which the basketball, football and baseball boards do not carry.",
        inputSchema: z.object({ limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement scores locally (paywall removed)
        try {
            return textError("Not yet implemented: scores");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("soccer_scores", {
        title: "Soccer scores",
        description: "Soccer scores for a league on ESPN's scoreboard, with the league slug, which the other three sport tools do not cover.",
        inputSchema: z.object({ league: z.string().describe("League slug, e.g. eng.1.").optional(), limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement scores locally (paywall removed)
        try {
            return textError("Not yet implemented: scores");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "sports-scores-mcp";
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
