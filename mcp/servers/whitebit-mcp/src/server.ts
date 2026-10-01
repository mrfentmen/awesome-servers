import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ticker, orderBook, recentTrades } from "./api.js"
import { premiumRequired } from "./license.js"

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
    const paywallMessage = await premiumRequired("order_book")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await orderBook(args)) } catch (e) { return textError(error(e)) }
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
    const paywallMessage = await premiumRequired("recent_trades")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await recentTrades(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
