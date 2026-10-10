import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { price, ticker, recentTrades } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bitfinex-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like tBTCUSD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "price",
    {
      title: "Price",
      description: "Current price for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like tBTCUSD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await price(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "ohlcv_candles",
    {
      title: "OHLCV candles",
      description: "Historical trade candles for a symbol and interval, with open, high, low, close and volume per candle.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol, e.g. tBTCUSD."), period: z.string().describe("1m 5m 15m 30m 1h 3h 6h 12h 1D 1W 1M.").optional(), limit: z.number().describe("Max candles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: ohlcv_candles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bitfinex_ohlcv_candles", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recent_trades",
    {
      title: "Recent trades",
      description: "The most recent trades on a symbol with side, size, price and trade id.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol, e.g. tBTCUSD."), limit: z.number().describe("Max trades.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recentTrades(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "order_book",
    {
      title: "Order book",
      description: "Live Bitfinex order book for a symbol: top bid and ask levels with sizes, and the spread.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol, e.g. tBTCUSD."), levels: z.number().describe("Levels per side.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: order_book ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bitfinex_order_book", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
