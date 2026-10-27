import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, orderBook } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mexc-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Current price for a trading pair.",
        inputSchema: z.object({ symbol: z.string().describe("Pair like BTCUSDT.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stats_24h", {
        title: "24h stats",
        description: "Rolling 24 hour statistics for a MEXC pair: change, open, high, low, best bid and ask, base and quote volume.",
        inputSchema: z.object({ symbol: z.string().describe("Pair like BTCUSDT.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement 24h locally (paywall removed)
        try {
            return textError("Not yet implemented: 24h");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("candles", {
        title: "Candles",
        description: "MEXC candlesticks (OHLCV) for a pair at a chosen interval: 5m, 15m, 1h, 4h, 1d, 1w or 1M.",
        inputSchema: z.object({ symbol: z.string().describe("Pair like BTCUSDT."), interval: z.enum(["5m", "15m", "1h", "4h", "1d", "1w", "1M"]).default("1d"), limit: z.number().int().min(1).max(100).default(7) }),
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
        description: "Live MEXC order book for a pair: the top bids and asks with their sizes, and the book timestamp.",
        inputSchema: z.object({ symbol: z.string().describe("Pair like BTCUSDT."), limit: z.number().int().min(1).max(100).default(5) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await orderBook(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mexc-mcp";
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
