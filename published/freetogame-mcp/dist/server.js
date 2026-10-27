import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { game, games, studioRanking } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "freetogame-mcp", version: "1.0.0" });
    server.registerTool("games", {
        title: "Games",
        description: "List free games with filters.",
        inputSchema: z.object({ platform: z.string().describe("pc, browser, or all.").optional(), category: z.string().describe("Category like shooter or mmorpg.").optional(), sortBy: z.string().describe("relevance or popularity.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await games(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("game", {
        title: "Game",
        description: "Details for one game.",
        inputSchema: z.object({ id: z.number().describe("Game ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await game(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("genre_platform_matrix", {
        title: "Genre platform matrix",
        description: "Cross-tabulate the whole FreeToGame catalogue: how many free games sit in each genre, on which platforms, and across which release years.",
        inputSchema: z.object({ platform: z.string().describe("pc, browser or all.").default("all"), genre: z.string().describe("Substring of the genre, e.g. 'shooter'.").optional(), limit: z.number().int().min(1).max(60).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement matrix locally (paywall removed)
        try {
            return textError("Not yet implemented: matrix");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("studio_ranking", {
        title: "Studio ranking",
        description: "Rank developers or publishers by how many free-to-play games they have in the FreeToGame catalogue, with example titles and newest release year.",
        inputSchema: z.object({ role: z.string().describe("developer or publisher.").default("developer"), limit: z.number().int().min(1).max(50).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await studioRanking(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "freetogame-mcp";
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
