import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cardInfo, randomCards } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "tarot-mcp", version: "1.0.0" });
    server.registerTool("random_cards", {
        title: "Random cards",
        description: "Draw random tarot cards.",
        inputSchema: z.object({ count: z.number().describe("How many cards.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await randomCards(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("card_info", {
        title: "Card info",
        description: "Get the meaning of a specific card.",
        inputSchema: z.object({ card: z.string().describe("Card short name like ar00.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cardInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("suit_cards", {
        title: "Suit cards",
        description: "The whole cups, wands, swords or pentacles suit with upright and reversed meanings, which a random draw or a single card lookup cannot give you.",
        inputSchema: z.object({ suit: z.string().describe("cups, wands, swords or pentacles."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement cards locally (paywall removed)
        try {
            return textError("Not yet implemented: cards");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("major_arcana", {
        title: "Major arcana",
        description: "All 22 major arcana cards in order with their upright meanings, which is the backbone a single card lookup never shows in full.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement arcana locally (paywall removed)
        try {
            return textError("Not yet implemented: arcana");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "tarot-mcp";
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
