import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, tradingPairs } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bitstamp-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a pair.",
        inputSchema: z.object({ pair: z.string().describe("Pair like btcusd.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("order_book", {
        title: "Order book",
        description: "Live Bitstamp order book with best bid and ask, spread, top level notional depth and the ladder of both sides.",
        inputSchema: z.object({ pair: z.string().describe("Pair symbol, e.g. btcusd."), group: z.number().describe("Price grouping.").optional(), limit: z.number().describe("Levels per side.").optional() }),
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
    server.registerTool("ohlc_candles", {
        title: "OHLC candles",
        description: "Bitstamp candlestick history for a pair at a chosen step from one minute to three days, with open, high, low, close and volume per candle.",
        inputSchema: z.object({ pair: z.string().describe("Pair symbol, e.g. btcusd."), step: z.number().describe("Step in seconds, e.g. 3600 for hourly.").optional(), limit: z.number().describe("Max candles.").optional() }),
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
    server.registerTool("trading_pairs", {
        title: "Trading pairs",
        description: "List Bitstamp trading pairs with URL symbol, decimal places, minimum order size and whether trading and instant trading are enabled.",
        inputSchema: z.object({ trading_only: z.boolean().describe("Only enabled pairs.").optional(), search: z.string().describe("Filter by name or symbol.").optional(), limit: z.number().describe("Max pairs.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tradingPairs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bitstamp-mcp";
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
