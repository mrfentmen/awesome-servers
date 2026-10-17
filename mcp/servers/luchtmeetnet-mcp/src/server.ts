import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { stations } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "luchtmeetnet-mcp", version: "1.0.0" })
  server.registerTool(
    "stations",
    {
      title: "Stations",
      description: "List air quality stations.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stations(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "current_readings",
    {
      title: "Current readings",
      description: "Latest Luchtmeetnet air quality reading per station, with the station name, location, the pollutant and when it was measured.",
      inputSchema: z.object( { limit: z.number().describe("Max stations.").optional(), formula: z.string().describe("PM25, PM10, NO2 or O3.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement readings locally (paywall removed)
    try { return textError("Not yet implemented: readings") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
