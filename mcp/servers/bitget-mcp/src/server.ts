import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, candles } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bitget-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSDT.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "orderbook",
    {
      title: "Order book",
      description: "Read the Bitget spot order book ladder for a symbol: the levels on each side with their sizes, the best bid and ask, the spread in both price and percent of mid, and how concentrated the size is at the top level. The ticker reports one bid and one ask and nothing behind them.",
      inputSchema: z.object({
        symbol: z.string().describe("Symbol like BTCUSDT."),
        limit: z.number().int().min(1).max(150).optional().describe("Levels per side, 1 to 150. Bitget answers 150 for a larger request."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: orderbook ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_bitget_orderbook", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "candles",
    {
      title: "Candles",
      description: "Read recent Bitget spot OHLCV candles for a symbol at a chosen granularity and summarise the period: where the price ranged, how the last close sits against the first open, how many bars closed up against down, total traded volume, which bar was busiest, and the last ten bars in full. The ticker's 24 hour high and low cannot reconstruct a series.",
      inputSchema: z.object({
        symbol: z.string().describe("Symbol like BTCUSDT."),
        granularity: z.enum(["1min", "3min", "5min", "15min", "30min", "1h", "4h", "6h", "12h", "1day", "1week"]).optional().describe("Bar size. Bitget's spot route rejects other spellings, including 1H."),
        limit: z.number().int().min(1).max(200).optional().describe("Bars to read, 1 to 200."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await candles(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "contract_ticker",
    {
      title: "Contract ticker",
      description: "Read the Bitget USDT-margined perpetual contract for a symbol: last, bid and ask, the index price and the basis between them, the funding rate expressed per interval and per day, open interest, and the change against the UTC day open as well as the rolling 24 hour change. The existing ticker covers spot only, and this market reports an index price, a funding rate and open interest that spot has no field for.",
      inputSchema: z.object({
        symbol: z.string().describe("Symbol like BTCUSDT."),
        productType: z.string().optional().describe("Product type such as USDT-FUTURES. Defaults to USDT-FUTURES."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: contract_ticker ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_bitget_contract_ticker", args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
