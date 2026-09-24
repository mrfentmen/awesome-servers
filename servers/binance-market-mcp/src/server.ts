import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { klines } from "./api.js"
import { price } from "./api.js"
import { ticker } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "binance-market-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Get the 24 hour ticker for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "klines",
    {
      title: "Klines",
      description: "Get candlestick data for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT."), interval: z.string().describe("1m, 1h, 1d, or 1w.").optional(), limit: z.number().describe("Max candles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await klines(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "price",
    {
      title: "Price",
      description: "Get the current price for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await price(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
