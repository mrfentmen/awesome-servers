import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { convert } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "hebcal-mcp", version: "1.0.0" })
  server.registerTool(
    "convert",
    {
      title: "Convert",
      description: "Convert a Gregorian date.",
      inputSchema: z.object( { date: z.string().describe("YYYY-MM-DD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convert(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "month_holidays",
    {
      title: "Month of holidays",
      description: "Every Jewish holiday in one Gregorian month from Hebcal, with its Hebrew date, category and Torah reading.",
      inputSchema: z.object( { year: z.number().describe("Gregorian year.").optional(), month: z.number().describe("Gregorian month 1-12.").optional(), limit: z.number().describe("Max items.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: month_holidays ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_hebcal_month_holidays", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "week_liturgy",
    {
      title: "Week ahead",
      description: "Hebcal's coming week: candle lighting, the weekly Torah portion with its leyning, and havdalah.",
      inputSchema: z.object( { limit: z.number().describe("Max items.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: week_liturgy ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_hebcal_week_liturgy", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
