import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tickers, coin, globalStats, markets, movers, searchCoins, socialStats, rankRange, volumeLeaders, momentumGrid } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'coinlore-mcp', version: '1.0.0' });
    server.registerTool('tickers', {
        title: "Tickers",
        description: 'Top coins by market cap, with price and 24h change.',
        inputSchema: z.object({ limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tickers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('coin', {
        title: "Coin",
        description: 'One coin by its CoinLore id, e.g. 90 for Bitcoin.',
        inputSchema: z.object({ id: z.number().describe('CoinLore id.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await coin(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('globalStats', {
        title: "Global Stats",
        description: 'Global crypto market stats: total cap, volume, Bitcoin share.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await globalStats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('search_coins', {
        title: "Search coins",
        description: 'Find a coin by name or symbol among the top 100 by market cap, with its CoinLore id for the coin tool.',
        inputSchema: z.object({ query: z.string().describe('Coin name or symbol, e.g. "solana" or "ETH".'), limit: z.number().describe('Max results, 1-30.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchCoins(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('movers', {
        title: "Movers",
        description: 'Biggest 24-hour gainers and losers among the top 100 coins by market cap.',
        inputSchema: z.object({ limit: z.number().describe('How many gainers and how many losers to show, 1-20.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await movers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('markets', {
        title: "Markets",
        description: 'Markets for a coin id across exchanges, e.g. 90 for Bitcoin.',
        inputSchema: z.object({ id: z.number().describe('CoinLore id.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await markets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("social_stats", {
        title: "Social stats",
        description: "Reddit, Twitter and Telegram community sizes for a CoinLore coin id, e.g. 90 for Bitcoin.",
        inputSchema: z.object({ id: z.number().describe("CoinLore coin id, e.g. 90 for Bitcoin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await socialStats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rank_range", {
        title: "Rank range",
        description: "Coins in a rank window beyond the top 100, e.g. ranks 101-150, including the CoinLore id for the coin tool.",
        inputSchema: z.object({ start: z.number().describe("Zero-based rank offset, e.g. 100 starts at rank 101."), limit: z.number().describe("How many coins, 1-100. Defaults to 25.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rankRange(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("volume_leaders", {
        title: "Volume leaders",
        description: "Most-traded coins by 24h volume across the largest coins, with each coin's share of the sampled volume.",
        inputSchema: z.object({ limit: z.number().describe("How many coins, 1-25. Defaults to 10.").optional(), sample: z.number().describe("How many coins to rank, 25-200. Defaults to 100.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await volumeLeaders(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("supply_profile", {
        title: "Supply profile",
        description: "How much of a coin is actually in circulation against total issued and maximum supply, the remaining overhang, the fully diluted valuation at the current price versus the circulating market cap, and how fast the whole float turns over in a day. Coins that have not finished issuing are where the gap between these two valuations bites.",
        inputSchema: z.object({
            id: z.number().int().positive().describe("CoinLore coin id, for example 90 for Bitcoin."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cap_concentration", {
        title: "Market cap concentration",
        description: "How concentrated the crypto market is: BTC and ETH dominance, total cap against its all-time high, and the share of total market cap held by the biggest coins with a running cumulative share, so you can see how much of the market a handful of names account for.",
        inputSchema: z.object({
            sample: z.number().int().min(10).max(100).default(100).describe("How many top coins to measure, 10-100. Defaults to 100"),
            top: z.number().int().min(1).max(50).default(10).describe("How many leading coins to list, default 10"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement concentration locally (paywall removed)
        try {
            return textError("Not yet implemented: concentration");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("momentum_grid", {
        title: "Momentum grid",
        description: "Sorts the large caps by whether 24 hour and 7 day moves agree, using the 1 hour move to separate a real trend from a pullback, so a coin bouncing after a drop is not mistaken for one that is trending up.",
        inputSchema: z.object({
            sample: z.number().int().min(10).max(100).default(100).describe("How many top coins to classify, 10-100. Defaults to 100"),
            limit: z.number().int().min(1).max(20).default(6).describe("Coins to name per bucket, default 6"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await momentumGrid(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
