import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, cexTradingLimits } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cex-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a pair.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC/USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "order_book_depth",
    {
      title: "Order Book Depth",
      description: "Live CEX.IO order book: spread, mid price and the top bid/ask levels.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC/USD.").optional(), levels: z.number().describe("Levels per side, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: order_book_depth ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cex_order_book_depth", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "market_trades",
    {
      title: "Market Trades",
      description: "Summarise the recent CEX.IO trade tape: buy/sell split, volume-weighted price, largest trade.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC/USD.").optional(), limit: z.number().describe("Trades to list, 1-25.").optional(), window: z.number().describe("Trades to summarise, 1-1000.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: market_trades ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cex_market_trades", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "trading_limits",
    {
      title: "Trading Limits",
      description: "Minimum order size, price precision and allowed price range for a CEX.IO market.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC/USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cexTradingLimits(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
