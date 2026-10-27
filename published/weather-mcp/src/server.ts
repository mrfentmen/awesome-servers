import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_earthquakes, m0_femaDisasters, m0_forecast, m1_activeAlerts, m1_alertsForPoint } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'weather-mcp', version: '1.0.0' })
server.registerTool(
    "get_forecast",
    {
      title: "Get forecast",
      description: "Get the National Weather Service forecast for coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_forecast(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "get_earthquakes",
    {
      title: "Get earthquakes",
      description: "Get recent earthquakes from USGS.",
      inputSchema: z.object( { days: z.number().describe("1 for the day, 7 for the week.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_earthquakes(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "get_fema_disasters",
    {
      title: "Get fema disasters",
      description: "Get recent FEMA disaster declarations.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_femaDisasters(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "active_alerts",
    {
      title: "Active alerts",
      description: "List active weather alerts for a state.",
      inputSchema: z.object( { state: z.string().describe("Two letter state code like CA.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_activeAlerts(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "alerts_for_point",
    {
      title: "Alerts for point",
      description: "Active alerts near a location.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_alertsForPoint(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "alerts_for_area",
    {
      title: "Alerts for area",
      description: "Active National Weather Service alerts for a whole US state or territory, with severity, urgency and affected area, which a point lookup cannot return.",
      inputSchema: z.object( { area: z.string().describe("Two letter state code, e.g. CA."), limit: z.number().describe("Max alerts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement area locally (paywall removed)
    try { return textError("Not yet implemented: area") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "disasters_by_state",
    {
      title: "Disasters by state",
      description: "FEMA disaster declarations filtered to a single state, newest first, which the national disaster list cannot narrow down.",
      inputSchema: z.object( { state: z.string().describe("Two letter state code, e.g. CA."), limit: z.number().describe("Max declarations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement state locally (paywall removed)
    try { return textError("Not yet implemented: state") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "weather-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )


  return server
}
