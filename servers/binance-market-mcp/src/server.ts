import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { avg } from "./api.js"
import { book } from "./api.js"
import { depth } from "./api.js"
import { klines } from "./api.js"
import { markets } from "./api.js"
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
  server.registerTool(
    "book",
    {
      title: "Best bid/ask",
      description: "Best bid and ask with quantities for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await book(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "avg",
    {
      title: "Average price",
      description: "5-minute average price for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await avg(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "depth",
    {
      title: "Order book",
      description: "Top bids and asks with quantities for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT."), limit: z.number().describe("Book depth each side, 1-20. Defaults to 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await depth(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "markets",
    {
      title: "Markets",
      description: "How many symbols Binance lists with a TRADING count and a 12-symbol sample. Full list omitted for size.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await markets()) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
