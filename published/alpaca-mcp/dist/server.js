import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { account, positions, orders, orderDetails, positionDetails, marketClock, calendar, listAssets, watchlists, portfolioHistory, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "alpaca-mcp",
        version: "1.0.0",
    });
    server.registerTool("account", {
        title: "Account",
        description: "Buying power, equity and cash for the trading account.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await account());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("positions", {
        title: "Positions",
        description: "Open positions with symbol, quantity and unrealized P/L.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await positions());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("orders", {
        title: "Orders",
        description: "Recent orders with side, quantity, status and fill price.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await orders(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("order_details", {
        title: "Order details",
        description: "Single order.",
        inputSchema: z.object({
            order_id: z.string().describe("Order UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ order_id }) => {
        try {
            return text(await orderDetails(order_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("position_details", {
        title: "Position details",
        description: "Position in symbol.",
        inputSchema: z.object({
            symbol: z.string().describe("e.g. AAPL.")
        }),
        annotations: READ_ONLY,
    }, async ({ symbol }) => {
        try {
            return text(await positionDetails(symbol));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("market_clock", {
        title: "Market clock",
        description: "Open/closed + times.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await marketClock());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("calendar", {
        title: "Market calendar",
        description: "Open days.",
        inputSchema: z.object({
            start: z.string().describe("YYYY-MM-DD.").optional(),
            end: z.string().describe("YYYY-MM-DD.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ start, end }) => {
        try {
            return text(await calendar(start, end));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_assets", {
        title: "List assets",
        description: "Tradable US equities.",
        inputSchema: z.object({
            status: z.string().describe("active/inactive (default active).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ status }) => {
        try {
            return text(await listAssets(status));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("watchlists", {
        title: "Watchlists",
        description: "Saved watchlists.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await watchlists());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("portfolio_history", {
        title: "Portfolio history",
        description: "Equity curve.",
        inputSchema: z.object({
            period: z.string().describe("e.g. 1M (default 1M).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ period }) => {
        try {
            return text(await portfolioHistory(period));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
