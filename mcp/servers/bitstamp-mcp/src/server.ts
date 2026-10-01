import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, tradingPairs } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bitstamp-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a pair.",
      inputSchema: z.object( { pair: z.string().describe("Pair like btcusd.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "order_book",
    {
      title: "Order book",
      description: "Live Bitstamp order book with best bid and ask, spread, top level notional depth and the ladder of both sides.",
      inputSchema: z.object( { pair: z.string().describe("Pair symbol, e.g. btcusd."), group: z.number().describe("Price grouping.").optional(), limit: z.number().describe("Levels per side.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: order_book ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bitstamp_order_book", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "ohlc_candles",
    {
      title: "OHLC candles",
      description: "Bitstamp candlestick history for a pair at a chosen step from one minute to three days, with open, high, low, close and volume per candle.",
      inputSchema: z.object( { pair: z.string().describe("Pair symbol, e.g. btcusd."), step: z.number().describe("Step in seconds, e.g. 3600 for hourly.").optional(), limit: z.number().describe("Max candles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: ohlc_candles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bitstamp_ohlc_candles", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "trading_pairs",
    {
      title: "Trading pairs",
      description: "List Bitstamp trading pairs with URL symbol, decimal places, minimum order size and whether trading and instant trading are enabled.",
      inputSchema: z.object( { trading_only: z.boolean().describe("Only enabled pairs.").optional(), search: z.string().describe("Filter by name or symbol.").optional(), limit: z.number().describe("Max pairs.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tradingPairs(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
