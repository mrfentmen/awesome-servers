import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { assets } from "./api.js";
import { depth } from "./api.js";
import { ohlc } from "./api.js";
import { pairs } from "./api.js";
import { status } from "./api.js";
import { ticker } from "./api.js";
import { time } from "./api.js";
import { recentTrades } from "./api.js";
import { spreadHistory } from "./api.js";
import { pairDetails, crossExchangePrice, liquidityMap } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "kraken-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for one pair, e.g. XBTUSD.",
        inputSchema: z.object({ pair: z.string().describe("Pair like XBTUSD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("assets", {
        title: "Assets",
        description: "Tradeable assets with decimals and status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await assets(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("pairs", {
        title: "Pairs",
        description: "How many trading pairs Kraken lists, with a 15-pair sample of wsname tickers. Full list omitted for size.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pairs());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("ohlc", {
        title: "OHLC candles",
        description: "Last 10 candles for a pair as date plus open/high/low/close/volume rows.",
        inputSchema: z.object({ pair: z.string().describe("Pair like XBTUSD."), interval: z.number().describe("Candle minutes, e.g. 60, 1440, 10080. Defaults to 1440.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ohlc(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("depth", {
        title: "Order book",
        description: "Top of book for a pair as ask and bid price x volume rows.",
        inputSchema: z.object({ pair: z.string().describe("Pair like XBTUSD."), count: z.number().describe("Book depth each side, 1-25. Defaults to 5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await depth(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("time", {
        title: "Server time",
        description: "Kraken server time as RFC1123 string and epoch, useful for timestamping quotes.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await time());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("status", {
        title: "System status",
        description: "Whether Kraken reports itself online, with the status timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await status());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("recent_trades", {
        title: "Recent trades",
        description: "The tape: last trades with side, VWAP, buy/sell split and the largest print.",
        inputSchema: z.object({
            pair: z.string().describe("Pair like XBTUSD."),
            count: z.number().describe("Trades to fetch, 20-100 (default 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentTrades(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("spread_history", {
        title: "Spread history",
        description: "Bid/ask spread over recent quotes in absolute terms and basis points, with tightest and widest.",
        inputSchema: z.object({
            pair: z.string().describe("Pair like XBTUSD."),
            count: z.number().describe("Quotes to fetch, 20-100 (default 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spreadHistory(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("pair_details", {
        title: "Pair details",
        description: "Trading rules for one pair: decimals, tick size, minimum order, leverage and fee tiers.",
        inputSchema: z.object({
            pair: z.string().describe("Pair like XBTUSD.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pairDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("cross_exchange_price", {
        title: "Cross-exchange price",
        description: "The same asset on Kraken, Coinbase and Bitstamp at once, with each venue's bid and ask and the gap between the cheapest and dearest venue.",
        inputSchema: z.object({ symbol: z.string().describe("Asset symbol, e.g. BTC, ETH or SOL") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await crossExchangePrice(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("liquidity_map", {
        title: "Liquidity map",
        description: "A market-wide view of which Kraken pairs are actually liquid: last price, 24 hour volume and spread in basis points, ranked by volume, with the tightest and widest spread called out.",
        inputSchema: z.object({ quote: z.string().describe("Quote asset filter, e.g. USD.").optional(), limit: z.number().int().min(1).max(40).default(15).describe("How many pairs to print (default 15, max 40)."), min_volume: z.number().min(0).default(100000).describe("Only pairs with at least this 24 hour volume (default 100,000).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await liquidityMap(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
