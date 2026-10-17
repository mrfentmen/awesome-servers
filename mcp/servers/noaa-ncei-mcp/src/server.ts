import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { summary } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "noaa-ncei-mcp", version: "1.0.0" })
  server.registerTool(
    "summary",
    {
      title: "Summary",
      description: "Daily summary for a station and date range.",
      inputSchema: z.object( { station: z.string().describe("Station id like USW00013739."), start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await summary(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "station_info",
    {
      title: "Station info",
      description: "Name, position and elevation of a NOAA station, plus which daily-summaries fields it reported on a given day.",
      inputSchema: z.object( { station: z.string().describe("Station id like USW00013739."), date: z.string().max(10).describe("Date to check, YYYY-MM-DD. Defaults to 2024-01-01.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement info locally (paywall removed)
    try { return textError("Not yet implemented: info") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "monthly_climate",
    {
      title: "Monthly climate",
      description: "NOAA monthly climate summaries for a station: mean and extreme temperatures, total precipitation and snowfall, mean wind and the raw daily-count fields.",
      inputSchema: z.object( { station: z.string().describe("Station id like USW00013739."), start: z.string().max(10).describe("Start month YYYY-MM-DD.").optional(), end: z.string().max(10).describe("End month YYYY-MM-DD.").optional(), limit: z.number().int().min(1).max(60).default(12) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement climate locally (paywall removed)
    try { return textError("Not yet implemented: climate") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
