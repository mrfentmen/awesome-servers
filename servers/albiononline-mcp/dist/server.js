import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getPrices, getPriceHistory, getPriceCharts, getGoldPrices, getRecentKills, getKillDetails, priceTrend } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "albiononline-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_prices", {
        title: "Get market prices",
        description: "Live Albion Online market prices for an item across cities, sell and buy orders.",
        inputSchema: z.object({
            item: z.string().describe("Item id, e.g. 'T4_BAG'"),
            locations: z.string().optional().describe("Cities, e.g. 'Caerleon,Bridgewatch'"),
            qualities: z.string().optional().describe("Qualities 1-5, e.g. '1,2'"),
        }),
        annotations: READ_ONLY,
    }, async ({ item, locations, qualities }) => {
        try {
            return text(await getPrices(item, locations, qualities));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_price_history", {
        title: "Get price history",
        description: "Albion Online price history rows for an item: timestamps, min/max/avg prices, volumes.",
        inputSchema: z.object({
            item: z.string().describe("Item id"),
            date: z.string().optional().describe("Start date YYYY-MM-DD"),
            end_date: z.string().optional().describe("End date YYYY-MM-DD"),
            timeScale: z.string().default("1h").describe("Bucket: 1h, 1d or 1w"),
        }),
        annotations: READ_ONLY,
    }, async ({ item, date, end_date, timeScale }) => {
        try {
            return text(await getPriceHistory(item, date, end_date, timeScale));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_price_charts", {
        title: "Get price charts",
        description: "Albion Online chart-ready price series (locations and item count series) for an item.",
        inputSchema: z.object({
            item: z.string().describe("Item id"),
            date: z.string().optional().describe("Start date"),
            end_date: z.string().optional().describe("End date"),
            timeScale: z.string().default("1h").describe("Bucket"),
        }),
        annotations: READ_ONLY,
    }, async ({ item, date, end_date, timeScale }) => {
        try {
            return text(await getPriceCharts(item, date, end_date, timeScale));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_gold_prices", {
        title: "Get gold prices",
        description: "Albion Online gold prices over time.",
        inputSchema: z.object({
            date: z.string().optional().describe("Start date"),
            count: z.number().default(5).describe("How many rows"),
        }),
        annotations: READ_ONLY,
    }, async ({ date, count }) => {
        try {
            return text(await getGoldPrices(date, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_recent_kills", {
        title: "Get recent kills",
        description: "Recent Albion Online killboard events: killers, victim, gear, fame.",
        inputSchema: z.object({
            limit: z.number().default(5).describe("How many events"),
            offset: z.number().default(0).describe("Paging offset"),
        }),
        annotations: READ_ONLY,
    }, async ({ limit, offset }) => {
        try {
            return text(await getRecentKills(limit, offset));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_kill_details", {
        title: "Get kill details",
        description: "Full Albion Online kill event: participants, equipment snapshots, damage done.",
        inputSchema: z.object({
            eventId: z.number().describe("Event id from get_recent_kills"),
        }),
        annotations: READ_ONLY,
    }, async ({ eventId }) => {
        try {
            return text(await getKillDetails(eventId));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("market_summary", {
        title: "Market summary",
        description: "Compare Albion Online market prices across cities: the cheapest sell orders, the best buy orders, and the gross arbitrage difference between the two extremes.",
        inputSchema: z.object({ item: z.string().describe("Item id, e.g. 'T4_BAG'"), quality: z.number().int().min(1).max(5).describe("Restrict to one quality 1-5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: market_summary ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_albiononline_market_summary", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("price_trend", {
        title: "Price trend",
        description: "Summarise an item's price history: low, high, volume-weighted mean and end-to-end change per location and quality, instead of the raw rows.",
        inputSchema: z.object({ item: z.string().describe("Item id, e.g. 'T4_BAG'"), quality: z.number().int().min(1).max(5).optional(), location: z.string().describe("City, e.g. 'Caerleon'.").optional(), timeScale: z.string().describe("1h, 1d or 1w.").default("1d"), days: z.number().int().min(1).max(365).describe("Look-back window in days.").default(30) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await priceTrend(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
