import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { pricefeed, ticker } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gemini-mcp", version: "1.0.0" })
  server.registerTool(
    "ticker",
    {
      title: "Ticker",
      description: "Ticker for a symbol.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like btcusd.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "pricefeed",
    {
      title: "Pricefeed",
      description: "List current prices.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pricefeed(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "list_symbols",
    {
      title: "List symbols",
      description: "Every symbol Gemini lists for spot trading, optionally filtered, so you can find the right pair before quoting a price.",
      inputSchema: z.object( { search: z.string().describe("Filter the symbol list, e.g. btc.").optional(), limit: z.number().describe("Max symbols.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_symbols ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gemini_list_symbols", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "symbol_details",
    {
      title: "Symbol details",
      description: "A Gemini symbol's trading rules: status, tick size, quote increment, minimum order size and underlying asset.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like BTCUSD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: symbol_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gemini_symbol_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
