import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker, marketRules } from "./api.js"
import { premiumTool } from "./gateway.js"
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
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: order_book ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_whitebit_order_book", args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: recent_trades ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_whitebit_recent_trades", args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await marketRules(args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: asset_networks ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_whitebit_asset_networks", args)) } catch (e) { return textError(error(e)) }
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
    // ---- paywall: transfer_fees ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_whitebit_transfer_fees", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
