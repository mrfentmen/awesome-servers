import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { depth, ticker, recentTrades } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "htx-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Get a market ticker.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like btcusdt.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("depth", {
        title: "Depth",
        description: "Get order book depth.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like btcusdt."), depth: z.number().describe("Depth steps.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await depth(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("candles", {
        title: "Candles",
        description: "OHLCV candles for a symbol and period.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like btcusdt."), period: z.string().describe("1min, 5min, 15min, 30min, 60min, 4hour, 1day, 1week, 1mon or 1year.").optional(), size: z.number().describe("Max candles.").optional() }),
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
        description: "Most recent public trades for a symbol.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like btcusdt."), limit: z.number().describe("Max trades.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentTrades(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "htx-mcp";
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
