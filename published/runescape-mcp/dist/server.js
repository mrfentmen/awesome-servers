import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_hiscore, m1_formatStats, m1_getHotItems, m1_getItemPrice, m1_getPlayerStats, wikiOutline } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
const m1_MODES = ["normal", "ironman", "ultimate", "hardcore", "deadman"];
export function createServer() {
    const server = new McpServer({ name: 'runescape-mcp', version: '1.0.0' });
    server.registerTool("hiscore", {
        title: "Hiscore",
        description: "Hiscore for a player.",
        inputSchema: z.object({ player: z.string().describe("Player name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_hiscore(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_player_stats", {
        title: "Get player stats",
        description: "Get an OSRS player's hiscores: levels, XP, clue scrolls, and boss " +
            "kill counts. Modes: normal / ironman / ultimate / hardcore / deadman.",
        inputSchema: z.object({
            username: z.string().describe("RuneScape username, e.g. 'Zezima'"),
            mode: z.enum(m1_MODES).default("normal").describe("Account type"),
        }),
        annotations: READ_ONLY,
    }, async ({ username, mode }) => {
        try {
            const stats = await m1_getPlayerStats(username, mode);
            return text(m1_formatStats(stats));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_item_price", {
        title: "Get item price",
        description: "Get the current Grand Exchange price of an item (buy/sell spread).",
        inputSchema: z.object({ name: z.string().describe("Item name, e.g. 'Bandos chestplate' or 'Rune scimitar'") }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            const p = await m1_getItemPrice(name);
            if (!p)
                return text(`No GE item matches "${name}". Try 'osrs get_item_price' with a different name.`);
            const lines = [
                `${p.name} [id ${p.id}]${p.members ? " (members)" : " (free)"}`,
                `Buy: ${p.high > 0 ? p.high.toLocaleString() + " gp" : "no trade today"}`,
                `Sell: ${p.low > 0 ? p.low.toLocaleString() + " gp" : "no trade today"}`,
                `Spread: ${p.high > 0 && p.low > 0 ? (p.high - p.low).toLocaleString() + " gp" : "—"}`,
            ];
            return text(lines.join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_hot_items", {
        title: "Get hot items",
        description: "What's trading the most on the Grand Exchange right now — ranked by " +
            "trade volume in the last hour, with current buy/sell averages.",
        inputSchema: z.object({ limit: z.number().int().min(3).max(15).default(10).describe("How many items to show") }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const items = await m1_getHotItems(limit);
            if (items.length === 0)
                return text("No trade volume data right now.");
            return text(`🔥 Hottest GE items (last hour):\n` +
                items
                    .map((m, i) => `${i + 1}. ${m.name} — vol ${m.volume.toLocaleString()} | buy ${m.avgHigh > 0 ? m.avgHigh.toLocaleString() + " gp" : "—"} / sell ${m.avgLow > 0 ? m.avgLow.toLocaleString() + " gp" : "—"}`)
                    .join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wiki_article", {
        title: "Wiki article",
        description: "The introduction of an Old School RuneScape Wiki article, with its categories and URL. Resolves a loose topic to the right page.",
        inputSchema: z.object({ topic: z.string().describe("Item, NPC, quest or mechanic to look up, e.g. 'Fire cape'."), maxChars: z.number().int().describe("Max characters of introduction to return.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement article locally (paywall removed)
        try {
            return textError("Not yet implemented: article");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wiki_outline", {
        title: "Wiki outline",
        description: "The section headings of an Old School RuneScape Wiki article, with each section's index — use it to see how a long page is structured before fetching it.",
        inputSchema: z.object({ topic: z.string().describe("Item, NPC, quest or mechanic to look up, e.g. 'Fire cape'."), limit: z.number().int().describe("Max section headings to return.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wikiOutline(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "runescape-mcp";
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
