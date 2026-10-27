import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Gw2Error, formatAchievement, formatItem, formatPrice, getAchievement, getDailyAchievements, getItem, getItemPrice, searchItems } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "gw2-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_items", {
        title: "Search items",
        description: "Search Guild Wars 2 items by name.",
        inputSchema: z.object({ name: z.string().describe("Item name, e.g. 'Zojja' or 'Eternal Forge'"), limit: z.number().int().min(1).max(20).default(10) }),
        annotations: READ_ONLY,
    }, async ({ name, limit }) => {
        try {
            const items = await searchItems(name, limit);
            if (items.length === 0)
                return text(`No GW2 items match "${name}".`);
            return text(`Items matching "${name}":\n\n${items.map((i) => formatItem(i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_item", {
        title: "Get item",
        description: "Get a GW2 item by id.",
        inputSchema: z.object({ id: z.number().int().describe("Item id from search_items") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const item = await getItem(id);
            if (!item)
                return text(`No item ${id}.`);
            return text(formatItem(item));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_item_price", {
        title: "Get item price",
        description: "Trading Post buy and sell prices for an item.",
        inputSchema: z.object({ id: z.number().int().describe("Item id") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const price = await getItemPrice(id);
            if (!price)
                return text(`No trading data for item ${id}.`);
            return text(`Trading Post for ${id}:\n${formatPrice(price)}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_achievement", {
        title: "Get achievement",
        description: "Get a GW2 achievement by id.",
        inputSchema: z.object({ id: z.number().int().describe("Achievement id") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const a = await getAchievement(id);
            if (!a)
                return text(`No achievement ${id}.`);
            return text(formatAchievement(a));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_daily_achievements", {
        title: "Get daily achievements",
        description: "Today's PvE daily achievements.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const daily = await getDailyAchievements();
            if (daily.length === 0)
                return text("No dailies available.");
            const out = [];
            for (const d of daily) {
                const a = await getAchievement(d.id);
                if (a)
                    out.push(`- ${a.name}${d.level_min ? ` (lvl ${d.level_min}+)` : ""}`);
            }
            return text(`Today's GW2 dailies:\n${out.join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("world_events", {
        title: "World events",
        description: "Every Guild Wars 2 world currently up with its population tier, and the population mix across the whole list.",
        inputSchema: z.object({ limit: z.number().describe("Max worlds to list.").optional(), population: z.string().describe("high, medium, low, very low, none or unknown.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement events locally (paywall removed)
        try {
            return textError("Not yet implemented: events");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("item_stat_bonuses", {
        title: "Item stat bonuses",
        description: "The attribute bonuses a Guild Wars 2 item id grants, with the percentages applied and the item that carries it.",
        inputSchema: z.object({ id: z.number().describe("Numeric item or item stat id, e.g. 145.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement bonuses locally (paywall removed)
        try {
            return textError("Not yet implemented: bonuses");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gw2-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof Gw2Error)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
