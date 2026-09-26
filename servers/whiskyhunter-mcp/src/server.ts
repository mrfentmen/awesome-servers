import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { auctionByDate, auctionCompare, auctionSummary, auctions, marketTrend, seasonality, topAuctions } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "whiskyhunter-mcp", version: "1.0.0" })
  server.registerTool(
    "auctions",
    {
      title: "Auctions",
      description:
        "Whisky auction results: mean winning bid, trading volume and lots sold per month. " +
        "Optionally filter to one auction house by slug, e.g. 'bonhams'.",
      inputSchema: z.object({
        auction: z.string().describe("Auction slug, e.g. 'bonhams', 'ebay-whisky-auctions'. Omit for all.").optional(),
        limit: z.number().describe("Max records to show (default 10, max 40).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await auctions(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "auction_by_date",
    {
      title: "Auctions by date",
      description: "Every auction house's results for one month, ranked by trading volume.",
      inputSchema: z.object({
        date: z.string().describe("Date as YYYY-MM-DD, e.g. '2024-09-01'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await auctionByDate(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "auction_summary",
    {
      title: "Auction summary",
      description: "Aggregate stats for one auction house, or the whole whisky auction market: bids, volumes and lots.",
      inputSchema: z.object({
        auction: z.string().describe("Auction slug. Omit to summarise the whole market.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await auctionSummary(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "top_auctions",
    {
      title: "Top auctions",
      description: "Rank whisky auction houses by total trading volume, lots sold, or average winning bid.",
      inputSchema: z.object({
        metric: z.enum(["volume", "lots", "mean_bid"]).describe("Ranking metric (default volume).").optional(),
        limit: z.number().describe("Max auctions to show (default 10, max 31).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await topAuctions(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "market_trend",
    {
      title: "Market trend",
      description: "Mean winning bid per month over time, for one auction house or the whole market.",
      inputSchema: z.object({
        auction: z.string().describe("Auction slug. Omit for the whole market.").optional(),
        points: z.number().describe("How many recent months to show (default 12, max 40).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await marketTrend(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "seasonality",
    {
      title: "Auction seasonality",
      description: "Show which calendar months historically fetch the highest mean winning bid and volume, averaged across every year in the dataset.",
      inputSchema: z.object({
        auction: z.string().describe("Optional auction slug to narrow to one house, e.g. 'whiskyauctioneer'.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await seasonality(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "auction_compare",
    {
      title: "Compare auctions",
      description: "Compare two or more auction houses side by side: record counts, date range, mean and highest winning bid, total volume and their latest months.",
      inputSchema: z.object({
        auctions: z.string().describe("Comma separated auction slugs, e.g. 'whiskyauctioneer,scotchwhiskyauctions'."),
        limit: z.number().describe("How many latest months to show per auction, 2-30.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await auctionCompare(args)) } catch (e) { return textError(error(e)) }
    }
  )
  return server
}
