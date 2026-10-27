import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ticker } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bithumb-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a coin.",
        inputSchema: z.object({ coin: z.string().describe("Coin like BTC.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("all_tickers", {
        title: "All tickers",
        description: "Ranked Bithumb market for every listed coin in KRW or BTC, showing last price, 24 hour change, volume and traded value.",
        inputSchema: z.object({ quote: z.string().describe("KRW or BTC.").optional(), sort_by: z.string().describe("value, volume or change.").optional(), limit: z.number().describe("Max coins.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tickers locally (paywall removed)
        try {
            return textError("Not yet implemented: tickers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("coin_order_book", {
        title: "Coin order book",
        description: "Bithumb KRW order book for one coin with best bid and ask, spread, mid price and the full ladder of both sides.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol, e.g. BTC."), limit: z.number().describe("Levels per side.").optional() }),
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
    const serverName = "bithumb-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
