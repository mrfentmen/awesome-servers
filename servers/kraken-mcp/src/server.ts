import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { assets } from "./api.js"
import { depth } from "./api.js"
import { ohlc } from "./api.js"
import { pairs } from "./api.js"
import { status } from "./api.js"
import { ticker } from "./api.js"
import { time } from "./api.js"

import { recentTrades } from "./api.js"
import { spreadHistory } from "./api.js"
import { pairDetails } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "kraken-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for one pair, e.g. XBTUSD.",
      inputSchema: z.object( { pair: z.string().describe("Pair like XBTUSD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "assets",
    {
      title: "Assets",
      description: "Tradeable assets with decimals and status.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await assets(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "pairs",
    {
      title: "Pairs",
      description: "How many trading pairs Kraken lists, with a 15-pair sample of wsname tickers. Full list omitted for size.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pairs()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "ohlc",
    {
      title: "OHLC candles",
      description: "Last 10 candles for a pair as date plus open/high/low/close/volume rows.",
      inputSchema: z.object( { pair: z.string().describe("Pair like XBTUSD."), interval: z.number().describe("Candle minutes, e.g. 60, 1440, 10080. Defaults to 1440.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ohlc(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "depth",
    {
      title: "Order book",
      description: "Top of book for a pair as ask and bid price x volume rows.",
      inputSchema: z.object( { pair: z.string().describe("Pair like XBTUSD."), count: z.number().describe("Book depth each side, 1-25. Defaults to 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await depth(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "time",
    {
      title: "Server time",
      description: "Kraken server time as RFC1123 string and epoch, useful for timestamping quotes.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await time()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "status",
    {
      title: "System status",
      description: "Whether Kraken reports itself online, with the status timestamp.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await status()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "recent_trades",
    {
      title: "Recent trades",
      description: "The tape: last trades with side, VWAP, buy/sell split and the largest print.",
      inputSchema: z.object({
        pair: z.string().describe("Pair like XBTUSD."),
        count: z.number().describe("Trades to fetch, 20-100 (default 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await recentTrades(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "spread_history",
    {
      title: "Spread history",
      description: "Bid/ask spread over recent quotes in absolute terms and basis points, with tightest and widest.",
      inputSchema: z.object({
        pair: z.string().describe("Pair like XBTUSD."),
        count: z.number().describe("Quotes to fetch, 20-100 (default 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await spreadHistory(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "pair_details",
    {
      title: "Pair details",
      description: "Trading rules for one pair: decimals, tick size, minimum order, leverage and fee tiers.",
      inputSchema: z.object({
        pair: z.string().describe("Pair like XBTUSD.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await pairDetails(args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
