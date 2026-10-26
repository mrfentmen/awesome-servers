import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OsrsError, formatStats, getFlips, getHotItems, getItemPrice, getPlayerStats, getPriceHistory, searchItems, itemVolume, priceWindows, alchProfit, playerCompare, wikiSearch, itemLore } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MODES = ["normal", "ironman", "ultimate", "hardcore", "deadman"];
const Gp = (n) => (n > 0 ? `${n.toLocaleString()} gp` : "no trade");
export function createServer() {
    const server = new McpServer({
        name: "osrs-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_player_stats", {
        title: "Get player stats",
        description: "Get an OSRS player's hiscores: levels, XP, clue scrolls and boss kill counts. " +
            "Modes: normal / ironman / ultimate / hardcore / deadman.",
        inputSchema: z.object({
            username: z.string().describe("RuneScape username, e.g. 'Zezima'"),
            mode: z.enum(MODES).default("normal").describe("Account type"),
        }),
        annotations: READ_ONLY,
    }, async ({ username, mode }) => {
        try {
            return text(formatStats(await getPlayerStats(username, mode)));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_item_price", {
        title: "Get item price",
        description: "Current Grand Exchange price of an item — what you pay to buy now and what you get selling now.",
        inputSchema: z.object({
            name: z.string().describe("Item name, e.g. 'Bandos chestplate' or 'Rune scimitar'"),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            const p = await getItemPrice(name);
            if (!p)
                return text(`No GE item matches "${name}". Try a different name or use search_items.`);
            return text([
                `${p.name} [id ${p.id}]${p.members ? " (members)" : " (free)"}`,
                `Buy now (instant): ${Gp(p.high)}`,
                `Sell now (instant): ${Gp(p.low)}`,
                `Spread: ${p.high > 0 && p.low > 0 ? `${(p.high - p.low).toLocaleString()} gp` : "—"}`,
            ].join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_items", {
        title: "Search items",
        description: "Find Grand Exchange items by partial name and get their item IDs and high-alch values.",
        inputSchema: z.object({
            query: z.string().describe("Partial item name, e.g. 'dragon bones' or 'rune'"),
            limit: z.number().int().min(1).max(40).default(15).describe("How many matches to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const hits = await searchItems(query, limit);
            if (!hits.length)
                return text(`No GE items match "${query}".`);
            return text(`GE items matching "${query}":\n` +
                hits
                    .map((h, i) => `${i + 1}. ${h.name} [id ${h.id}]${h.members ? " (members)" : " (free)"}${h.alch > 0 ? ` | high alch ${h.alch.toLocaleString()} gp` : ""}`)
                    .join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_hot_items", {
        title: "Get hot items",
        description: "What's trading the most on the Grand Exchange right now — ranked by trade volume in the last hour, with buy/sell averages.",
        inputSchema: z.object({
            limit: z.number().int().min(3).max(15).default(10).describe("How many items to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const items = await getHotItems(limit);
            if (!items.length)
                return text("No trade volume data right now.");
            return text(`Hottest GE items (last hour):\n` +
                items
                    .map((m, i) => `${i + 1}. ${m.name} — vol ${m.volume.toLocaleString()} | avg buy ${Gp(m.avgHigh)} / avg sell ${Gp(m.avgLow)}`)
                    .join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_price_history", {
        title: "Get price history",
        description: "Price history for one item: average buy/sell price and trade volume per step. " +
            "Steps: 5m / 1h / 6h / 24h.",
        inputSchema: z.object({
            name: z.string().describe("Item name, e.g. 'Abyssal whip'"),
            timestep: z
                .enum(["5m", "1h", "6h", "24h"])
                .default("24h")
                .describe("Bucket size: 5m, 1h, 6h or 24h. Defaults to 24h."),
            points: z.number().int().min(1).max(60).default(14).describe("How many recent buckets to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ name, timestep, points }) => {
        try {
            const h = await getPriceHistory(name, timestep, points);
            if (!h)
                return text(`No GE item matches "${name}".`);
            if (!h.points.length)
                return text(`No ${timestep} price history for ${h.item.name} yet.`);
            return text(`${h.item.name} [id ${h.item.id}] — last ${h.points.length} x ${h.timestep}:\n` +
                h.points
                    .map((p) => {
                    const when = new Date(p.timestamp * 1000).toISOString().slice(0, 16).replace("T", " ");
                    const vol = (p.highVolume + p.lowVolume).toLocaleString();
                    return `${when} | buy ${Gp(p.avgHigh ?? 0)} | sell ${Gp(p.avgLow ?? 0)} | vol ${vol}`;
                })
                    .join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_flip_margins", {
        title: "Get flip margins",
        description: "Grand Exchange flipping opportunities: buy at the instant-sell price, sell at the instant-buy price, " +
            "ranked by margin x hourly volume. Filtered by minimum hourly volume so illiquid junk stays out.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(25).default(10).describe("How many flips to show"),
            minVolume: z.number().int().min(1).max(100000).default(100).describe("Minimum trades in the last hour"),
        }),
        annotations: READ_ONLY,
    }, async ({ limit, minVolume }) => {
        try {
            const flips = await getFlips(limit, minVolume);
            if (!flips.length)
                return text(`No items traded at least ${minVolume} times in the last hour.`);
            return text(`GE flip margins (min ${minVolume} trades/hour):\n` +
                flips
                    .map((f, i) => `${i + 1}. ${f.name} [id ${f.id}] — buy ${Gp(f.buy)}, sell ${Gp(f.sell)} | margin ${f.margin.toLocaleString()} gp (${f.roiPct.toFixed(1)}% ROI) | vol ${f.volume.toLocaleString()}/h`)
                    .join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("item_volume", {
        title: "Item volume",
        description: "How much an item really trades: 24h volume against the 4-hourly GE buy limit, or the market's most traded items when no name is given.",
        inputSchema: z.object({
            name: z.string().describe("Item name, e.g. 'Dragon bones'. Omit for the most traded items.").optional(),
            limit: z.number().describe("How many items to rank when no name is given, 1-30. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ name, limit }) => {
        try {
            return text(await itemVolume({ name, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("price_windows", {
        title: "Price windows",
        description: "One item priced in every window the wiki publishes - instant, 5 minutes, 1 hour, 24 hours - with trade counts and how today's price sits against the 24h average.",
        inputSchema: z.object({
            name: z.string().describe("Item name, e.g. 'Rune platebody'"),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(await priceWindows({ name }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("alch_profit", {
        title: "Alchemy profit",
        description: "Rank items by high-alchemy margin - alchemy value minus the current buy price - with the GE buy limit that caps how much can be alched per window.",
        inputSchema: z.object({
            limit: z.number().describe("How many items to rank, 1-40. Defaults to 10.").optional(),
            membersOnly: z.boolean().describe("Only members items. Defaults to false.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ limit, membersOnly }) => {
        try {
            return text(await alchProfit({ limit, membersOnly }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("player_compare", {
        title: "Compare players",
        description: "Compare two Old School accounts: total level and XP gap, the skills with the biggest difference, and the activities both players have scores in.",
        inputSchema: z.object({
            playerA: z.string().describe("First account name, e.g. 'Lynx Titan'"),
            playerB: z.string().describe("Second account name"),
            mode: z.string().describe("Hiscores mode: normal, ironman, hardcore_ironman, ultimate_ironman, deadman. Defaults to normal.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ playerA, playerB, mode }) => {
        try {
            return text(await playerCompare({ playerA, playerB, mode }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("wiki_search", {
        title: "Search the OSRS wiki",
        description: "Search the Old School RuneScape Wiki for pages about an item, NPC, quest or mechanic. Returns page titles and a text snippet of each hit.",
        inputSchema: z.object({
            query: z.string().describe("What to search for, e.g. 'Abyssal whip' or 'Barrows chest'"),
            limit: z.number().describe("Max results, 1-20.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wikiSearch(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("item_lore", {
        title: "Item lore and classification",
        description: "The Old School RuneScape Wiki article for a Grand Exchange item: its summary, what it is classified as, and what the exchange is paying for it right now.",
        inputSchema: z.object({
            name: z.string().describe("Item name as it appears on the Grand Exchange, e.g. 'Twisted bow'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await itemLore(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof OsrsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
