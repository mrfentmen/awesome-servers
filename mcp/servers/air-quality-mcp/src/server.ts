import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { airQuality } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "air-quality-mcp", version: "1.0.0" })
  server.registerTool(
    "air_quality",
    {
      title: "Air quality",
      description: "Get the current air quality index for a location.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await airQuality(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "air_forecast",
    {
      title: "Air quality forecast",
      description: "Day by day PM2.5 forecast for a location, with the cleanest and dirtiest hours.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), days: z.number().describe("Forecast days, 1 to 3.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: air_forecast ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_air_quality_air_forecast", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "pollen_report",
    {
      title: "Pollen report",
      description: "Current pollen counts for the six main allergens at a location, with the European AQI.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: pollen_report ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_air_quality_pollen_report", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
