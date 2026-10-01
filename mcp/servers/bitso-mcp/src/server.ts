import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, tradingFees } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bitso-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a book.",
      inputSchema: z.object( { book: z.string().describe("Book like btc_mxn.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "order_book_depth",
    {
      title: "Order book depth",
      description: "Bitso order book for a book: best bid and ask, spread, notional depth and the top levels.",
      inputSchema: z.object( { book: z.string().describe("Book like btc_mxn.").optional(), levels: z.number().describe("Levels per side, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: order_book_depth ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bitso_order_book_depth", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "market_movers",
    {
      title: "Market movers",
      description: "Biggest 24h gainers and losers across every Bitso market, plus the busiest books by turnover.",
      inputSchema: z.object( { limit: z.number().describe("How many per list, 1-15.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: market_movers ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bitso_market_movers", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "trading_fees",
    {
      title: "Trading fees",
      description: "Maker and taker fees, volume tiers, tick size and order limits for a Bitso book.",
      inputSchema: z.object( { book: z.string().describe("Book like btc_mxn.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tradingFees(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
