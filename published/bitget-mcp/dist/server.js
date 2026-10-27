import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, candles } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bitget-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a symbol.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like BTCUSDT.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("orderbook", {
        title: "Order book",
        description: "Read the Bitget spot order book ladder for a symbol: the levels on each side with their sizes, the best bid and ask, the spread in both price and percent of mid, and how concentrated the size is at the top level. The ticker reports one bid and one ask and nothing behind them.",
        inputSchema: z.object({
            symbol: z.string().describe("Symbol like BTCUSDT."),
            limit: z.number().int().min(1).max(150).optional().describe("Levels per side, 1 to 150. Bitget answers 150 for a larger request."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement orderbook locally (paywall removed)
        try {
            return textError("Not yet implemented: orderbook");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("candles", {
        title: "Candles",
        description: "Read recent Bitget spot OHLCV candles for a symbol at a chosen granularity and summarise the period: where the price ranged, how the last close sits against the first open, how many bars closed up against down, total traded volume, which bar was busiest, and the last ten bars in full. The ticker's 24 hour high and low cannot reconstruct a series.",
        inputSchema: z.object({
            symbol: z.string().describe("Symbol like BTCUSDT."),
            granularity: z.enum(["1min", "3min", "5min", "15min", "30min", "1h", "4h", "6h", "12h", "1day", "1week"]).optional().describe("Bar size. Bitget's spot route rejects other spellings, including 1H."),
            limit: z.number().int().min(1).max(200).optional().describe("Bars to read, 1 to 200."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await candles(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("contract_ticker", {
        title: "Contract ticker",
        description: "Read the Bitget USDT-margined perpetual contract for a symbol: last, bid and ask, the index price and the basis between them, the funding rate expressed per interval and per day, open interest, and the change against the UTC day open as well as the rolling 24 hour change. The existing ticker covers spot only, and this market reports an index price, a funding rate and open interest that spot has no field for.",
        inputSchema: z.object({
            symbol: z.string().describe("Symbol like BTCUSDT."),
            productType: z.string().optional().describe("Product type such as USDT-FUTURES. Defaults to USDT-FUTURES."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement ticker locally (paywall removed)
        try {
            return textError("Not yet implemented: ticker");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bitget-mcp";
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
