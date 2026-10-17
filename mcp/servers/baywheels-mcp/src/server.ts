import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { stations, systemInfo } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "baywheels-mcp", version: "1.0.0" })
  server.registerTool(
    "stations",
    {
      title: "Stations",
      description: "Bay Wheels stations.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stations(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "network_status",
    {
      title: "Network status",
      description: "Live Bay Wheels availability rolled up for the whole system or one region: bikes, ebikes, free docks, capacity and which stations are actually reporting.",
      inputSchema: z.object( { region: z.string().describe("Region name or id, like San Francisco or 3. Omit for the whole system.").optional(), staleHours: z.number().describe("Treat a station as offline once its report is older than this many hours, 1-24. Defaults to 1.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement status locally (paywall removed)
    try { return textError("Not yet implemented: status") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "station_status",
    {
      title: "Station status",
      description: "One Bay Wheels station by name, short name or id, joined to its live bike and dock counts, capacity share and report freshness.",
      inputSchema: z.object( { station: z.string().describe("Station name or part of it, short name, or station id."), limit: z.number().describe("How many matches to show, 1-25. Defaults to 5.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement status locally (paywall removed)
    try { return textError("Not yet implemented: status") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "system_info",
    {
      title: "System info",
      description: "Bay Wheels system metadata: operator, timezone, every region and the current pricing plans.",
      inputSchema: z.object( { plansLimit: z.number().describe("How many pricing plans to list, 1-50. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await systemInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
