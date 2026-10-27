import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, marketCensus } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "upbit-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a market.",
        inputSchema: z.object({ market: z.string().describe("Market like KRW-BTC.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("market_census", {
        title: "Market census",
        description: "The whole Upbit market list as a census: how many markets, the quote currency split and how many distinct base assets, which assets list in the most markets, and the newest listings. Name an asset to see every market it trades in with its Korean and English names.",
        inputSchema: z.object({ asset: z.string().describe("Asset code such as BTC, to list the markets it trades in.").optional(), limit: z.number().describe("Rows to print, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await marketCensus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("orderbook_depth", {
        title: "Orderbook depth",
        description: "The live Upbit order book: best bid and ask, the spread in price and as a share of the mid, the size imbalance between the two sides across the levels read, Upbit's own total bid and ask size, the notional in the top levels and the widest visible spread.",
        inputSchema: z.object({ market: z.string().describe("Market like KRW-BTC."), levels: z.number().describe("Levels to read, 1-15.").optional() }),
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
    server.registerTool("candle_trend", {
        title: "Candle trend",
        description: "Read an Upbit candle series as volatility and trend: the net move across the window, the full range, the average true range, the per candle range, the realised volatility with a naive annualisation, the biggest up and down closes, the widest and lowest candle, and the volume and notional across the window.",
        inputSchema: z.object({ market: z.string().describe("Market like KRW-BTC."), unit: z.string().describe("Candle unit: minutes/60, days or weeks. Default minutes/60.").optional(), count: z.number().describe("Candles to fetch, 3-200.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement trend locally (paywall removed)
        try {
            return textError("Not yet implemented: trend");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "upbit-mcp";
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
