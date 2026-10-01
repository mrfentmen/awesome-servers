import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { list, rate } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bankofcanada-mcp", version: "1.0.0" })
  server.registerTool(
    "rate",
    {
      title: "Rate",
      description: "Latest rate for a series.",
      inputSchema: z.object( { series: z.string().describe("Series id like FXUSDCAD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "list",
    {
      title: "List",
      description: "Available series.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await list(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "rate_range",
    {
      title: "Rate range",
      description: "A Bank of Canada series over a date window rather than just the latest value, with the low and high across the window.",
      inputSchema: z.object( { series: z.string().describe("Series code, e.g. FXUSDCAD."), start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD."), limit: z.number().describe("Max observations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: rate_range ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bankofcanada_rate_range", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
