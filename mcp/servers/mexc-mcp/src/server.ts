import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, orderBook } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mexc-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Current price for a trading pair.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "stats_24h",
    {
      title: "24h stats",
      description: "Rolling 24 hour statistics for a MEXC pair: change, open, high, low, best bid and ask, base and quote volume.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement 24h locally (paywall removed)
    try { return textError("Not yet implemented: 24h") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "candles",
    {
      title: "Candles",
      description: "MEXC candlesticks (OHLCV) for a pair at a chosen interval: 5m, 15m, 1h, 4h, 1d, 1w or 1M.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTCUSDT."), interval: z.enum(["5m", "15m", "1h", "4h", "1d", "1w", "1M"]).default("1d"), limit: z.number().int().min(1).max(100).default(7) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement candles locally (paywall removed)
    try { return textError("Not yet implemented: candles") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "order_book",
    {
      title: "Order book",
      description: "Live MEXC order book for a pair: the top bids and asks with their sizes, and the book timestamp.",
      inputSchema: z.object( { symbol: z.string().describe("Pair like BTCUSDT."), limit: z.number().int().min(1).max(100).default(5) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await orderBook(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
