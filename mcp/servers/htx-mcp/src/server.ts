import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { depth, ticker, recentTrades } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "htx-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Get a market ticker.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like btcusdt.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "depth",
    {
      title: "Depth",
      description: "Get order book depth.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like btcusdt."), depth: z.number().describe("Depth steps.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await depth(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "candles",
    {
      title: "Candles",
      description: "OHLCV candles for a symbol and period.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like btcusdt."), period: z.string().describe("1min, 5min, 15min, 30min, 60min, 4hour, 1day, 1week, 1mon or 1year.").optional(), size: z.number().describe("Max candles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement candles locally (paywall removed)
    try { return textError("Not yet implemented: candles") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "recent_trades",
    {
      title: "Recent trades",
      description: "Most recent public trades for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like btcusdt."), limit: z.number().describe("Max trades.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recentTrades(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
