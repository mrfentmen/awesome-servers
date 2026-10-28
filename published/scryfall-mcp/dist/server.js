import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cardByName, searchCards, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "scryfall-mcp", version: "1.0.1" });
    server.tool("search_cards", "Search cards with Scryfall syntax, e.g. 'o:draw t:instant cmc<=2'.", {
        query: z.string().min(2).describe('Scryfall query, e.g. "lightning bolt" or "t:legendary c:ru"'),
        limit: z.number().int().min(1).max(25).default(10).describe('Cards to return')
    }, async (a) => {
        try {
            return text(await searchCards(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("card_by_name", "One card by (fuzzy) name, with mana cost, prices and formats.", {
        name: z.string().min(2).describe('Card name, e.g. "Lightning Bolt"')
    }, async (a) => {
        try {
            return text(await cardByName(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
