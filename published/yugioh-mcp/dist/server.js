import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YugiohError, formatCard, getBanlist, getCardById, searchCardsByArchetype, searchCardsByName, stapleCards } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "yugioh-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_cards", {
        title: "Search cards",
        description: "Search Yu-Gi-Oh! cards by exact name.",
        inputSchema: z.object({ name: z.string().describe("Card name, e.g. 'Blue-Eyes White Dragon'") }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            const cards = await searchCardsByName(name);
            if (cards.length === 0)
                return text(`No Yu-Gi-Oh! card named "${name}".`);
            return text(`Cards matching "${name}":\n\n${cards.map((c, i) => formatCard(c, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_by_archetype", {
        title: "Search by archetype",
        description: "Search Yu-Gi-Oh! cards by archetype (e.g. 'Blue-Eyes', 'Dark Magician', 'Branded').",
        inputSchema: z.object({ archetype: z.string().describe("Archetype name"), limit: z.number().int().min(1).max(30).default(10) }),
        annotations: READ_ONLY,
    }, async ({ archetype, limit }) => {
        try {
            const cards = await searchCardsByArchetype(archetype);
            if (cards.length === 0)
                return text(`No archetype "${archetype}" found.`);
            return text(`Cards in archetype "${archetype}" (${cards.length} total, showing ${Math.min(limit, cards.length)}):\n\n` +
                cards.slice(0, limit).map((c, i) => formatCard(c, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_card", {
        title: "Get card",
        description: "Get a single card by numeric id (from search results).",
        inputSchema: z.object({ id: z.number().int().describe("Card id, e.g. 89631139") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const card = await getCardById(id);
            if (!card)
                return text(`No Yu-Gi-Oh! card with id ${id}.`);
            return text(formatCard(card));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_banlist", {
        title: "Get banlist",
        description: "Get the current TCG/OCG forbidden & limited list.",
        inputSchema: z.object({ format: z.enum(["tcg", "ocg", "goat"]).default("tcg").describe("Banlist format") }),
        annotations: READ_ONLY,
    }, async ({ format }) => {
        try {
            const list = await getBanlist(format);
            if (list.length === 0)
                return text(`Empty ${format.toUpperCase()} banlist.`);
            const grouped = new Map();
            for (const e of list) {
                const status = format === "ocg" ? e.ocg : format === "goat" ? e.goat : e.tcg;
                const key = status || "?";
                if (!grouped.has(key))
                    grouped.set(key, []);
                grouped.get(key).push(e.name);
            }
            const out = [];
            for (const [status, names] of grouped) {
                out.push(`${status.toUpperCase()} (${names.length}):\n  ${names.join(", ")}`);
            }
            return text(`${format.toUpperCase()} banlist:\n\n${out.join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("highest_attack_cards", {
        title: "Highest attack cards",
        description: "Cards with the highest ATK in the YGOPRODeck database, optionally restricted to one card type.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(10), type: z.string().describe("Card type, e.g. 'Effect Monster' or 'Link Monster'.").optional() }),
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
    server.registerTool("staple_cards", {
        title: "Staple cards",
        description: "Cards the YGOPRODeck database marks as tournament staples.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stapleCards(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "yugioh-mcp";
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
    if (e instanceof YugiohError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
