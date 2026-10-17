import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { declarations, declarationTotals } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fema-mcp", version: "1.0.0" })
  server.registerTool(
    "declarations",
    {
      title: "Declarations",
      description: "Disaster declarations for a state.",
      inputSchema: z.object( { state: z.string().describe("State code like CA."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await declarations(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "declaration_lookup",
    {
      title: "Declaration lookup",
      description: "One disaster by its FEMA disaster number: the incident period, the programs declared, the region and every designated area under it. The declarations tool can only list a state's recent records.",
      inputSchema: z.object( { disaster_number: z.number().describe("The FEMA disaster number, like 5672.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "declaration_totals",
    {
      title: "Declaration totals",
      description: "How many disaster declaration records FEMA holds, for one fiscal year or for the whole dataset, with a breakdown of the incident and declaration types over the first hundred records.",
      inputSchema: z.object( { year: z.number().describe("Fiscal year to count, like 2026. Omit for the whole dataset.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await declarationTotals(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
