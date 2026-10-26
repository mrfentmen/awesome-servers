import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { auctionByDate, auctionCompare, auctionSummary, auctions, marketTrend, seasonality, topAuctions, marketMomentum, auctionLeaderboard, slugHeadToHead, marketStructure } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "whiskyhunter-mcp", version: "1.0.0" });
    server.registerTool("auctions", {
        title: "Auctions",
        description: "Whisky auction results: mean winning bid, trading volume and lots sold per month. " +
            "Optionally filter to one auction house by slug, e.g. 'bonhams'.",
        inputSchema: z.object({
            auction: z.string().describe("Auction slug, e.g. 'bonhams', 'ebay-whisky-auctions'. Omit for all.").optional(),
            limit: z.number().describe("Max records to show (default 10, max 40).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auctions(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("auction_by_date", {
        title: "Auctions by date",
        description: "Every auction house's results for one month, ranked by trading volume.",
        inputSchema: z.object({
            date: z.string().describe("Date as YYYY-MM-DD, e.g. '2024-09-01'."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auctionByDate(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("auction_summary", {
        title: "Auction summary",
        description: "Aggregate stats for one auction house, or the whole whisky auction market: bids, volumes and lots.",
        inputSchema: z.object({
            auction: z.string().describe("Auction slug. Omit to summarise the whole market.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auctionSummary(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_auctions", {
        title: "Top auctions",
        description: "Rank whisky auction houses by total trading volume, lots sold, or average winning bid.",
        inputSchema: z.object({
            metric: z.enum(["volume", "lots", "mean_bid"]).describe("Ranking metric (default volume).").optional(),
            limit: z.number().describe("Max auctions to show (default 10, max 31).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topAuctions(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("market_trend", {
        title: "Market trend",
        description: "Mean winning bid per month over time, for one auction house or the whole market.",
        inputSchema: z.object({
            auction: z.string().describe("Auction slug. Omit for the whole market.").optional(),
            points: z.number().describe("How many recent months to show (default 12, max 40).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await marketTrend(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("seasonality", {
        title: "Auction seasonality",
        description: "Show which calendar months historically fetch the highest mean winning bid and volume, averaged across every year in the dataset.",
        inputSchema: z.object({
            auction: z.string().describe("Optional auction slug to narrow to one house, e.g. 'whiskyauctioneer'.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await seasonality(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("auction_compare", {
        title: "Compare auctions",
        description: "Compare two or more auction houses side by side: record counts, date range, mean and highest winning bid, total volume and their latest months.",
        inputSchema: z.object({
            auctions: z.string().describe("Comma separated auction slugs, e.g. 'whiskyauctioneer,scotchwhiskyauctions'."),
            limit: z.number().describe("How many latest months to show per auction, 2-30.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auctionCompare(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("market_momentum", {
        title: "Market momentum",
        description: "Compare the most recent months of whisky auction results against the months before them: mean winning bid, trading volume and lots, with the percent change.",
        inputSchema: z.object({
            auction: z.string().describe("Auction slug, e.g. 'whiskyauctioneer'. Omit for the whole market.").optional(),
            months: z.number().describe("Months in each window (default 6, max 24).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await marketMomentum(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("auction_leaderboard", {
        title: "Monthly leaderboard",
        description: "Rank auction houses over the last few recorded months by trading volume, lots sold or mean winning bid, including each house's share of the volume traded.",
        inputSchema: z.object({
            months: z.number().describe("How many recent months to rank over (default 3, max 12).").optional(),
            metric: z.enum(["volume", "lots", "mean_bid"]).describe("Ranking metric (default volume).").optional(),
            limit: z.number().describe("Max auction houses to show (default 10, max 31).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auctionLeaderboard(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("slug_head_to_head", {
        title: "Head to head",
        description: "Two auction houses month by month on volume, lots or winning bid: which one won each month, the tally, and the all-time totals.",
        inputSchema: z.object({
            a: z.string().describe("First auction slug, e.g. 'whiskyauctioneer'."),
            b: z.string().describe("Second auction slug, e.g. 'scotchwhiskyauctions'."),
            months: z.number().describe("How many recent months to compare (default 12, max 40).").optional(),
            metric: z.enum(["volume", "lots", "mean_bid"]).describe("Metric to compare on (default volume).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await slugHeadToHead(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("liquidity_profile", {
        title: "Liquidity profile",
        description: "How much each auction house actually sells rather than what its bottles fetch: lots, trading volume, realised value per lot and share of the recorded market, with the same houses re-ranked by mean hammer for contrast. Separates a volume seller from a boutique.",
        inputSchema: z.object({
            months: z.number().describe("Window in months, 3-120. Defaults to 24.").optional(),
            limit: z.number().describe("Houses listed, 1-31. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: liquidity_profile ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_whiskyhunter_liquidity_profile", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("market_structure", {
        title: "Market structure",
        description: "The market as a whole rather than one house: lots and traded value per year, the market's mean hammer, how many houses reported, and how concentrated the top five are in each year. Shows a market shrinking under a house that is growing.",
        inputSchema: z.object({
            years: z.number().describe("Window in years, 3-24. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await marketStructure(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
