import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker } from "./api.js"
import { premiumTool } from "./gateway.js"
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
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: candles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_okx_candles", args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: order_book ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_okx_order_book", args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: instruments ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_okx_instruments", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
