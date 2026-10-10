import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { cities, forecast } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ipma-mcp", version: "1.0.0" })
  server.registerTool(
    "cities",
    {
      title: "Cities",
      description: "List forecast cities.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cities(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Daily forecast for a city.",
      inputSchema: z.object( { id: z.number().describe("City global id."), limit: z.number().describe("Max days.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await forecast(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "weather_warnings",
    {
      title: "Weather warnings",
      description: "Active IPMA weather warnings for mainland Portugal, optionally filtered by awareness level and area code.",
      inputSchema: z.object( { level: z.string().describe("green, yellow, orange or red.").optional(), area: z.string().describe("IPMA area code such as LIS, POR, BGC.").optional(), limit: z.number().int().min(1).max(40).default(10).describe("Max warnings.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: weather_warnings ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ipma_weather_warnings", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "station_observations",
    {
      title: "Station observations",
      description: "Latest observations from IPMA's automatic weather stations: temperature, humidity, pressure and wind, with station coordinates.",
      inputSchema: z.object( { station: z.string().describe("Substring of a station name, e.g. Lisboa. Empty lists the first stations.").optional(), limit: z.number().int().min(1).max(25).default(8).describe("Max stations.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: station_observations ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ipma_station_observations", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
