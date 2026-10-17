import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "phemex-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSD.") }),
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
      description: "Live Phemex order book for a perpetual symbol: the top asks and bids with their sizes.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSD."), depth: z.number().int().min(1).max(30).default(5) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement book locally (paywall removed)
    try { return textError("Not yet implemented: book") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "derivatives_metrics",
    {
      title: "Derivatives metrics",
      description: "Perpetual contract metrics from the Phemex 24 hour ticker: index price, mark price, open interest, funding rate and predicted funding rate.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metrics locally (paywall removed)
    try { return textError("Not yet implemented: metrics") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
