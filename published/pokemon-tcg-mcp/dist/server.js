import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TcgError, formatCardDetail, formatCardSummary, formatSet, getCard, getSet, listSets, searchCards, cardRarities } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "pokemon-tcg-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_cards", {
        title: "Search cards",
        description: "Search Pokémon TCG cards by name, optionally filtered by rarity.",
        inputSchema: z.object({
            name: z.string().describe("Card name, e.g. 'Charizard' or 'Pikachu'"),
            rarity: z.string().optional().describe("e.g. 'Rare Holo', 'Common', 'Rare Holo EX'"),
            limit: z.number().int().min(1).max(25).default(12).describe("Max results"),
        }),
        annotations: READ_ONLY,
    }, async ({ name, rarity, limit }) => {
        try {
            const cards = await searchCards(name, rarity, limit);
            if (cards.length === 0) {
                return text(`No cards found for "${name}"${rarity ? ` (${rarity})` : ""}.`);
            }
            return text(`Cards matching "${name}":\n` +
                cards.map((c, i) => `${i + 1}. ${formatCardSummary(c)}`).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_card", {
        title: "Get card",
        description: "Get a single card's full detail: attacks, abilities, weakness, " +
            "variants, and market prices when available.",
        inputSchema: z.object({ id: z.string().describe("Card id from search_cards, e.g. 'swsh4-25'") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const card = await getCard(id);
            if (!card)
                return text(`No card with id "${id}".`);
            return text(formatCardDetail(card));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_sets", {
        title: "List sets",
        description: "List Pokémon TCG sets (newest first).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const sets = await listSets();
            if (sets.length === 0)
                return text("No sets found.");
            return text(`Pokémon TCG sets (${sets.length}):\n` +
                sets.slice(0, 20).map((s, i) => `${i + 1}. ${formatSet(s)}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_set", {
        title: "Get set",
        description: "Get a Pokémon TCG set and its card list.",
        inputSchema: z.object({ id: z.string().describe("Set id from list_sets, e.g. 'swsh4' or 'base1'") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const set = await getSet(id);
            if (!set)
                return text(`No set with id "${id}".`);
            const head = `${formatSet(set)} (${set.cards.length} cards)\n`;
            const body = set.cards
                .slice(0, 25)
                .map((c) => `• #${c.localId} ${c.name}${c.rarity ? ` (${c.rarity})` : ""}`)
                .join("\n");
            const tail = set.cards.length > 25 ? `\n…and ${set.cards.length - 25} more` : "";
            return text(head + body + tail);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cards_by_rarity", {
        title: "Cards by rarity",
        description: "TCGdex cards carrying a given rarity label, with their set-relative id and category.",
        inputSchema: z.object({
            rarity: z.string().describe("Rarity name, e.g. \"Holo Rare\" (use card_rarities to list them)"),
            limit: z.number().int().min(1).max(50).default(15),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement rarity locally (paywall removed)
        try {
            return textError("Not yet implemented: rarity");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("card_rarities", {
        title: "Card rarities",
        description: "Every rarity label TCGdex uses, so cards_by_rarity can be called with a name that really exists.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cardRarities(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pokemon-tcg-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof TcgError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
