import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, marketRules } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "whitebit-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a market.",
      inputSchema: z.object( { market: z.string().describe("Market like BTC_USDT.") }),
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
      description: "Top asks and bids for a market.",
      inputSchema: z.object( { market: z.string().describe("Market like BTC_USDT."), depth: z.number().describe("Levels per side.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement book locally (paywall removed)
    try { return textError("Not yet implemented: book") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "recent_trades",
    {
      title: "Recent trades",
      description: "Most recent public trades for a market.",
      inputSchema: z.object( { market: z.string().describe("Market like BTC_USDT."), limit: z.number().describe("Max trades.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement trades locally (paywall removed)
    try { return textError("Not yet implemented: trades") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "market_rules",
    {
      title: "Market trading rules",
      description: "Market minimum orders and price and quantity increments.",
      inputSchema: z.object( { market: z.string().describe("Optional exact market, e.g. BTC_USDT.").optional(), limit: z.number().describe("Maximum markets, 1-40.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await marketRules(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "asset_networks",
    {
      title: "Asset networks",
      description: "Deposit and withdrawal networks and required confirmations for an asset.",
      inputSchema: z.object( { asset: z.string().describe("Asset ticker, defaults to BTC.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement networks locally (paywall removed)
    try { return textError("Not yet implemented: networks") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "transfer_fees",
    {
      title: "Transfer fees",
      description: "Public deposit and withdrawal fees and amount limits for an asset.",
      inputSchema: z.object( { asset: z.string().describe("Asset ticker, defaults to BTC.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement fees locally (paywall removed)
    try { return textError("Not yet implemented: fees") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
