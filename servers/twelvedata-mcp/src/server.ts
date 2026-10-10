import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { quote, fxHistory } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "twelvedata-mcp", version: "1.0.0" })
  server.registerTool(
    "quote",
    {
      title: "Quote",
      description: "Latest quote for a symbol, e.g. AAPL: price and change.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like AAPL.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await quote(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "fx_board",
    {
      title: "FX board",
      description:
        "The European Central Bank's daily reference rate board against one base currency: every published rate, each currency's move since the prior fixing, the strongest and weakest, the size of the move, and how many currencies the service covers. No API key needed.",
      inputSchema: z.object({
        base: z.string().describe("Base currency code, e.g. EUR or USD. Defaults to EUR.").optional(),
        limit: z.number().describe("Max currencies listed, 1-30. Defaults to 12.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: fx_board ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_twelvedata_fx_board", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "fx_history",
    {
      title: "FX history",
      description:
        "What one currency pair did over a stretch of published ECB fixings: opening and closing rate, net change, the high and low dates, the mean, and every day-to-day step. No API key needed.",
      inputSchema: z.object({
        base: z.string().describe("Base currency code, e.g. EUR."),
        quote: z.string().describe("Quote currency code, e.g. USD."),
        days: z.number().describe("Window in days, 2-400. Defaults to 30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fxHistory(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
