import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { markets, ticker } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "poloniex-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a market.",
        inputSchema: z.object({ symbol: z.string().describe("Market like BTC_USDT.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("markets", {
        title: "Markets",
        description: "List markets.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await markets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("price_candles", {
        title: "Price candles",
        description: "Recent OHLC candles for a Poloniex market at a chosen interval, with base volume and trade count per candle.",
        inputSchema: z.object({ symbol: z.string().describe("Market symbol, e.g. BTC_USDT."), interval: z.string().describe("MINUTE_1, MINUTE_5, MINUTE_15, MINUTE_30, HOUR_1, HOUR_4, HOUR_6, HOUR_12, DAY_1, DAY_3, WEEK_1 or MONTH_1.").optional(), limit: z.number().int().min(1).max(100).default(12).describe("Max candles.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement candles locally (paywall removed)
        try {
            return textError("Not yet implemented: candles");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("order_book", {
        title: "Order book",
        description: "Top bids and asks for a Poloniex market, with the best bid, best ask and the spread between them.",
        inputSchema: z.object({ symbol: z.string().describe("Market symbol, e.g. BTC_USDT."), depth_group: z.number().describe("Depth group percentage, 0 to 100.").optional(), depth: z.number().int().min(1).max(20).default(5).describe("Levels per side.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement book locally (paywall removed)
        try {
            return textError("Not yet implemented: book");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "poloniex-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
