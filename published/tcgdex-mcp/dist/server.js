import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cardDetail, listSets, searchCards, setCards, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "tcgdex-mcp", version: "1.0.0" });
    server.tool("search_cards", "Search Pokemon cards by name across every set TCGdex indexes.", {
        name: z.string().describe('Card name, e.g. "charizard"'), page: z.number().int().min(1).max(200).optional().describe('Page number, default 1'), limit: z.number().int().min(1).max(50).optional().describe('Cards per page, default 12')
    }, async (a) => {
        try {
            return text(await searchCards(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("card_detail", "Everything TCGdex holds for one card: set, rarity, hp, types, weaknesses, retreat, attacks and card text.", {
        cardId: z.string().describe('Card id, e.g. base1-4')
    }, async (a) => {
        try {
            return text(await cardDetail(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("set_cards", "List the cards in one set, oldest to newest in the set's own numbering.", {
        setId: z.string().describe('Set id, e.g. base1'), limit: z.number().int().min(1).max(100).optional().describe('Cards to show, default 20')
    }, async (a) => {
        try {
            return text(await setCards(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_sets", "Browse the TCGdex set catalogue with card counts, newest sets first.", {
        limit: z.number().int().min(1).max(60).optional().describe('Sets to show, default 15')
    }, async (a) => {
        try {
            return text(await listSets(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
