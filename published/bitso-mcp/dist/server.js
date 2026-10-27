import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker, tradingFees } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bitso-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a book.",
        inputSchema: z.object({ book: z.string().describe("Book like btc_mxn.") }),
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
        title: "Order book depth",
        description: "Bitso order book for a book: best bid and ask, spread, notional depth and the top levels.",
        inputSchema: z.object({ book: z.string().describe("Book like btc_mxn.").optional(), levels: z.number().describe("Levels per side, 1-20.").optional() }),
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
    server.registerTool("market_movers", {
        title: "Market movers",
        description: "Biggest 24h gainers and losers across every Bitso market, plus the busiest books by turnover.",
        inputSchema: z.object({ limit: z.number().describe("How many per list, 1-15.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement movers locally (paywall removed)
        try {
            return textError("Not yet implemented: movers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trading_fees", {
        title: "Trading fees",
        description: "Maker and taker fees, volume tiers, tick size and order limits for a Bitso book.",
        inputSchema: z.object({ book: z.string().describe("Book like btc_mxn.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tradingFees(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bitso-mcp";
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
