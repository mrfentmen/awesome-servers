import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ticker } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "independent-reserve-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Market summary for a pair.",
      inputSchema: z.object( { primary: z.string().describe("Primary currency like btc."), secondary: z.string().describe("Secondary like usd.") }),
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
      description: "Top bids and asks for a currency pair on Independent Reserve, with order type, volume and the spread.",
      inputSchema: z.object({ primary: z.string().describe("Primary currency like xbt."), secondary: z.string().describe("Secondary like usd."), depth: z.number().describe("Levels per side, 1-20, default 5.").optional() }),
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
      description: "Most recent trades printed for a currency pair on Independent Reserve: time, amount, price and taker side.",
      inputSchema: z.object({ primary: z.string().describe("Primary currency like xbt."), secondary: z.string().describe("Secondary like usd."), count: z.number().describe("Max trades, 1-50, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement trades locally (paywall removed)
    try { return textError("Not yet implemented: trades") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "supported_currencies",
    {
      title: "Supported currencies",
      description: "The primary and secondary currency codes Independent Reserve currently lists for its public market data.",
      inputSchema: z.object({  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement currencies locally (paywall removed)
    try { return textError("Not yet implemented: currencies") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
