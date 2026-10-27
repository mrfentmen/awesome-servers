import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, orderBook, instruments } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "crypto-com-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a symbol.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like BTC_USDT.") }),
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
        description: "Live Crypto.com order book for an instrument: top bid and ask levels with price and quantity.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like BTC_USDT."), depth: z.number().describe("Levels per side, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await orderBook(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("candles", {
        title: "Candles",
        description: "OHLCV candles for a Crypto.com instrument: open, high, low, close and volume per interval.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like BTC_USDT."), timeframe: z.string().describe("1m, 5m, 15m, 30m, 1h, 4h, 6h, 12h, 1d, 7d, 14d or 1M.").optional(), count: z.number().describe("How many candles, 1-200.").optional() }),
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
    server.registerTool("trades", {
        title: "Recent trades",
        description: "Most recent trades on a Crypto.com instrument: time, side, price and quantity.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like BTC_USDT."), limit: z.number().describe("How many trades, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement trades locally (paywall removed)
        try {
            return textError("Not yet implemented: trades");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("instruments", {
        title: "Instruments",
        description: "Search the Crypto.com instrument list by symbol or base currency, with instrument type and tradability.",
        inputSchema: z.object({ query: z.string().describe("Symbol or base currency, e.g. 'BTC'.").optional(), limit: z.number().describe("How many to show, 1-100.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await instruments(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "crypto-com-mcp";
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
