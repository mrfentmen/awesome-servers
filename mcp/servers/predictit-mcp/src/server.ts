import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { arbitrageCheck, biggestMovers, contractPrice, marketDetail, marketSummary, markets, searchMarkets, compareMarkets, searchContracts, longShots } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "predictit-mcp", version: "1.0.0" })
  server.registerTool(
    "markets",
    {
      title: "Markets",
      description:
        "List PredictIt prediction markets with their leading contract, ranked by that contract's yes price. " +
        "A yes price is the market's implied probability.",
      inputSchema: z.object({
        status: z.enum(["Open", "Closed", "all"]).describe("Market status filter (default Open).").optional(),
        limit: z.number().describe("Max markets to show (default 15, max 40).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await markets(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "search_markets",
    {
      title: "Search markets",
      description: "Search PredictIt markets by keyword, e.g. 'election', 'Fed', 'bitcoin', 'oscars'.",
      inputSchema: z.object({
        query: z.string().describe("Search keyword."),
        limit: z.number().describe("Max markets to show (default 15, max 40).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchMarkets(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "market_detail",
    {
      title: "Market detail",
      description: "Every contract in one market with full buy/sell yes and no prices.",
      inputSchema: z.object({
        market_id: z.string().describe("Numeric market id, e.g. '7589'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await marketDetail(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "contract_price",
    {
      title: "Contract price",
      description: "Price and implied probability for one named contract inside a market.",
      inputSchema: z.object({
        market_id: z.string().describe("Numeric market id, e.g. '7589'."),
        contract: z.string().describe("Contract name or short name (partial match ok), e.g. 'Democrats sweep'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await contractPrice(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "biggest_movers",
    {
      title: "Biggest movers",
      description: "Contracts whose last trade price moved most versus the previous close, across all markets.",
      inputSchema: z.object({
        limit: z.number().describe("Max contracts to show (default 10, max 25).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await biggestMovers(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "market_summary",
    {
      title: "Exchange summary",
      description: "Totals across PredictIt right now — how many markets are open, how many contracts trade — plus the most contested open markets.",
      inputSchema: z.object({
        limit: z.number().describe("How many contested markets to list, 1-25.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await marketSummary(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "arbitrage_check",
    {
      title: "Arbitrage check",
      description: "Add up every YES price in each open PredictIt market and flag fields whose total is under $1.00, where buying the whole field could cost less than the payout. Only applies to markets whose outcomes are mutually exclusive.",
      inputSchema: z.object({
        limit: z.number().describe("How many markets to list per group, 1-25.").optional(),
        threshold: z.number().describe("Flag markets whose YES total is below this, default 0.97.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await arbitrageCheck(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "compare_markets",
    {
      title: "Compare markets",
      description:
        "Two to five markets side by side, contract by contract, with today's move on each and which market is the most decided and which is the most open.",
      inputSchema: z.object({
        markets: z.array(z.string()).describe('Market ids or name fragments, e.g. ["28361", "control of the senate"]'),
      }),
      annotations: READ_ONLY,
    },
    async ({ markets }) => {
      try {
        return text(await compareMarkets({ markets }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_contracts",
    {
      title: "Search contracts",
      description:
        "Search the tradeable contracts across every market by name, with each contract's price, last trade and the market it belongs to.",
      inputSchema: z.object({
        query: z.string().describe("Contract name fragment, e.g. 'governor' or 'nominee'"),
        limit: z.number().describe("How many contracts to list, 1-50. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchContracts({ query, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "long_shots",
    {
      title: "Long shots",
      description:
        "Open contracts the market prices as unlikely, cheapest first, with the multiple each one returns if it pays out and the market it sits in.",
      inputSchema: z.object({
        maxPrice: z.number().describe("Highest yes price to include, e.g. 0.1 for 10 cents. Defaults to 0.1.").optional(),
        limit: z.number().describe("How many contracts to list, 1-50. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ maxPrice, limit }) => {
      try {
        return text(await longShots({ maxPrice, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "expiry_ladder",
    {
      title: "Settlement calendar",
      description:
        "Every PredictIt contract that has a real settlement date, ordered by how long it has left, with its last trade, its bid and its move against the previous close. Contracts with no date never expire.",
      inputSchema: z.object({
        limit: z.number().describe("Max contracts, 1-30. Defaults to 15.").optional(),
        within_days: z.number().describe("Only show contracts settling within this many days, 0 for no limit.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement ladder locally (paywall removed)
    try { return textError("Not yet implemented: ladder") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "spread_analysis",
    {
      title: "Order-book depth",
      description:
        "How deep the market is behind a price: the bid-ask spread on every quoted contract, its distribution, the widest books, and where the last trade sat against the bid.",
      inputSchema: z.object({
        limit: z.number().describe("Max contracts listed, 1-25. Defaults to 12.").optional(),
        min_spread_cents: z.number().describe("Only list contracts whose spread is at least this many cents.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement analysis locally (paywall removed)
    try { return textError("Not yet implemented: analysis") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
