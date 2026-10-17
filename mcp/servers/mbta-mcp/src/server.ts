import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { routes } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mbta-mcp", version: "1.0.0" })
  server.registerTool(
    "routes",
    {
      title: "Routes",
      description: "List transit routes.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await routes(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "stops",
    {
      title: "Stops",
      description: "MBTA stops with their description, municipality, platform name and wheelchair boarding level.",
      inputSchema: z.object( { limit: z.number().describe("Max stops, 1 to 100.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement stops locally (paywall removed)
    try { return textError("Not yet implemented: stops") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "alerts",
    {
      title: "Alerts",
      description: "Current MBTA service alerts: header, severity, cause, effect, active window and description.",
      inputSchema: z.object( { limit: z.number().describe("Max alerts, 1 to 25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement alerts locally (paywall removed)
    try { return textError("Not yet implemented: alerts") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
