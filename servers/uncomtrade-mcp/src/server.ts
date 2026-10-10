import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { trade } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "uncomtrade-mcp", version: "1.0.0" })
  server.registerTool(
    "trade",
    {
      title: "Trade",
      description: "Preview trade data.",
      inputSchema: z.object( { reporter: z.number().describe("Reporter code like 842."), period: z.string().describe("Period like 2023.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trade(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "reporter_lookup",
    {
      title: "Reporter lookup",
      description: "Resolve a country name, ISO code or number into the UN Comtrade reporter code the trade tool needs.",
      inputSchema: z.object( { country: z.string().describe("Country name, ISO code or reporter code, e.g. Japan, JP or 392."), limit: z.number().describe("Max matches.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: reporter_lookup ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_uncomtrade_reporter_lookup", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "commodity_code",
    {
      title: "Commodity code",
      description: "Look up UN Comtrade HS2022 commodity codes by prefix or name, so you can name a product before querying trade data.",
      inputSchema: z.object( { code: z.string().describe("HS code prefix, e.g. 0901.").optional(), search: z.string().describe("Search the description, e.g. coffee.").optional(), limit: z.number().describe("Max codes.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: commodity_code ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_uncomtrade_commodity_code", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
