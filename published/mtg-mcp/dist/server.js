import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cards, sets } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mtg-mcp", version: "1.0.0" });
    server.registerTool("cards", {
        title: "Cards",
        description: "Search cards.",
        inputSchema: z.object({ name: z.string().describe("Card name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cards(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sets", {
        title: "Sets",
        description: "List card sets.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("card_profile", {
        title: "Card profile",
        description: "Full Scryfall record for one exact card name: mana cost, type line, oracle and flavour text, power/toughness, colours, keywords, format legality, prices, EDHREC rank, artist and image link.",
        inputSchema: z.object({ name: z.string().describe("Exact card name, e.g. 'Shivan Dragon'."), }),
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
    server.registerTool("card_rulings", {
        title: "Card rulings",
        description: "Official rule clarifications Scryfall records for a card, with the date each was published.",
        inputSchema: z.object({ name: z.string().describe("Exact card name, e.g. 'Fling'."), limit: z.number().describe("Max rulings, 1-40, default 8.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement rulings locally (paywall removed)
        try {
            return textError("Not yet implemented: rulings");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("keyword_list", {
        title: "Keyword list",
        description: "The keyword ability names in Scryfall's catalogue, as a reference for reading card text.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mtg-mcp";
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
