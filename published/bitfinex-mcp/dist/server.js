import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { price, ticker, recentTrades } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bitfinex-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a symbol.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like tBTCUSD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("price", {
        title: "Price",
        description: "Current price for a symbol.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like tBTCUSD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await price(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ohlcv_candles", {
        title: "OHLCV candles",
        description: "Historical trade candles for a symbol and interval, with open, high, low, close and volume per candle.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol, e.g. tBTCUSD."), period: z.string().describe("1m 5m 15m 30m 1h 3h 6h 12h 1D 1W 1M.").optional(), limit: z.number().describe("Max candles.").optional() }),
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
    server.registerTool("recent_trades", {
        title: "Recent trades",
        description: "The most recent trades on a symbol with side, size, price and trade id.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol, e.g. tBTCUSD."), limit: z.number().describe("Max trades.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentTrades(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("order_book", {
        title: "Order book",
        description: "Live Bitfinex order book for a symbol: top bid and ask levels with sizes, and the spread.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol, e.g. tBTCUSD."), levels: z.number().describe("Levels per side.").optional() }),
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
    const serverName = "bitfinex-mcp";
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
    return server;
}
