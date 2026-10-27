import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { coin, exchanges, exchangeMarkets, globalStats, markets, ohlcvToday, tags, ticker, tickers } from "./api.js";
import { search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "coinpaprika-mcp", version: "1.0.0" });
    server.registerTool("coin", {
        title: "Coin",
        description: "Details for one coin.",
        inputSchema: z.object({ id: z.string().describe("Coin id like btc-bitcoin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await coin(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search coins.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Price and 24h change for a coin.",
        inputSchema: z.object({ id: z.string().describe("Coin id like btc-bitcoin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("tickers", {
        title: "Tickers",
        description: "Top tickers by market cap.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tickers(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("markets", {
        title: "Markets",
        description: "Exchange markets for a coin.",
        inputSchema: z.object({ id: z.string().describe("Coin id like btc-bitcoin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await markets(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("ohlcv_today", {
        title: "OHLCV today",
        description: "Today's open/high/low/close/volume.",
        inputSchema: z.object({ id: z.string().describe("Coin id like btc-bitcoin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ohlcvToday(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("exchanges", {
        title: "Exchanges",
        description: "Crypto exchanges list.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await exchanges(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("exchange_markets", {
        title: "Exchange markets",
        description: "Top markets on one exchange.",
        inputSchema: z.object({ id: z.string().describe("Exchange id like binance.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await exchangeMarkets(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("tags", {
        title: "Tags",
        description: "Coin categories and tags.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tags(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("global_stats", {
        title: "Global stats",
        description: "Market cap, volume, BTC dominance.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await globalStats());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
