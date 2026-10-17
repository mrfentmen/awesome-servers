import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { forecast } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "marine-forecast-mcp", version: "1.0.0" })
  server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Marine forecast for a location.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude."), days: z.number().describe("Forecast days.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await forecast(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "daily_summary",
    {
      title: "Daily summary",
      description: "Day by day maximum wave height, maximum wave period and dominant wave direction for a sea point.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude."), days: z.number().int().min(1).max(8).default(3) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement summary locally (paywall removed)
    try { return textError("Not yet implemented: summary") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "wave_partition",
    {
      title: "Wave partition",
      description: "The current sea state split into wind wave and swell: height, direction and period of each, plus sea surface temperature.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement partition locally (paywall removed)
    try { return textError("Not yet implemented: partition") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
