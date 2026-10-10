import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bithumb-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a coin.",
      inputSchema: z.object( { coin: z.string().describe("Coin like BTC.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "all_tickers",
    {
      title: "All tickers",
      description: "Ranked Bithumb market for every listed coin in KRW or BTC, showing last price, 24 hour change, volume and traded value.",
      inputSchema: z.object( { quote: z.string().describe("KRW or BTC.").optional(), sort_by: z.string().describe("value, volume or change.").optional(), limit: z.number().describe("Max coins.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: all_tickers ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bithumb_all_tickers", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "coin_order_book",
    {
      title: "Coin order book",
      description: "Bithumb KRW order book for one coin with best bid and ask, spread, mid price and the full ladder of both sides.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol, e.g. BTC."), limit: z.number().describe("Levels per side.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: coin_order_book ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bithumb_coin_order_book", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
