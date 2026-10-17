import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { indicators } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "un-sdg-mcp", version: "1.0.0" })
  server.registerTool(
    "indicators",
    {
      title: "Indicators",
      description: "List SDG indicators.",
      inputSchema: z.object( { goal: z.string().describe("Goal number like 3.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await indicators(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "goals",
    {
      title: "Goals",
      description: "The 17 UN Sustainable Development Goals with their official title and description.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(17).default(17).describe("Max goals.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement goals locally (paywall removed)
    try { return textError("Not yet implemented: goals") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "series",
    {
      title: "Series",
      description: "Global SDG indicator series for a goal or an indicator, with the targets each series reports and its data release.",
      inputSchema: z.object( { goal: z.string().max(4).describe("Goal number like 3.").optional(), indicator: z.string().max(12).describe("Indicator code like 1.1.1.").optional(), limit: z.number().int().min(1).max(60).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement series locally (paywall removed)
    try { return textError("Not yet implemented: series") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
