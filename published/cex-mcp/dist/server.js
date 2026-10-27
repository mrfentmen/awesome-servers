import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, cexTradingLimits } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "cex-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a pair.",
        inputSchema: z.object({ pair: z.string().describe("Pair like BTC/USD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("order_book_depth", {
        title: "Order Book Depth",
        description: "Live CEX.IO order book: spread, mid price and the top bid/ask levels.",
        inputSchema: z.object({ pair: z.string().describe("Pair like BTC/USD.").optional(), levels: z.number().describe("Levels per side, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement depth locally (paywall removed)
        try {
            return textError("Not yet implemented: depth");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("market_trades", {
        title: "Market Trades",
        description: "Summarise the recent CEX.IO trade tape: buy/sell split, volume-weighted price, largest trade.",
        inputSchema: z.object({ pair: z.string().describe("Pair like BTC/USD.").optional(), limit: z.number().describe("Trades to list, 1-25.").optional(), window: z.number().describe("Trades to summarise, 1-1000.").optional() }),
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
    server.registerTool("trading_limits", {
        title: "Trading Limits",
        description: "Minimum order size, price precision and allowed price range for a CEX.IO market.",
        inputSchema: z.object({ pair: z.string().describe("Pair like BTC/USD.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cexTradingLimits(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "cex-mcp";
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
