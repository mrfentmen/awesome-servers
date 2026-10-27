import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { draw, newDeck, reshuffle, buildDeck } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "deck-of-cards-mcp", version: "1.0.0" });
    server.registerTool("new_deck", {
        title: "New deck",
        description: "Create and shuffle a deck.",
        inputSchema: z.object({ decks: z.number().describe("Number of decks, 1 to 8.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await newDeck(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("draw", {
        title: "Draw",
        description: "Draw cards from a deck.",
        inputSchema: z.object({ deckId: z.string().describe("Deck ID."), count: z.number().describe("Cards to draw.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await draw(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("build_deck", {
        title: "Build deck",
        description: "Build a deck from exactly the named cards instead of the whole 52, optionally shuffled. Card codes are checked here first because the API accepts a code it does not know and silently returns an empty deck.",
        inputSchema: z.object({ cards: z.string().describe("Cards separated by commas, like AS,KD,0H for the ace of spades, king of diamonds and ten of hearts."), shuffle: z.boolean().describe("Shuffle the partial deck. Defaults to false.").optional(), deckCount: z.number().describe("How many copies of those cards to include, 1-8. Defaults to 1.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await buildDeck(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reshuffle", {
        title: "Reshuffle",
        description: "Shuffle the cards still in a deck after some have been drawn, using the deck ID another tool returned.",
        inputSchema: z.object({ deckId: z.string().describe("Deck ID, as returned by new_deck or build_deck.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reshuffle(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "deck-of-cards-mcp";
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
