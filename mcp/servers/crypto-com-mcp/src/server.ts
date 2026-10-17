import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, orderBook, instruments } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "crypto-com-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTC_USDT.") }),
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
      description: "Live Crypto.com order book for an instrument: top bid and ask levels with price and quantity.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTC_USDT."), depth: z.number().describe("Levels per side, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await orderBook(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "candles",
    {
      title: "Candles",
      description: "OHLCV candles for a Crypto.com instrument: open, high, low, close and volume per interval.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTC_USDT."), timeframe: z.string().describe("1m, 5m, 15m, 30m, 1h, 4h, 6h, 12h, 1d, 7d, 14d or 1M.").optional(), count: z.number().describe("How many candles, 1-200.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement candles locally (paywall removed)
    try { return textError("Not yet implemented: candles") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "trades",
    {
      title: "Recent trades",
      description: "Most recent trades on a Crypto.com instrument: time, side, price and quantity.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTC_USDT."), limit: z.number().describe("How many trades, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement trades locally (paywall removed)
    try { return textError("Not yet implemented: trades") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "instruments",
    {
      title: "Instruments",
      description: "Search the Crypto.com instrument list by symbol or base currency, with instrument type and tradability.",
      inputSchema: z.object( { query: z.string().describe("Symbol or base currency, e.g. 'BTC'.").optional(), limit: z.number().describe("How many to show, 1-100.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instruments(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
