import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "okx-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Current price for a trading pair.",
      inputSchema: z.object( { instId: z.string().describe("Instrument like BTC-USDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "candles",
    {
      title: "Candles",
      description: "OHLCV candles for an OKX instrument over a chosen bar size, which a last-price ticker cannot give you.",
      inputSchema: z.object( { instrument: z.string().describe("Instrument, e.g. BTC-USDT."), bar: z.string().describe("1m, 5m, 15m, 1H, 4H, 1D or 1W.").optional(), limit: z.number().describe("Max candles.").optional() }),
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
      description: "OKX's live order book for an instrument, listing bid and ask levels with their order counts, which is what actually sits in front of the last price.",
      inputSchema: z.object( { instrument: z.string().describe("Instrument, e.g. BTC-USDT."), depth: z.number().describe("Levels per side.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement book locally (paywall removed)
    try { return textError("Not yet implemented: book") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "instruments",
    {
      title: "Instruments",
      description: "OKX's tradable instrument list for spot, swaps, futures or options, with each instrument's state, tick size and minimum size.",
      inputSchema: z.object( { instType: z.string().describe("SPOT, SWAP, FUTURES or OPTION.").optional(), query: z.string().describe("Filter on the instrument id.").optional(), limit: z.number().describe("Max instruments.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement instruments locally (paywall removed)
    try { return textError("Not yet implemented: instruments") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
