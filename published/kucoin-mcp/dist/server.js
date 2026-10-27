import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getServerTime, listSymbols, get24hStats, getOrderbook, getKlines, getFiatPrices, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "kucoin-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_server_time", {
        title: "Get server time",
        description: "KuCoin server timestamp for clock sync.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getServerTime());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_symbols", {
        title: "List trading symbols",
        description: "KuCoin trading pairs with base/quote currencies. Optional quote filter like USDT.",
        inputSchema: z.object({
            market: z.string().optional().describe("Quote currency filter, e.g. 'USDT'"),
        }),
        annotations: READ_ONLY,
    }, async ({ market }) => {
        try {
            return text(await listSymbols(market));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_24h_stats", {
        title: "Get 24h stats",
        description: "24h KuCoin stats for a symbol: last price, high, low, change rate, volume.",
        inputSchema: z.object({
            symbol: z.string().describe("Symbol like 'BTC-USDT'"),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol }) => {
        try {
            return text(await get24hStats(symbol));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_orderbook", {
        title: "Get order book",
        description: "KuCoin order book top bids and asks for a symbol.",
        inputSchema: z.object({
            symbol: z.string().describe("Symbol like 'BTC-USDT'"),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol }) => {
        try {
            return text(await getOrderbook(symbol));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_klines", {
        title: "Get klines",
        description: "KuCoin candlesticks for a symbol: time, open, close, high, low, volume.",
        inputSchema: z.object({
            symbol: z.string().describe("Symbol like 'BTC-USDT'"),
            type: z.string().default("1day").describe("Candle size: 1min, 1hour, 1day, 1week"),
            startAt: z.number().optional().describe("Start unix seconds"),
            endAt: z.number().optional().describe("End unix seconds"),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol, type, startAt, endAt }) => {
        try {
            return text(await getKlines(symbol, type, startAt, endAt));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_fiat_prices", {
        title: "Get fiat prices",
        description: "Fiat prices for crypto currencies, e.g. BTC and ETH in USD.",
        inputSchema: z.object({
            currencies: z.string().default("BTC,ETH").describe("Comma-separated currencies"),
            base: z.string().default("USD").describe("Fiat base currency"),
        }),
        annotations: READ_ONLY,
    }, async ({ currencies, base }) => {
        try {
            return text(await getFiatPrices(currencies, base));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "kucoin-mcp";
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
    return server;
}
