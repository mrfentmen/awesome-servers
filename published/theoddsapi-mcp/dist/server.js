import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatGame, gameOdds, listSports, OddsError, fixtureForm } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "theoddsapi-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_sports", {
        title: "List sports",
        description: "Sports and leagues with API keys (soccer_epl, americanfootball_nfl...).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listSports();
            if (rows.length === 0)
                return text("No sports.");
            return text(rows.map((s, i) => `${i + 1}. [${s.key}] ${s.title ?? ""}${s.group ? ` (${s.group})` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("game_odds", {
        title: "Game odds",
        description: "Upcoming games with bookmaker moneyline odds.",
        inputSchema: z.object({
            sport: z.string().describe("Sport key, e.g. 'soccer_epl' (use list_sports)"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ sport, limit }) => {
        try {
            const rows = await gameOdds(sport, limit);
            if (rows.length === 0)
                return text(`No upcoming games for ${sport}.`);
            return text(rows.map((g, i) => formatGame(g, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("implied_probability", {
        title: "Implied probability",
        description: "Turn a set of prices into fair probabilities: accepts decimal, fractional like 5/2 and American like -150, converts each, shows the implied probability, the sum across the outcomes, the bookmaker's overround, and the probability once the margin is removed proportionally. Flags a sum below 100% as an arbitrage with the return worked out.",
        inputSchema: z.object({
            odds: z.string().describe("Comma separated prices, e.g. '2.10,3.40,3.90'."),
            format: z.string().describe("decimal, fractional or american. Default decimal.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement probability locally (paywall removed)
        try {
            return textError("Not yet implemented: probability");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("expected_value", {
        title: "Expected value",
        description: "What a set of bets is worth given your own probabilities: edge per unit, full Kelly, the stake at your Kelly fraction, the total stake as a share of the bankroll, the expected profit and the standard deviation of the outcome, plus the two things the arithmetic cannot know, which is whether your probabilities are right and whether the bets are independent.",
        inputSchema: z.object({
            bets: z.string().describe("One bet per line as 'probability,decimal-price', e.g. '0.55,2.10'."),
            bankroll: z.number().describe("The amount you can lose.").optional(),
            kelly_fraction: z.number().describe("Fraction of Kelly to stake, 0-1. Default 0.25.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement value locally (paywall removed)
        try {
            return textError("Not yet implemented: value");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fixture_form", {
        title: "Fixture form",
        description: "Real upcoming fixtures with each team's real record in the same league, from OpenLigaDB with no key: the next matches with kickoff time and competition round, and for both sides the wins, draws, losses, goals scored and conceded. No prices, just the form a price has to be judged against.",
        inputSchema: z.object({
            league: z.string().describe("OpenLigaDB league shortcut, e.g. bl1, bl2, fl1. Default bl1.").optional(),
            limit: z.number().describe("How many fixtures to show, 1-10.").optional(),
            form: z.number().describe("Retained for compatibility; the form window is the whole league.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fixtureForm(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "theoddsapi-mcp";
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
    if (e instanceof OddsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
