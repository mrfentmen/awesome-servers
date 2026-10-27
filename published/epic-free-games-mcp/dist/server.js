import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { freeGames, promoSummary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "epic-free-games-mcp", version: "1.0.0" });
    server.registerTool("free_games", {
        title: "Free games",
        description: "List games currently free on Epic.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await freeGames(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("upcoming_games", {
        title: "Upcoming games",
        description: "What Epic is giving away next, with the real start and end dates and the normal price, read from the upcoming offers the free_games tool ignores.",
        inputSchema: z.object({ limit: z.number().describe("How many scheduled titles to show, 1-20. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement games locally (paywall removed)
        try {
            return textError("Not yet implemented: games");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("promo_summary", {
        title: "Promotion summary",
        description: "The whole Epic giveaway run totalled up: how many titles are free now, how many are scheduled, what they are worth at normal price and when the next offer ends.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await promoSummary());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "epic-free-games-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
