import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, candlesticks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gateio-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Current price for a trading pair.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTC_USDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "order_book",
    {
      title: "Order book",
      description: "The live Gate.io order book for a spot pair: top bids and asks, and the spread between them.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTC_USDT or ETHUSDT."), limit: z.number().describe("Levels per side.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement book locally (paywall removed)
    try { return textError("Not yet implemented: book") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "recent_trades",
    {
      title: "Recent trades",
      description: "The most recent public trades on a Gate.io spot pair, each with side, amount, price and time.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTC_USDT."), limit: z.number().describe("Max trades.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement trades locally (paywall removed)
    try { return textError("Not yet implemented: trades") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "candlesticks",
    {
      title: "Candlesticks",
      description: "OHLC candlesticks for a Gate.io spot pair at a chosen interval, with open, high, low, close and both volumes.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTC_USDT."), interval: z.string().describe("10s, 1m, 5m, 15m, 30m, 1h, 4h, 8h, 1d, 7d or 30d.").optional(), limit: z.number().describe("Max candles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await candlesticks(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
